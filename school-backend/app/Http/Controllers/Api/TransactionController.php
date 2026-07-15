<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Transaction;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $authUser = $request->user();
        $query = Transaction::query();

        // Date range filter: ?from=2024-01-01&to=2024-01-31
        if ($request->has('from') && $request->has('to')) {
            $query->whereBetween('date', [$request->from, $request->to]);
        } elseif ($request->has('from')) {
            $query->where('date', '>=', $request->from);
        } elseif ($request->has('to')) {
            $query->where('date', '<=', $request->to);
        }

        // Type filter: ?type=income or ?type=expense
        if ($request->has('type') && in_array($request->type, ['income', 'expense'])) {
            $query->where('type', $request->type);
        }

        // Status filter
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Branch scoping
        if ($authUser->isMasterAdmin() && $request->has('branch_id')) {
            $query->byBranch($request->branch_id);
        } elseif (!$authUser->isMasterAdmin() && $authUser->branch_id) {
            $query->byBranch($authUser->branch_id);
        }

        // Non-master-admin sees only their own requests
        if (!$authUser->isMasterAdmin()) {
            $query->where('requested_by', $authUser->id);
        }

        return response()->json($query->with('branch')->latest()->get());
    }

    public function store(Request $request)
    {
        $authUser = $request->user();

        $validated = $request->validate([
            'name' => 'required|string',
            'category' => 'required|string',
            'amount' => 'required|numeric',
            'type' => 'required|in:income,expense',
            'date' => 'required|string',
            'branch_id' => 'nullable|integer|exists:branches,id',
        ]);

        if (!$authUser->isMasterAdmin() && $authUser->branch_id) {
            $validated['branch_id'] = $authUser->branch_id;
        }

        // Non-master-admin income is direct, expense needs approval
        if (!$authUser->isMasterAdmin()) {
            if ($validated['type'] === 'expense') {
                $validated['status'] = 'pending';
                $validated['requested_by'] = $authUser->id;
            }
        }

        $transaction = Transaction::create($validated);
        return response()->json($transaction->load('branch'), 201);
    }

    public function approve(Request $request, $id)
    {
        $authUser = $request->user();
        if (!$authUser || !$authUser->isMasterAdmin()) {
            return response()->json(['message' => 'Only master admin can approve'], 403);
        }

        $transaction = Transaction::find($id);
        if (!$transaction) {
            return response()->json(['message' => 'Transaction not found'], 404);
        }

        if ($transaction->status !== 'pending') {
            return response()->json(['message' => 'Transaction is not pending'], 400);
        }

        $transaction->update(['status' => 'approved']);
        return response()->json($transaction->load('branch'));
    }

    public function reject(Request $request, $id)
    {
        $authUser = $request->user();
        if (!$authUser || !$authUser->isMasterAdmin()) {
            return response()->json(['message' => 'Only master admin can reject'], 403);
        }

        $transaction = Transaction::find($id);
        if (!$transaction) {
            return response()->json(['message' => 'Transaction not found'], 404);
        }

        if ($transaction->status !== 'pending') {
            return response()->json(['message' => 'Transaction is not pending'], 400);
        }

        $transaction->update(['status' => 'rejected']);
        return response()->json($transaction->load('branch'));
    }

    public function update(Request $request, $id)
    {
        $authUser = $request->user();
        $transaction = Transaction::findOrFail($id);

        if (!$authUser->isMasterAdmin() && $authUser->branch_id && $transaction->branch_id !== $authUser->branch_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string',
            'category' => 'sometimes|required|string',
            'amount' => 'sometimes|required|numeric',
            'type' => 'sometimes|required|in:income,expense',
            'date' => 'sometimes|required|string',
        ]);

        $transaction->update($validated);
        return response()->json($transaction);
    }

    public function destroy(Request $request, $id)
    {
        $authUser = $request->user();
        $transaction = Transaction::find($id);

        if (!$transaction) {
            return response()->json(['message' => 'Transaction not found'], 404);
        }

        if (!$authUser->isMasterAdmin() && $authUser->branch_id && $transaction->branch_id !== $authUser->branch_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $transaction->delete();
        return response()->json(['message' => 'Transaction deleted']);
    }
}
