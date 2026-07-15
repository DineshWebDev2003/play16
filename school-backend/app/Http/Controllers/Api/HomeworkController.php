<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Homework;
use App\Services\ExpoNotificationService;

class HomeworkController extends Controller
{
    protected $notificationService;

    public function __construct(ExpoNotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function index(Request $request)
    {
        $authUser = $request->user();
        $query = Homework::latest();

        if (!$authUser->isMasterAdmin() && $authUser->branch_id) {
            $teacherIds = User::byBranch($authUser->branch_id)->where('role', 'teacher')->pluck('id');
            $query->whereIn('teacher_id', $teacherIds);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $authUser = $request->user();

        $validated = $request->validate([
            'title' => 'required|string',
            'description' => 'required|string',
            'subject' => 'nullable|string',
            'class_name' => 'nullable|string',
            'due_date' => 'required|string',
            'teacher_id' => 'required|integer',
        ]);

        $homework = Homework::create($validated);

        // Notify students about new homework
        $this->notificationService->notifyRole('student', "New Homework: " . $homework->title, "Subject: " . ($homework->subject ?: 'General') . ". Due: " . $homework->due_date, [
            'screen' => 'homework',
            'id' => $homework->id
        ]);

        // Notify admins (all copies)
        $this->notificationService->notifyRole('admin', "[ADMIN COPY] New Homework: " . $homework->title, "Teacher assigned homework. Subject: " . ($homework->subject ?: 'General') . ". Due: " . $homework->due_date, [
            'screen' => 'homework',
            'id' => $homework->id
        ]);

        return response()->json($homework, 201);
    }
}
