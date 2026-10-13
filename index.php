<?php
// Enrutador raíz para máxima compatibilidad (XAMPP, Apache, hosting compartido y PHP CLI)
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME']));
$basePath = ($scriptDir === '/' || $scriptDir === '.' || empty($scriptDir)) ? '' : rtrim($scriptDir, '/');

$uri = $requestUri;
if (!empty($basePath) && str_starts_with($uri, $basePath)) {
    $uri = substr($uri, strlen($basePath));
}
if ($uri === '' || $uri === false) {
    $uri = '/';
}

// Si se solicitan assets estáticos
if (str_starts_with($uri, '/assets/')) {
    $assetPath = __DIR__ . '/public' . $uri;
    if (file_exists($assetPath) && !is_dir($assetPath)) {
        $ext = strtolower(pathinfo($assetPath, PATHINFO_EXTENSION));
        $mimes = [
            'css' => 'text/css; charset=utf-8',
            'js'  => 'application/javascript; charset=utf-8',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg'=> 'image/jpeg',
            'svg' => 'image/svg+xml',
            'ico' => 'image/x-icon',
            'json'=> 'application/json'
        ];
        header('Content-Type: ' . ($mimes[$ext] ?? 'application/octet-stream'));
        readfile($assetPath);
        exit;
    }
}

// Delegar al Front Controller en public/index.php
require_once __DIR__ . '/public/index.php';
