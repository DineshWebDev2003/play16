<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Timetable;

class TimetableController extends Controller
{
    // GET /api/timetable?day=0
    public function index(Request $request)
    {
        try {
            $query = Timetable::query();
            if ($request->has('day')) {
                $query->where('day', $request->day);
            }
            $data = $query->orderBy('time')->get();
            return response()->json($data);
        } catch (\Exception $e) {
            \Log::error('Timetable Index Error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // POST /api/timetable  (admin only)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'day' => 'required|integer|between:0,6',
            'time' => 'required|string|max:20',
            'activity' => 'required|string|max:100',
            'room' => 'nullable|string|max:80',
            'icon' => 'nullable|string|max:80',
            'color' => 'nullable|string|max:50',
        ]);

        $slot = Timetable::create($validated);
        return response()->json($slot, 201);
    }

    // PUT /api/timetable/{id}  (admin only)
    public function update(Request $request, $id)
    {
        $slot = Timetable::findOrFail($id);
        $validated = $request->validate([
            'day' => 'sometimes|integer|between:0,6',
            'time' => 'sometimes|string|max:20',
            'activity' => 'sometimes|string|max:100',
            'room' => 'nullable|string|max:80',
            'icon' => 'nullable|string|max:80',
            'color' => 'nullable|string|max:50',
        ]);

        $slot->update($validated);
        return response()->json($slot);
    }

    // DELETE /api/timetable/{id}  (admin only)
    public function destroy($id)
    {
        $slot = Timetable::findOrFail($id);
        $slot->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
