<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Users ===\n";
foreach (App\Models\User::all() as $u) {
    echo "{$u->name} ({$u->role}) branch_id={$u->branch_id}\n";
}

echo "\n=== Branches ===\n";
foreach (App\Models\Branch::all() as $b) {
    echo "{$b->id}: {$b->name} - {$b->address}\n";
}
