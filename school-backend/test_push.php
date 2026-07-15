<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Services\ExpoNotificationService;

$service = app(ExpoNotificationService::class);
$result = $service->send([], 'Admin Copy Test', 'If you see this, the fix is working! 🚀');

if ($result) {
    echo "SUCCESS: Notification sent!\n";
} else {
    echo "FAILED: Check storage/logs/laravel.log\n";
}
