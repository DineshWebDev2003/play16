<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    public function index(Request $request)
    {
        $authUser = $request->user();

        if (!$authUser->isMasterAdmin()) {
            if ($authUser->branch_id) {
                return response()->json(Branch::where('id', $authUser->branch_id)->get());
            }
            return response()->json([]);
        }

        return response()->json(Branch::all());
    }

    public function store(Request $request)
    {
        $authUser = $request->user();

        if (!$authUser->isMasterAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'share' => 'nullable|numeric|min:0|max:100',
        ]);

        $branch = Branch::create($validated);

        return response()->json($branch, 201);
    }

    public function show(Request $request, Branch $branch)
    {
        $authUser = $request->user();

        if (!$authUser->isMasterAdmin() && $authUser->branch_id !== $branch->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json($branch->load(['users', 'cameras']));
    }

    public function update(Request $request, Branch $branch)
    {
        $authUser = $request->user();

        if (!$authUser->isMasterAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'address' => 'nullable|string',
            'share' => 'nullable|numeric|min:0|max:100',
        ]);

        $branch->update($validated);

        return response()->json($branch);
    }

    public function destroy(Request $request, Branch $branch)
    {
        $authUser = $request->user();

        if (!$authUser->isMasterAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $branch->delete();

        return response()->json(null, 204);
    }
}
