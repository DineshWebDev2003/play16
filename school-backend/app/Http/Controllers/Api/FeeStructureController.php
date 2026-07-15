<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\FeeStructure;

class FeeStructureController extends Controller
{
    public function index()
    {
        return response()->json(FeeStructure::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'amount' => 'required|numeric',
        ]);

        $structure = FeeStructure::create($validated);
        return response()->json($structure, 201);
    }

    public function update(Request $request, $id)
    {
        $structure = FeeStructure::findOrFail($id);
        $structure->update($request->all());
        return response()->json($structure);
    }

    public function destroy($id)
    {
        FeeStructure::destroy($id);
        return response()->json(['message' => 'Structure deleted']);
    }
}
