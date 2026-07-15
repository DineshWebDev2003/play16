<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

echo "Cleaning up sessions to enforce 4-device limit...\n";
foreach (User::all() as $user) {
    if ($user->tokens()->count() > 4) {
        $count = $user->tokens()->count();
        echo "User: {$user->username} - Reducing {$count} tokens to 4.\n";
        $user->tokens()->latest()->skip(4)->each(function($token) {
            $token->delete();
        });
    }
}
echo "Done.\n";
