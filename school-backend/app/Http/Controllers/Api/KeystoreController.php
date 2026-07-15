<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class KeystoreController extends Controller
{
    public function download(Request $request)
    {
        $token = $request->query('token');
        $expected = config('app.keystore_access_token');

        if (!$token || !$expected || $token !== $expected) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $path = 'keystore/tnhappykids-upload-key.p12';

        if (!Storage::exists($path)) {
            return response()->json(['error' => 'Keystore not found'], 404);
        }

        return response()->file(
            Storage::path($path),
            [
                'Content-Type' => 'application/x-pkcs12',
                'Content-Disposition' => 'attachment; filename="tnhappykids-upload-key.p12"',
            ]
        );
    }
}
