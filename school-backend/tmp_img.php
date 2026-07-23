<?php
$db = new PDO("sqlite:" . __DIR__ . "/database/database.sqlite");

echo "=== Latest announcements ===\n";
$stmt = $db->query("SELECT id, title, image_url, date FROM announcements ORDER BY id DESC LIMIT 5");
while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "ID:{$r['id']} Title:{$r['title']} Image:" . ($r['image_url'] ? substr($r['image_url'], 0, 100) : 'NONE') . "\n";
}

echo "\n=== push_image_base_url config ===\n";
$config = require __DIR__ . "/config/app.php";
echo "push_image_base_url: " . ($config['push_image_base_url'] ?? 'NOT SET') . "\n";
echo "app.url: " . ($config['url'] ?? 'NOT SET') . "\n";

echo "\n=== Test URL construction ===\n";
$stmt = $db->query("SELECT id, image_url FROM announcements WHERE image_url IS NOT NULL AND image_url != '' ORDER BY id DESC LIMIT 1");
$row = $stmt->fetch(PDO::FETCH_ASSOC);
if ($row) {
    $base = $config['push_image_base_url'] ?? null;
    $path = 'storage/' . $row['image_url'];
    $actualUrl = $base ? rtrim($base, '/') . '/' . $path : null;
    echo "image_url from DB: " . substr($row['image_url'], 0, 80) . "\n";
    echo "constructed path: $path\n";
    echo "push_image_base_url: " . ($base ?? 'null') . "\n";
    echo "FINAL URL: " . ($actualUrl ?? 'null (base is null, asset() would be used at runtime)') . "\n";
    
    // Check if base64
    if (str_starts_with($row['image_url'], 'data:')) {
        echo "\n*** WARNING: image is base64! Expo notification cannot send base64 images. ***\n";
    }
}
