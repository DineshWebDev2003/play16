<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $authUser = $request->user();

        if ($authUser->isMasterAdmin()) {
            $query = User::with('branch');
            if ($request->has('branch_id')) {
                $query->byBranch($request->branch_id);
            }
            return response()->json($query->get());
        }

        if ($authUser->branch_id) {
            return response()->json(User::with('branch')->byBranch($authUser->branch_id)->get());
        }

        return response()->json(User::with('branch')->get());
    }

    public function store(Request $request)
    {
        $authUser = $request->user();

        $roleRule = 'required|in:master_admin,admin,teacher,student';

        if ($authUser->isAdmin()) {
            $roleRule = 'required|in:teacher,student';
        }

        $validated = $request->validate([
            'name' => 'required|string',
            'username' => 'required|string|unique:users,username',
            'date_of_birth' => 'nullable|date',
            'email' => 'nullable|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => $roleRule,
            'branch_id' => 'nullable|integer|exists:branches,id',
            'phone' => 'nullable|string',
            'gender' => 'nullable|string',
            'student_id' => 'nullable|string',
            'teacher_id' => 'nullable|string',
            'father_name' => 'nullable|string',
            'mother_name' => 'nullable|string',
            'father_phone' => 'nullable|string',
            'mother_phone' => 'nullable|string',
            'category' => 'nullable|in:Playschool,PreKG,Daycare',
            'status' => 'nullable|in:active,inactive',
            'parent_name' => 'nullable|string',
            'guardian_phone' => 'nullable|string',
            'blood_group' => 'nullable|string',
            'address' => 'nullable|string',
            'student_photo' => 'nullable|string',
            'father_photo' => 'nullable|string',
            'mother_photo' => 'nullable|string',
            'guardian_photo' => 'nullable|string',
            'fees' => 'nullable|string',
            'admission_date' => 'nullable|string',
            'fee_due_day' => 'nullable|string',
        ]);

        // Auto-assign branch_id for non-master_admin users
        if (!$authUser->isMasterAdmin() && $authUser->branch_id) {
            $validated['branch_id'] = $authUser->branch_id;
        }

        $validated['password'] = Hash::make($request->password);

        $user = User::create($validated);
        return response()->json($user->load('branch'), 201);
    }

    public function update(Request $request, $id)
    {
        $authUser = $request->user();
        $user = User::findOrFail($id);

        // Branch admins can only update users in their branch
        if (!$authUser->isMasterAdmin() && $authUser->branch_id && $user->branch_id !== $authUser->branch_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $roleRule = 'sometimes|in:admin,teacher,student,master_admin';

        if ($authUser->isAdmin()) {
            $roleRule = 'sometimes|in:teacher,student';
        }

        $validated = $request->validate([
            'name' => 'sometimes|string',
            'username' => 'sometimes|string|unique:users,username,' . $id,
            'date_of_birth' => 'nullable|date',
            'email' => 'nullable|email|unique:users,email,' . $id,
            'role' => $roleRule,
            'branch_id' => 'nullable|integer|exists:branches,id',
            'status' => 'sometimes|in:active,inactive',
            'phone' => 'nullable|string',
            'gender' => 'nullable|string',
            'father_name' => 'nullable|string',
            'mother_name' => 'nullable|string',
            'father_phone' => 'nullable|string',
            'mother_phone' => 'nullable|string',
            'category' => 'nullable|in:Playschool,PreKG,Daycare',
            'avatar' => 'nullable|string',
            'password' => 'sometimes|string|min:6',
            'parent_name' => 'nullable|string',
            'guardian_phone' => 'nullable|string',
            'blood_group' => 'nullable|string',
            'address' => 'nullable|string',
            'student_photo' => 'nullable|string',
            'father_photo' => 'nullable|string',
            'mother_photo' => 'nullable|string',
            'guardian_photo' => 'nullable|string',
            'fees' => 'nullable|string',
            'admission_date' => 'nullable|string',
            'student_id' => 'nullable|string',
            'teacher_id' => 'nullable|string',
            'fee_due_day' => 'nullable|string',
        ]);

        if ($request->has('password')) {
            $validated['password'] = Hash::make($request->password);
        }

        $user->update($validated);
        return response()->json($user->load('branch'));
    }

    public function destroy(Request $request, $id)
    {
        $authUser = $request->user();
        $user = User::findOrFail($id);

        if (!$authUser->isMasterAdmin() && $authUser->branch_id && $user->branch_id !== $authUser->branch_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }
}
