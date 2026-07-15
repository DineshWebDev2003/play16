<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Camera;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class CameraController extends Controller
{
    public function index(Request $request)
    {
        $authUser = $request->user();

        if ($authUser->isMasterAdmin()) {
            $query = Camera::with('branch');
            if ($request->has('branch_id')) {
                $query->byBranch($request->branch_id);
            }
            return response()->json($query->get());
        }

        if ($authUser->branch_id) {
            return response()->json(Camera::with('branch')->byBranch($authUser->branch_id)->get());
        }

        return response()->json(Camera::with('branch')->get());
    }

    public function store(Request $request)
    {
        $authUser = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'url' => 'required|url',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'status' => 'nullable|string|in:online,offline',
        ]);

        if (!$authUser->isMasterAdmin() && $authUser->branch_id) {
            $validated['branch_id'] = $authUser->branch_id;
        }

        $camera = Camera::create($validated);

        return response()->json($camera->load('branch'), 201);
    }

    public function show(Camera $camera)
    {
        return response()->json($camera->load('branch'));
    }

    public function update(Request $request, Camera $camera)
    {
        $authUser = $request->user();

        if (!$authUser->isMasterAdmin() && $authUser->branch_id && $camera->branch_id !== $authUser->branch_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'url' => 'sometimes|required|url',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'status' => 'sometimes|required|string|in:online,offline',
        ]);

        $camera->update($validated);

        return response()->json($camera->load('branch'));
    }

    public function destroy(Request $request, Camera $camera)
    {
        $authUser = $request->user();

        if (!$authUser->isMasterAdmin() && $authUser->branch_id && $camera->branch_id !== $authUser->branch_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $camera->delete();

        return response()->json(null, 204);
    }

    public function refresh()
    {
        try {
            Artisan::call('app:refresh-imou-cameras');
            return response()->json([
                'message' => 'Cameras refreshed successfully',
                'output' => Artisan::output()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to refresh cameras',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
