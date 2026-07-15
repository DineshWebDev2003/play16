<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        $authUser = $request->user();
        $query = User::where('role', 'student');

        if (!$authUser->isMasterAdmin() && $authUser->branch_id) {
            $query->byBranch($authUser->branch_id);
        }

        return response()->json($query->with('branch')->get());
    }

    public function show(Request $request, $id)
    {
        $authUser = $request->user();
        $query = User::where('role', 'student');

        if (!$authUser->isMasterAdmin() && $authUser->branch_id) {
            $query->byBranch($authUser->branch_id);
        }

        return response()->json($query->with('branch')->findOrFail($id));
    }

    public function store(Request $request)
    {
        $authUser = $request->user();

        $validated = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:6',
            'student_id' => 'required|string',
            'parent_name' => 'nullable|string',
            'address' => 'nullable|string',
            'status' => 'nullable|in:active,inactive',
        ]);

        $validated['password'] = Hash::make($request->password);
        $validated['role'] = 'student';

        if (!$authUser->isMasterAdmin() && $authUser->branch_id) {
            $validated['branch_id'] = $authUser->branch_id;
        }

        $user = User::create($validated);
        return response()->json($user->load('branch'), 201);
    }
}
