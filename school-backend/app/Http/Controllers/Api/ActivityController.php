<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Activity;
use App\Models\Comment;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class ActivityController extends Controller
{
    public function index(Request $request)
    {
        $authUser = $request->user();
        $query = Activity::with(['students', 'comments.user'])->latest();

        if ($authUser->isMasterAdmin() && $request->has('branch_id')) {
            $query->byBranch($request->branch_id);
        } elseif (!$authUser->isMasterAdmin() && $authUser->branch_id) {
            $query->where(function ($q) use ($authUser) {
                $q->byBranch($authUser->branch_id)->orWhereNull('branch_id');
            });
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $authUser = $request->user();
        Log::info('Activity Store Request Payload:', $request->all());

        $validator = Validator::make($request->all(), [
            'title' => 'required|string',
            'description' => 'required|string',
            'media_type' => 'required|in:image,video',
            'date' => 'required|string',
            'author' => 'required|string',
            'student_ids' => 'required|array',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'media_file' => 'nullable|file|max:102400', // 100MB
            'thumbnail_file' => 'nullable|file|max:10240', // 10MB
        ]);

        if ($validator->fails()) {
            Log::error('ACTIVITY_VALIDATION_ERROR_LOG:', [
                'errors' => $validator->errors()->toArray(),
                'request' => $request->all()
            ]);
            return response()->json([
                'message' => 'ACTIVITY_VALIDATION_ERROR',
                'errors' => $validator->errors()
            ], 422);
        }

        $validated = $validator->validated();

        if (!$authUser->isMasterAdmin() && $authUser->branch_id) {
            $validated['branch_id'] = $authUser->branch_id;
        }
        
        // Remove placeholder if sent from mobile app
        $inputMediaUrl = $request->input('media_url');
        if ($inputMediaUrl === 'uploading_file') {
            $inputMediaUrl = null;
        }
        $validated['media_url'] = $inputMediaUrl;
        $validated['thumbnail_url'] = $request->input('thumbnail_url');

        // 1. Handle Media URL (Base64 Fallback or Physical Upload)
        if ($request->hasFile('media_file')) {
            $file = $request->file('media_file');
            $ext = $file->getClientOriginalExtension() ?: ($request->media_type === 'video' ? 'mp4' : 'jpg');
            $filename = 'activity_' . time() . '_' . rand(100, 999) . '.' . $ext;

            Log::info('Saving physical media file:', ['filename' => $filename, 'type' => $file->getMimeType()]);
            $path = $file->storeAs('activities', $filename, 'public');
            $validated['media_url'] = $path;
        }
        elseif (isset($request->all()['media_url']) && str_starts_with($request->media_url, 'data:')) {
            Log::info('Saving base64 media data...');
            $data = explode(',', $request->media_url)[1];
            $ext = str_contains($request->media_url, 'video') ? 'mp4' : 'jpg';
            $filename = 'activity_' . time() . '.' . $ext;
            Storage::disk('public')->put('activities/' . $filename, base64_decode($data));
            $validated['media_url'] = 'activities/' . $filename;
        }

        // CRITICAL: If still no media_url after file check, then the upload failed (likely size limit)
        if (empty($validated['media_url'])) {
            Log::error('ACTIVITY_UPLOAD_FAILED: No file received and no URL provided.');
            return response()->json([
                'message' => 'MEDIA_UPLOAD_FAILED',
                'errors' => ['media_file' => ['The file was not received. Checked your server\'s upload_max_filesize limit.']]
            ], 422);
        }

        // 2. Handle Thumbnail URL (Physical or Base64)
        if ($request->hasFile('thumbnail_file')) {
            $file = $request->file('thumbnail_file');
            $ext = $file->getClientOriginalExtension() ?: 'jpg';
            $filename = 'thumb_' . time() . '_' . rand(100, 999) . '.' . $ext;

            Log::info('Saving physical thumbnail:', ['filename' => $filename]);
            $path = $file->storeAs('activities/thumbs', $filename, 'public');
            $validated['thumbnail_url'] = $path;
        }
        elseif (isset($request->all()['thumbnail_url']) && str_starts_with($request->thumbnail_url, 'data:')) {
            $data = explode(',', $request->thumbnail_url)[1];
            $filename = 'activity_thumb_' . time() . '.jpg';
            Storage::disk('public')->put('activities/' . $filename, base64_decode($data));
            $validated['thumbnail_url'] = 'activities/' . $filename;
        }

        Log::info('Final Save Paths:', [
            'media' => $validated['media_url'] ?? 'none',
            'thumb' => $validated['thumbnail_url'] ?? 'none'
        ]);

        $activity = Activity::create($validated);
        $activity->students()->sync($request->student_ids);

        // Send push notification to tagged students
        try {
            $this->notifyTaggedUsers($activity, "New Activity: " . $activity->title, "Tagged Mention: " . ($activity->author ?: 'Teacher'), 'activity');
        } catch (\Exception $e) {
            Log::error('Activity push notification failed: ' . $e->getMessage());
        }

        // Also notify the poster (master admin) so they can see the notification output
        try {
            if ($authUser->push_token) {
                $imagePath = $activity->thumbnail_url ?: $activity->media_url;
                $base = config('app.push_image_base_url');
                $fullImageUrl = $imagePath ? ($base ? rtrim($base, '/') . '/storage/' . $imagePath : asset('storage/' . $imagePath)) : null;
                $service = app(\App\Services\ExpoNotificationService::class);
                $service->send($authUser->push_token, "New Activity: " . $activity->title, $activity->description, [
                    'screen' => 'activityFeed',
                    'id' => $activity->id,
                    'image' => $fullImageUrl
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Activity self-notify failed: ' . $e->getMessage());
        }

        return response()->json($activity->load(['students', 'comments.user']), 201);
    }

    public function destroy(Request $request, $id)
    {
        $authUser = $request->user();
        $activity = Activity::findOrFail($id);

        if (!$authUser->isMasterAdmin() && $authUser->branch_id && $activity->branch_id !== $authUser->branch_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $activity->students()->detach();
        $activity->delete();

        return response()->json(['message' => 'Activity deleted successfully']);
    }

    public function like(Request $request, $id)
    {
        $activity = Activity::findOrFail($id);
        $activity->increment('likes_count');

        return response()->json($activity->load(['students', 'comments.user']));
    }

    public function comment(Request $request, $id)
    {
        $request->validate([
            'text' => 'required|string',
        ]);

        $comment = Comment::create([
            'activity_id' => $id,
            'user_id' => $request->user()->id,
            'text' => $request->text,
        ]);

        $activity = Activity::findOrFail($id);

        return response()->json($comment->load('user'), 201);
    }

    /**
     * Helper to notify all students/users tagged in an activity
     */
    private function notifyTaggedUsers(Activity $activity, $title, $body, $type = 'activity', $excludeUserId = null)
    {
        $students = $activity->students()
            ->where('role', 'student')
            ->whereNotNull('push_token')
            ->distinct()
            ->get();

        $notified = [];
        $service = app(\App\Services\ExpoNotificationService::class);

        $imagePath = $activity->thumbnail_url ?: $activity->media_url;
        $base = config('app.push_image_base_url');
        $fullImageUrl = $imagePath ? ($base ? rtrim($base, '/') . '/storage/' . $imagePath : asset('storage/' . $imagePath)) : null;

        foreach ($students as $student) {
            if ($excludeUserId && $student->id === $excludeUserId) {
                continue;
            }
            if (in_array($student->id, $notified)) {
                continue;
            }
            $notified[] = $student->id;

            $service->notifyUser($student->id, $title, $body, [
                'screen' => 'activityFeed',
                'id' => $activity->id,
                'image' => $fullImageUrl
            ], $type);
        }
    }
}
