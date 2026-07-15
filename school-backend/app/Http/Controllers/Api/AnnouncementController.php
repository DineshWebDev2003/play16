<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Announcement;
use App\Services\ExpoNotificationService;

class AnnouncementController extends Controller
{
    protected $notificationService;

    public function __construct(ExpoNotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }
    public function index(Request $request)
    {
        $authUser = $request->user();
        $query = Announcement::latest();

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

        $validated = $request->validate([
            'title' => 'required|string',
            'content' => 'required|string',
            'image_url' => 'nullable|string',
            'date' => 'required|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'target' => 'required|string|in:all,student,teacher,admin',
            'author' => 'required|string',
            'branch_id' => 'nullable|integer|exists:branches,id',
        ]);

        if (!$authUser->isMasterAdmin() && $authUser->branch_id) {
            $validated['branch_id'] = $authUser->branch_id;
        }

        // Save physical file if image is base64
        $imageUrl = $request->input('image_url') ?: $request->input('image');
        if ($imageUrl && str_starts_with($imageUrl, 'data:')) {
            $imageData = explode(',', $imageUrl)[1];
            $ext = 'jpg';
            if (str_contains($imageUrl, 'png'))
                $ext = 'png';
            $filename = 'announcement_' . time() . '.' . $ext;
            \Illuminate\Support\Facades\Storage::disk('public')->put('announcements/' . $filename, base64_decode($imageData));
            $validated['image_url'] = 'announcements/' . $filename;
        }

        $announcement = Announcement::create($validated);

        // Skip push notifications for test announcements
        if (!str_contains(strtolower($announcement->title), 'test')) {
            try {
                $title = "New Announcement: " . $announcement->title;
                $body = $announcement->content;

                $actualImageUrl = null;
                if ($announcement->image_url) {
                    $base = config('app.push_image_base_url');
                    $path = 'storage/' . $announcement->image_url;
                    $actualImageUrl = $base ? rtrim($base, '/') . '/' . $path : asset($path);
                }

                $notificationData = [
                    'screen' => 'announcements',
                    'id' => $announcement->id,
                    'image' => $actualImageUrl
                ];

                if ($announcement->target === 'all') {
                    $this->notificationService->notifyAll($title, $body, $notificationData, null, $authUser->id);
                } else {
                    $this->notificationService->notifyRole($announcement->target, $title, $body, $notificationData, null, $authUser->id);
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Announcement push notification failed: ' . $e->getMessage());
            }
        }

        return response()->json($announcement, 201);
    }

    public function destroy($id)
    {
        Announcement::destroy($id);
        return response()->json(['message' => 'Announcement deleted']);
    }

    public function notify($id, Request $request)
    {
        $authUser = $request->user();
        $announcement = Announcement::findOrFail($id);

        $title = "New Announcement: " . $announcement->title;
        $body = $announcement->content;

        $actualImageUrl = null;
        if ($announcement->image_url) {
            $base = config('app.push_image_base_url');
            $path = 'storage/' . $announcement->image_url;
            $actualImageUrl = $base ? rtrim($base, '/') . '/' . $path : asset($path);
        }

        $notificationData = [
            'screen' => 'announcements',
            'id' => $announcement->id,
            'image' => $actualImageUrl
        ];

        try {
            if ($announcement->target === 'all') {
                $this->notificationService->notifyAll($title, $body, $notificationData, null, $authUser->id);
            } else {
                $this->notificationService->notifyRole($announcement->target, $title, $body, $notificationData, null, $authUser->id);
            }
            return response()->json(['message' => 'Notification sent']);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Notify announcement failed: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to send notification'], 500);
        }
    }
}
