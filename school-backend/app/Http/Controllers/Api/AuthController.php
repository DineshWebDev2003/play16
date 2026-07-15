<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required',
        ]);

        $user = User::where('username', $request->username)
            ->orWhere('email', $request->username)
            ->first();

        if ($user && Hash::check($request->password, $user->password)) {
            // Limit to 4 devices: delete oldest token if limit reached
            if ($user->tokens()->count() >= 4) {
                $user->tokens()->latest()->skip(3)->each(function($token) {
                    $token->delete();
                });
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            $user->load('branch');

            return response()->json([
                'access_token' => $token,
                'token_type' => 'Bearer',
                'user' => $user
            ]);
        }

        return response()->json(['message' => 'Invalid credentials'], 401);
    }

    public function googleLogin(Request $request)
    {
        $request->validate([
            'id_token' => 'required|string',
        ]);

        // Verify Google ID token
        $idToken = $request->id_token;
        $response = \Illuminate\Support\Facades\Http::get('https://www.googleapis.com/oauth2/v3/tokeninfo', [
            'id_token' => $idToken,
        ]);

        if (!$response->successful() || !isset($response->json()['email'])) {
            return response()->json(['message' => 'Invalid Google token'], 401);
        }

        $googleData = $response->json();
        $email = $googleData['email'];

        // Find user by email
        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json(['message' => 'No account found with this email. Contact your admin to register your Gmail.'], 404);
        }

        if ($user->status === 'inactive') {
            return response()->json(['message' => 'Account is disabled. Contact your admin.'], 403);
        }

        // Limit to 4 devices
        if ($user->tokens()->count() >= 4) {
            $user->tokens()->latest()->skip(3)->each(function($token) {
                $token->delete();
            });
        }

        $token = $user->createToken('auth_token')->plainTextToken;
        $user->load('branch');

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user()->load('branch'));
    }

    public function updatePushToken(Request $request)
    {
        $request->validate([
            'push_token' => 'required|string',
        ]);

        $user = $request->user();
        $user->push_token = $request->push_token;
        $user->save();

        return response()->json(['message' => 'Push token updated successfully']);
    }

    public function updateNotificationSettings(Request $request)
    {
        $request->validate([
            'settings' => 'required|array',
        ]);

        $user = $request->user();
        $user->notification_settings = $request->settings;
        $user->save();

        return response()->json([
            'message' => 'Notification settings updated successfully',
            'settings' => $user->notification_settings
        ]);
    }
}
