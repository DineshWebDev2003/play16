<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\DB;

$users = User::all();
echo "Token Audit:\n";
foreach ($users as $user) {
    $count = $user->tokens()->count();
    echo "User: {$user->username} (ID: {$user->id}) - Active Tokens: {$count}\n";
    foreach ($user->tokens as $token) {
        echo "  - Token ID: {$token->id}, Name: {$token->name}, Created: {$token->created_at}\n";
    }
}
