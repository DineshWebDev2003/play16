<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Attendance;
use App\Models\User;
use App\Services\ExpoNotificationService;

class AttendanceController extends Controller
{
    protected $notificationService;

    public function __construct(ExpoNotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }
    public function index(Request $request)
    {
        $authUser = $request->user();
        $query = Attendance::query();

        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }
        if ($request->has('user_role')) {
            $query->where('user_role', $request->user_role);
        }
        if ($request->has('date')) {
            $query->where('date', $request->date);
        }

        // Branch scoping
        if ($authUser->isMasterAdmin() && $request->has('branch_id')) {
            $studentIds = User::byBranch($request->branch_id)->pluck('id');
            $query->whereIn('student_id', $studentIds);
        } elseif (!$authUser->isMasterAdmin() && $authUser->branch_id) {
            $studentIds = User::byBranch($authUser->branch_id)->pluck('id');
            $query->whereIn('student_id', $studentIds);
        }

        return response()->json($query->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|integer',
            'date' => 'required|date',
            'status' => 'required|in:present,absent,late',
            'in_time' => 'nullable|string',
            'out_time' => 'nullable|string',
            'dropped_by_type' => 'nullable|string',
            'picked_by_type' => 'nullable|string',
            'dropped_by_name' => 'nullable|string',
            'picked_by_name' => 'nullable|string',
            'user_role' => 'nullable|string',
            'remarks' => 'nullable|string',
        ]);

        $existing = Attendance::where('student_id', $request->student_id)
            ->where('date', $request->date)
            ->first();

        $attendance = Attendance::updateOrCreate(
            ['student_id' => $request->student_id, 'date' => $request->date],
            $validated
        );

        // Only notify on new attendance, not on updates
        $isUpdate = $existing !== null;
        if ($isUpdate) {
            return response()->json($attendance, 201);
        }

        // Determine the role context for the notification
        $isTeacher = ($attendance->user_role === 'teacher');
        $isStudent = ($attendance->user_role === 'student' || !$attendance->user_role);
        $roleLabel = $isTeacher ? 'Staff' : 'Student';

        // Build notification body
        $body = "Attendance for " . $attendance->date . " marked as " . ucfirst($attendance->status) . ".";
        if ($attendance->in_time && !$attendance->out_time) {
            $body = $roleLabel . " marked IN at " . $attendance->in_time . " by " . $attendance->dropped_by_type . " (" . $attendance->dropped_by_name . ")";
        } elseif ($attendance->out_time) {
            $body = $roleLabel . " marked OUT at " . $attendance->out_time . " by " . $attendance->picked_by_type . " (" . $attendance->picked_by_name . ")";
        }

        // Notify the student — skip if a teacher is marking
        $authUser = $request->user();
        if ($isStudent && !($authUser && $authUser->role === 'teacher')) {
            $this->notificationService->notifyUser($attendance->student_id, "Attendance Update", $body, [
                'screen' => 'attendance',
                'student_id' => $attendance->student_id,
            ], 'attendance');
        }

        // Notify branch admins about staff attendance
        if ($isTeacher) {
            $teacherUser = \App\Models\User::find($attendance->student_id);
            $teacherName = $request->student_name ?: ($teacherUser ? $teacherUser->name : "Teacher #" . $attendance->student_id);
            $teacherBody = "Staff " . $teacherName . " " . ($attendance->out_time ? "clocked OUT at " . $attendance->out_time : "clocked IN at " . $attendance->in_time);

            $branchId = $teacherUser ? $teacherUser->branch_id : null;
            $this->notificationService->notifyRole('admin', "Staff Attendance", $teacherBody, [
                'screen' => 'teacherAttendanceReport',
                'student_id' => $attendance->student_id,
            ], 'attendance');
        }

        return response()->json($attendance, 201);
    }
}
