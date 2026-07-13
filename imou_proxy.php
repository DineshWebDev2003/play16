<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['appId']) || !isset($input['appSecret'])) {
    echo json_encode(['error' => 'appId and appSecret are required']);
    exit;
}

$appId = $input['appId'];
$appSecret = $input['appSecret'];
$action = $input['action'] ?? 'accessToken'; // accessToken, getLiveStreamInfo
$params = $input['params'] ?? [];

// IMOU API Config
$time = time();
$nonce = bin2hex(random_bytes(16));
$id = bin2hex(random_bytes(8));

// Calculate Sign: md5("time:time,nonce:nonce,appSecret:appSecret")
// Note: Official IMOU docs say sign = md5("time:xxx,nonce:xxx,appSecret:xxx")
$sign_str = "time:$time,nonce:$nonce,appSecret:$appSecret";
$sign = md5($sign_str);

$dataCenter = 'openapi'; // default
$url = "https://openapi.easy4ip.com/openapi/$action";

$payload = [
    'system' => [
        'ver' => '1.1',
        'appId' => $appId,
        'sign' => $sign,
        'time' => $time,
        'nonce' => $nonce
    ],
    'id' => $id,
    'params' => $params
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    echo json_encode(['error' => curl_error($ch)]);
} else {
    echo $response;
}

curl_close($ch);
