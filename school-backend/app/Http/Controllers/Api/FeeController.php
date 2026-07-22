<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Fee;
use App\Models\User;
use App\Models\Transaction;

class FeeController extends Controller
{
    public function index(Request $request)
    {
        $authUser = $request->user();
        $query = Fee::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('student_name', 'like', "%$search%")
                    ->orWhere('student_id', 'like', "%$search%");
            });
        }

        // Branch scoping
        if (!$authUser->isMasterAdmin() && $authUser->branch_id) {
            $studentIds = User::byBranch($authUser->branch_id)->where('role', 'student')->pluck('id');
            $query->whereIn('student_id', $studentIds);
        }

        return response()->json($query->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|string',
            'student_name' => 'required|string',
            'type' => 'required|string',
            'amount' => 'required|numeric',
            'status' => 'required|string',
            'date' => 'required|string',
            'due_date' => 'nullable|string',
            'paid_at' => 'nullable|string',
            'notes' => 'nullable|string',
            'payment_method' => 'nullable|string',
            'payer_name' => 'nullable|string',
            'payer_phone' => 'nullable|string',
            'branch_id' => 'nullable|integer|exists:branches,id',
        ]);

        if (empty($validated['branch_id'])) {
            $student = User::find($validated['student_id']);
            $validated['branch_id'] = $student ? $student->branch_id : null;
        }
        $fee = Fee::create($validated);

        if ($fee->status === 'paid') {
            $this->createIncomeTransaction($fee, $request->user()?->id);
            try {
                $service = app(\App\Services\ExpoNotificationService::class);
                $title = "Fee Payment Successful! ✅";
                $body = "Payment of ₹" . number_format($fee->amount) . " for " . $fee->type . " received. You can now view and download your digital receipt.";
                $service->notifyUser($fee->student_id, $title, $body, [
                    'screen' => 'myFees',
                    'id' => $fee->id
                ], 'payment');
            } catch (\Exception $e) {}
        }

        return response()->json($fee, 201);
    }

    public function update(Request $request, $id)
    {
        $fee = Fee::findOrFail($id);
        $oldStatus = $fee->status;
        $fee->update($request->all());

        // Handle income transaction sync on status change
        if ($fee->status === 'paid' && $oldStatus !== 'paid') {
            $this->createIncomeTransaction($fee, $request->user()?->id);
            try {
                $service = app(\App\Services\ExpoNotificationService::class);
                $title = "Fee Payment Successful! ✅";
                $body = "Payment of ₹" . number_format($fee->amount) . " for " . $fee->type . " received. You can now view and download your digital receipt.";
                $service->notifyUser($fee->student_id, $title, $body, [
                    'screen' => 'myFees',
                    'id' => $fee->id
                ], 'payment');
            } catch (\Exception $e) {}
        } elseif ($oldStatus === 'paid' && $fee->status !== 'paid') {
            $this->removeIncomeTransaction($fee);
        }

        return response()->json($fee);
    }

    public function destroy($id)
    {
        Fee::destroy($id);
        return response()->json(['message' => 'Fee record deleted']);
    }

    public function toggleStatus(Request $request, $id)
    {
        $fee = Fee::findOrFail($id);
        if ($fee->status === 'paid') {
            $fee->status = 'unpaid';
            $fee->paid_at = null;
        } else {
            $fee->status = 'paid';
            $fee->paid_at = now()->format('Y-m-d H:i:s');
            if ($request->has('payment_method')) $fee->payment_method = $request->payment_method;
            if ($request->has('payer_name')) $fee->payer_name = $request->payer_name;
            if ($request->has('payer_phone')) $fee->payer_phone = $request->payer_phone;
        }
        $fee->save();

        if ($fee->status === 'paid') {
            $this->createIncomeTransaction($fee, $request->user()?->id);
            try {
                $service = app(\App\Services\ExpoNotificationService::class);
                $title = "Fee Payment Successful! ✅";
                $body = "Payment of ₹" . number_format($fee->amount) . " for " . $fee->type . " received. You can now view and download your digital receipt.";
                $service->notifyUser($fee->student_id, $title, $body, [
                    'screen' => 'myFees',
                    'id' => $fee->id
                ], 'payment');
            } catch (\Exception $e) {
                // Notification failure shouldn't break the toggle
            }
        } else {
            $this->removeIncomeTransaction($fee);
        }

        return response()->json($fee);
    }

    public function cleanupDuplicates(Request $request)
    {
        $authUser = $request->user();
        if (!$authUser || !$authUser->isMasterAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $duplicates = Fee::select('student_id', 'type', 'amount', 'due_date', \DB::raw('COUNT(*) as count'))
            ->groupBy('student_id', 'type', 'amount', 'due_date')
            ->having('count', '>', 1)
            ->get();

        $deleted = 0;
        foreach ($duplicates as $dup) {
            $records = Fee::where('student_id', $dup->student_id)
                ->where('type', $dup->type)
                ->where('amount', $dup->amount)
                ->where('due_date', $dup->due_date)
                ->orderBy('created_at')
                ->get();
            // Keep the first record, delete the rest
            $records->shift();
            foreach ($records as $record) {
                $record->delete();
                $deleted++;
            }
        }

        return response()->json([
            'message' => "Cleaned up {$deleted} duplicate fee record(s)",
            'deleted' => $deleted
        ]);
    }

    public function backfillTransactions(Request $request)
    {
        $authUser = $request->user();
        if (!$authUser || !$authUser->isMasterAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Fix existing fee income transactions with null requested_by
        $patched = 0;
        $feeTxs = Transaction::where('category', 'Fees')
            ->where('type', 'income')
            ->whereNull('requested_by')
            ->get();
        foreach ($feeTxs as $tx) {
            $branchAdmin = User::where('role', 'admin')
                ->where('branch_id', $tx->branch_id)
                ->where('status', 'active')
                ->first();
            if ($branchAdmin) {
                $tx->update(['requested_by' => $branchAdmin->id]);
                $patched++;
            }
        }

        $paidFees = Fee::where('status', 'paid')->get();
        $created = 0;

        foreach ($paidFees as $fee) {
            $txName = str_contains(strtolower($fee->type), 'admission')
                ? "Admission: {$fee->student_name}"
                : "Monthly Fee: {$fee->student_name}";

            $existing = Transaction::where('category', 'Fees')
                ->where('type', 'income')
                ->where('name', $txName)
                ->where('student_id', $fee->student_id)
                ->first();

            if ($existing) {
                if (!$existing->requested_by) {
                    $student = User::find($fee->student_id);
                    $branchId = $student ? $student->branch_id : null;
                    $branchAdmin = User::where('role', 'admin')
                        ->where('branch_id', $branchId)
                        ->where('status', 'active')
                        ->first();
                    if ($branchAdmin) {
                        $existing->update(['requested_by' => $branchAdmin->id]);
                        $patched++;
                    }
                }
            } else {
                $student = User::find($fee->student_id);
                $branchId = $student ? $student->branch_id : null;
                $branchAdmin = User::where('role', 'admin')
                    ->where('branch_id', $branchId)
                    ->where('status', 'active')
                    ->first();

                Transaction::create([
                    'name' => $txName,
                    'amount' => $fee->amount,
                    'category' => 'Fees',
                    'type' => 'income',
                    'date' => $fee->paid_at ? explode(' ', $fee->paid_at)[0] : $fee->date,
                    'status' => 'approved',
                    'student_id' => $fee->student_id,
                    'branch_id' => $branchId,
                    'requested_by' => $branchAdmin ? $branchAdmin->id : null,
                ]);
                $created++;
            }
        }

        return response()->json([
            'message' => "Created {$created} and patched {$patched} transaction(s) for paid fees",
            'created' => $created,
            'patched' => $patched,
        ]);
    }

    private function createIncomeTransaction($fee, $requestedBy = null)
    {
        $txName = str_contains(strtolower($fee->type), 'admission')
            ? "Admission: {$fee->student_name}"
            : "Monthly Fee: {$fee->student_name}";

        $exists = Transaction::where('category', 'Fees')
            ->where('type', 'income')
            ->where('name', $txName)
            ->where('student_id', $fee->student_id)
            ->exists();

        if (!$exists) {
            $student = User::find($fee->student_id);
            $branchId = $student ? $student->branch_id : null;

            Transaction::create([
                'name' => $txName,
                'amount' => $fee->amount,
                'category' => 'Fees',
                'type' => 'income',
                'date' => $fee->paid_at ? explode(' ', $fee->paid_at)[0] : $fee->date,
                'status' => 'approved',
                'student_id' => $fee->student_id,
                'branch_id' => $branchId,
                'requested_by' => $requestedBy,
            ]);
        }
    }

    private function removeIncomeTransaction($fee)
    {
        $txName = str_contains(strtolower($fee->type), 'admission')
            ? "Admission: {$fee->student_name}"
            : "Monthly Fee: {$fee->student_name}";

        Transaction::where('category', 'Fees')
            ->where('type', 'income')
            ->where('name', $txName)
            ->where('student_id', $fee->student_id)
            ->delete();
    }
}
