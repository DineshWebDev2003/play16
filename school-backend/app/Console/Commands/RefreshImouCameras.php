<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

use App\Models\Camera;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class RefreshImouCameras extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:refresh-imou-cameras';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetch fresh HLS links from Imou and update MediaMTX proxy';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $appId = env('IMOU_APP_ID');
        $appSecret = env('IMOU_APP_SECRET');

        if (!$appId || !$appSecret) {
            $this->error('IMOU_APP_ID or IMOU_APP_SECRET not found in .env');
            return;
        }

        $this->info('Starting Imou camera refresh...');

        // 1. Get Access Token
        $accessToken = $this->getImouAccessToken($appId, $appSecret);
        if (!$accessToken) {
            $this->error('Failed to get Imou access token');
            return;
        }

        $this->info('Access token obtained.');

        // 2. Fetch cameras from DB
        $cameras = Camera::whereNotNull('device_id')->get();

        foreach ($cameras as $camera) {
            $this->info("Refreshing camera: {$camera->name} ({$camera->device_id})");

            $channelId = 0; // Integer
            $streamId = (int)($camera->stream_id ?? 1); // Integer

            // 3. Unbind existing (Removed streamId as it's not needed for unbind)
            $this->callImouApi('unbindLive', [
                'token' => $accessToken,
                'deviceId' => (string)$camera->device_id,
                'channelId' => $channelId,
            ], $appId, $appSecret);

            // 4. Bind fresh
            $this->callImouApi('bindDeviceLive', [
                'token' => $accessToken,
                'deviceId' => (string)$camera->device_id,
                'channelId' => $channelId,
                'streamId' => $streamId,
                'liveMode' => 'proxy'
            ], $appId, $appSecret);

            // Sleep a bit for binding to take effect
            sleep(2);

            // 5. Get Stream Info
            $streamResponse = $this->callImouApi('getLiveStreamInfo', [
                'token' => $accessToken,
                'deviceId' => (string)$camera->device_id,
                'channelId' => $channelId,
                'type' => 1, // HLS
                'streamId' => $streamId
            ], $appId, $appSecret);

            if ($streamResponse && isset($streamResponse['data']['streams'][0]['hls'])) {
                $freshHlsUrl = $streamResponse['data']['streams'][0]['hls'];
                $this->line("➤ Imou URL: <info>{$freshHlsUrl}</info>");
                
                // 6. Update MediaMTX via API
                if ($camera->proxy_path) {
                    $this->updateMediaMtxPath($camera->proxy_path, $freshHlsUrl);
                }

                // 7. Update DB record with the FRESH Imou URL
                $camera->update([
                    'url' => $freshHlsUrl,
                    'status' => 'online'
                ]);
            } else {
                $camera->update(['status' => 'offline']);
            }
        }

        $this->info('Camera refresh process complete.');
    }

    private function getImouAccessToken($appId, $appSecret)
    {
        $response = $this->callImouApi('accessToken', [], $appId, $appSecret);
        return $response['data']['accessToken'] ?? null;
    }

    private function callImouApi($action, $params, $appId, $appSecret)
    {
        $time = time();
        $nonce = Str::random(16);
        $id = Str::random(8);
        $sign = md5("time:$time,nonce:$nonce,appSecret:$appSecret");

        $payload = [
            'system' => [
                'ver' => '1.1',
                'appId' => (string)$appId,
                'sign' => $sign,
                'time' => $time,
                'nonce' => $nonce
            ],
            'id' => $id,
            'params' => $params
        ];

        try {
            $response = Http::withHeaders(['Content-Type' => 'application/json'])
                            ->post("https://openapi.easy4ip.com/openapi/$action", $payload);
            
            $data = $response->json();

            if (isset($data['result']) && $data['result']['code'] === '0') {
                return $data['result'];
            }
            
            return null;
        } catch (\Exception $e) {
            $this->error("API Error ($action): " . $e->getMessage());
            return null;
        }
    }

    private function updateMediaMtxPath($pathName, $sourceUrl)
    {
        try {
            // Only try if MediaMTX might be there
            $response = Http::timeout(2)
                            ->patch("http://localhost:9997/v3/config/paths/patch/$pathName", [
                                'source' => $sourceUrl
                            ]);
            return $response->successful();
        } catch (\Exception $e) {
            // Keep silent in production if MediaMTX is not installed
            return false;
        }
    }
}
