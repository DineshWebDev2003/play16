<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Transaction;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $authUser = $request->user();
        $branchId = !$authUser->isMasterAdmin() ? $authUser->branch_id : null;

        // Helper to scope queries
        $userQuery = User::query();
        $transactionQuery = Transaction::query();
        $attendanceQuery = Attendance::query();

        if ($branchId) {
            $userQuery->byBranch($branchId);
            $transactionQuery->byBranch($branchId);

            $branchStudentIds = User::byBranch($branchId)->where('role', 'student')->pluck('id');
            $attendanceQuery->whereIn('student_id', $branchStudentIds);
        }

        // 1. Student Enrollment
        $totalStudents = (clone $userQuery)->where('role', 'student')->count();

        // 2. Active Teachers
        $totalTeachers = (clone $userQuery)->where('role', 'teacher')->count();

        // 3. Total Revenue
        $totalRevenue = (clone $transactionQuery)->sum('amount');

        // 4. Pending Fees
        $targetFeePerStudent = 25000;
        $totalTargetRevenue = $totalStudents * $targetFeePerStudent;
        $pendingFees = max(0, $totalTargetRevenue - $totalRevenue);

        // 5. Attendance Rate
        $today = Carbon::today()->toDateString();
        $totalAttendanceRecords = (clone $attendanceQuery)->where('date', $today)->count();
        if ($totalAttendanceRecords > 0) {
            $presentCount = (clone $attendanceQuery)->where('date', $today)->where('status', 'present')->count();
            $attendanceRate = round(($presentCount / $totalAttendanceRecords) * 100);
        } else {
            $attendanceRate = 0;
        }

        // 6. New Admissions (In the last 30 days)
        $newAdmissions = (clone $userQuery)->where('role', 'student')
            ->where('created_at', '>=', Carbon::now()->subDays(30))
            ->count();

        // 7. Recent Activity
        $recentTransactions = (clone $transactionQuery)->latest()->take(5)->get()->map(function ($t) {
            return [
                'type' => 'payment',
                'title' => 'Fee Payment Received',
                'description' => $t->name . ' paid ₹' . number_format($t->amount),
                'time' => $t->created_at->diffForHumans(),
                'icon' => 'currency-inr',
                'color' => 'bg-green-500'
            ];
        });

        $recentStudents = (clone $userQuery)->where('role', 'student')->latest()->take(5)->get()->map(function ($s) {
            return [
                'type' => 'enrollment',
                'title' => 'New Student Enrolled',
                'description' => $s->name . ' - ' . ($s->category ?? 'General'),
                'time' => $s->created_at->diffForHumans(),
                'icon' => 'account-plus',
                'color' => 'bg-blue-500'
            ];
        });

        $recentActivity = $recentTransactions->concat($recentStudents)->sortByDesc(function ($item) {
            return $item['time'];
        })->values()->take(5);

        return response()->json([
            'overview' => [
                ['id' => '1', 'title' => 'Student Enrollment', 'value' => (string) $totalStudents, 'icon' => 'account-group', 'color' => 'bg-blue-500'],
                ['id' => '2', 'title' => 'Total Revenue', 'value' => '₹' . number_format($totalRevenue), 'icon' => 'currency-inr', 'color' => 'bg-green-500'],
                ['id' => '3', 'title' => 'Pending Fees', 'value' => '₹' . number_format($pendingFees), 'icon' => 'alert-circle', 'color' => 'bg-orange-500'],
                ['id' => '4', 'title' => 'Active Teachers', 'value' => (string) $totalTeachers, 'icon' => 'account-tie', 'color' => 'bg-purple-500'],
                ['id' => '5', 'title' => 'Attendance Rate', 'value' => $attendanceRate . '%', 'icon' => 'check-circle', 'color' => 'bg-teal-500'],
                ['id' => '6', 'title' => 'New Admissions', 'value' => (string) $newAdmissions, 'icon' => 'account-plus', 'color' => 'bg-pink-500'],
            ],
            'recentActivity' => $recentActivity
        ]);
    }
}
