<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\HomeworkController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\BackupController;
use App\Http\Controllers\Api\TimetableController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\FeeController;
use App\Http\Controllers\Api\FeeStructureController;
use App\Http\Controllers\Api\CameraController;
use App\Http\Controllers\Api\BranchController;

// Public routes
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/auth/google', [AuthController::class, 'googleLogin']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/update-push-token', [AuthController::class, 'updatePushToken']);
    Route::post('/update-notification-settings', [AuthController::class, 'updateNotificationSettings']);

    // Users Management
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // Students
    Route::get('/students', [StudentController::class, 'index']);
    Route::get('/students/{id}', [StudentController::class, 'show']);
    Route::post('/students', [StudentController::class, 'store']);

    // Announcements
    Route::get('/announcements', [AnnouncementController::class, 'index']);
    Route::post('/announcements', [AnnouncementController::class, 'store']);
    Route::delete('/announcements/{id}', [AnnouncementController::class, 'destroy']);

    // Activities
    Route::get('/activities', [ActivityController::class, 'index']);
    Route::post('/activities', [ActivityController::class, 'store']);
    Route::delete('/activities/{id}', [ActivityController::class, 'destroy']);
    Route::post('/activities/{id}/like', [ActivityController::class, 'like']);
    Route::post('/activities/{id}/comment', [ActivityController::class, 'comment']);

    // Transactions (Finance)
    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::post('/transactions', [TransactionController::class, 'store']);
    Route::put('/transactions/{id}', [TransactionController::class, 'update']);
    Route::delete('/transactions/{id}', [TransactionController::class, 'destroy']);
    Route::post('/transactions/{id}/approve', [TransactionController::class, 'approve']);
    Route::post('/transactions/{id}/reject', [TransactionController::class, 'reject']);

    // Homework
    Route::get('/homework', [HomeworkController::class, 'index']);
    Route::post('/homework', [HomeworkController::class, 'store']);

    // Attendance
    Route::get('/attendance', [AttendanceController::class, 'index']);
    Route::post('/attendance', [AttendanceController::class, 'store']);

    // Timetable
    Route::get('/timetable', [TimetableController::class, 'index']);
    Route::post('/timetable', [TimetableController::class, 'store']);
    Route::put('/timetable/{id}', [TimetableController::class, 'update']);
    Route::delete('/timetable/{id}', [TimetableController::class, 'destroy']);

    // Backup & Restore
    Route::get('/backup/export', [BackupController::class, 'export']);
    Route::post('/backup/import', [BackupController::class, 'import']);

    // Fees & Structures
    Route::get('/fees', [FeeController::class, 'index']);
    Route::post('/fees', [FeeController::class, 'store']);
    Route::put('/fees/{id}', [FeeController::class, 'update']);
    Route::delete('/fees/{id}', [FeeController::class, 'destroy']);
    Route::post('/fees/{id}/toggle-status', [FeeController::class, 'toggleStatus']);

    Route::get('/fee-structures', [FeeStructureController::class, 'index']);
    Route::post('/fee-structures', [FeeStructureController::class, 'store']);
    Route::put('/fee-structures/{id}', [FeeStructureController::class, 'update']);
    Route::delete('/fee-structures/{id}', [FeeStructureController::class, 'destroy']);

    // Reports & Dashboard
    Route::get('/reports', [ReportController::class, 'index']);

    // Cameras
    Route::post('cameras/refresh', [CameraController::class, 'refresh']);
    Route::apiResource('cameras', CameraController::class);

    // Branches (master_admin only)
    Route::apiResource('branches', BranchController::class);
});
