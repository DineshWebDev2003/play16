<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExpoNotificationService
{
    protected $url = 'https://exp.host/--/api/v2/push/send';

    /**
     * Send a notification to one or more users.
     *
     * @param string|array $to Single Expo push token or array of tokens
     * @param string $title
     * @param string $body
     * @param array $data Optional data payload
     * @return bool
     */
    public function send($to, $title, $body, $data = [])
    {
        $recipients = is_array($to) ? $to : (empty($to) ? [] : [$to]);

        if (empty($recipients)) {
            return false;
        }

        $messages = [];
        foreach ($recipients as $recipient) {
            if (empty($recipient)) continue;

            $message = [
                'to' => $recipient,
                'title' => $title,
                'body' => $body,
                'sound' => 'default',
                'priority' => 'high',
                'channelId' => 'announcements',
            ];

            if (!empty($data)) {
                $sanitizedData = (array) $data;
                
                // Expo rejects very large payloads. Remove base64 strings if accidentally passed.
                foreach ($sanitizedData as $key => $value) {
                    if (is_string($value) && str_starts_with($value, 'data:')) {
                        unset($sanitizedData[$key]);
                    }
                }

                // Force data to be a JSON object (record)
                $message['data'] = (object) $sanitizedData;

                // Rich content (notification image) – supports Android out of the box, iOS needs a Notification Service Extension
                if (!empty($data['image']) && !str_starts_with($data['image'], 'data:')) {
                    $message['richContent'] = [
                        'image' => $data['image'],
                    ];
                    $message['mutableContent'] = true;
                    \Illuminate\Support\Facades\Log::info('[PushNotify] richContent image set: ' . $data['image']);
                } else {
                    \Illuminate\Support\Facades\Log::info('[PushNotify] no richContent image, key exists: ' . (isset($data['image']) ? 'yes but base64' : 'no'));
                }
            }

            $messages[] = $message;
        }

        if (empty($messages)) {
            return false;
        }

        try {
            \Illuminate\Support\Facades\Log::info('[PushNotify] Sending to Expo API, messages count: ' . count($messages) . ', first message keys: ' . json_encode(array_keys($messages[0] ?? [])));
            \Illuminate\Support\Facades\Log::info('[PushNotify] First message image field: ' . ($messages[0]['image'] ?? 'NOT SET'));
            $response = Http::timeout(30)->asJson()->post($this->url, $messages);

            if ($response->successful()) {
                $body = $response->json();
                \Illuminate\Support\Facades\Log::info('[PushNotify] Expo API success', ['response' => $body]);
                // Check for individual push ticket errors
                if (isset($body['data']) && is_array($body['data'])) {
                    foreach ($body['data'] as $i => $ticket) {
                        if (isset($ticket['status']) && $ticket['status'] === 'error') {
                            \Illuminate\Support\Facades\Log::error('[PushNotify] Ticket ' . $i . ' error: ' . ($ticket['message'] ?? 'unknown'), $ticket);
                        }
                    }
                }
                return true;
            } else {
                Log::error('Expo Notification Error:', $response->json());
                return false;
            }
        } catch (\Exception $e) {
            Log::error('Expo Notification Exception: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send notification to a specific user by their ID.
     */
    public function notifyUser($userId, $title, $body, $data = [], $type = null)
    {
        // Try to find user by primary key (ID)
        $user = \App\Models\User::find($userId);

        // If not found, try searching by the custom 'student_id' field
        if (!$user) {
            $user = \App\Models\User::where('student_id', $userId)->first();
        }

        if ($user && $user->push_token) {
            // Check settings
            if (!$this->shouldNotify($user, $type)) {
                return false;
            }
            return $this->send($user->push_token, $title, $body, $data);
        }
        return false;
    }

    /**
     * Send notification to all users of a specific role.
     */
    public function notifyRole($role, $title, $body, $data = [], $type = null, $excludeUserId = null)
    {
        $users = \App\Models\User::where('role', $role)
            ->whereNotNull('push_token')
            ->get();

        \Illuminate\Support\Facades\Log::info('[PushNotify] Target role: ' . $role . ', users with tokens: ' . $users->count());

        $tokens = [];
        foreach ($users as $user) {
            if ($excludeUserId && $user->id === $excludeUserId) {
                \Illuminate\Support\Facades\Log::info('[PushNotify] Excluded user: ' . $user->id);
                continue;
            }
            if ($this->shouldNotify($user, $type)) {
                $tokens[] = $user->push_token;
            } else {
                \Illuminate\Support\Facades\Log::info('[PushNotify] Skipped user ' . $user->id . ' due to notification settings');
            }
        }

        \Illuminate\Support\Facades\Log::info('[PushNotify] Final tokens to send: ' . count($tokens));

        if (empty($tokens)) {
            \Illuminate\Support\Facades\Log::warning('[PushNotify] No tokens found to send notification');
            return false;
        }

        return $this->send($tokens, $title, $body, $data);
    }

    /**
     * Send notification to everyone.
     */
    public function notifyAll($title, $body, $data = [], $type = null, $excludeUserId = null)
    {
        $users = \App\Models\User::whereNotNull('push_token')
            ->get();

        $tokens = [];
        foreach ($users as $user) {
            if ($excludeUserId && $user->id === $excludeUserId) continue;
            if ($this->shouldNotify($user, $type)) {
                $tokens[] = $user->push_token;
            }
        }

        if (empty($tokens))
            return false;

        return $this->send($tokens, $title, $body, $data);
    }

    /**
     * Check if a user should receive a notification of a certain type
     */
    protected function shouldNotify($user, $type)
    {
        $settings = $user->notification_settings;

        // If no settings saved, default to ON for all
        if (!$settings) {
            return true;
        }

        // Global master toggle
        if (isset($settings['enabled']) && !filter_var($settings['enabled'], FILTER_VALIDATE_BOOLEAN)) {
            return false;
        }

        // Specific type toggle
        if ($type && isset($settings[$type]) && !filter_var($settings[$type], FILTER_VALIDATE_BOOLEAN)) {
            return false;
        }

        return true;
    }
}
