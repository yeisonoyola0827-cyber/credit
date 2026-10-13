<?php
// Autoloader PSR-4 simple para el namespace App\
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/../app/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

use App\Controllers\AuthController;
use App\Controllers\CourseController;
use App\Controllers\UserController;
use App\Controllers\AdminController;
use App\Controllers\CertificateController;

// Soporte para subdirectorios y PHP built-in server con archivos estáticos
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Calcular ruta base para compatibilidad con subdirectorios (Apache, XAMPP, etc.)
$scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME']));
$basePath = ($scriptDir === '/' || $scriptDir === '.' || empty($scriptDir)) ? '' : rtrim($scriptDir, '/');

$uri = $requestUri;
if (!empty($basePath) && str_starts_with($uri, $basePath)) {
    $uri = substr($uri, strlen($basePath));
}
if ($uri === '' || $uri === false) {
    $uri = '/';
}

// Servir archivos estáticos directamente si existen
if ($uri !== '/' && file_exists(__DIR__ . $uri) && !is_dir(__DIR__ . $uri)) {
    return false;
}

// Configurar encabezados para respuestas de API
if (str_starts_with($uri, '/api/')) {
    header('Content-Type: application/json; charset=utf-8');
}

// Router de API
if ($uri === '/api/me' && $method === 'GET') {
    (new AuthController())->me();
    exit;
}

if ($uri === '/api/login' && $method === 'POST') {
    (new AuthController())->login();
    exit;
}

if ($uri === '/api/quick-login' && $method === 'POST') {
    (new AuthController())->quickLogin();
    exit;
}

if ($uri === '/api/change-password' && $method === 'POST') {
    (new AuthController())->changePassword();
    exit;
}

if ($uri === '/api/logout' && $method === 'POST') {
    (new AuthController())->logout();
    exit;
}

if ($uri === '/api/courses' && $method === 'GET') {
    (new CourseController())->list();
    exit;
}

if (preg_match('#^/api/courses/([a-zA-Z0-9_-]+)$#', $uri, $matches) && $method === 'GET') {
    (new CourseController())->show($matches[1]);
    exit;
}

if ($uri === '/api/courses/complete-module' && $method === 'POST') {
    (new CourseController())->completeModule();
    exit;
}

if ($uri === '/api/courses/quiz' && $method === 'POST') {
    (new CourseController())->submitQuiz();
    exit;
}

if ($uri === '/api/certificates' && $method === 'GET') {
    (new CertificateController())->myCertificates();
    exit;
}

if (preg_match('#^/api/certificates/generate/([a-zA-Z0-9_-]+)$#', $uri, $matches) && $method === 'POST') {
    (new CertificateController())->generate($matches[1]);
    exit;
}

if (preg_match('#^/api/certificates/verify/([a-zA-Z0-9_-]+)$#', $uri, $matches) && $method === 'GET') {
    (new CertificateController())->verify($matches[1]);
    exit;
}

// Rutas de Administración
if ($uri === '/api/admin/stats' && $method === 'GET') {
    (new AdminController())->stats();
    exit;
}

if ($uri === '/api/admin/courses' && $method === 'POST') {
    (new AdminController())->saveCourse();
    exit;
}

if (preg_match('#^/api/admin/courses/([a-zA-Z0-9_-]+)/toggle$#', $uri, $matches) && $method === 'POST') {
    (new AdminController())->toggleCourse($matches[1]);
    exit;
}

if (preg_match('#^/api/admin/courses/([a-zA-Z0-9_-]+)$#', $uri, $matches) && $method === 'DELETE') {
    (new AdminController())->deleteCourse($matches[1]);
    exit;
}

if ($uri === '/api/admin/assignments' && $method === 'GET') {
    (new AdminController())->getAssignments();
    exit;
}

if ($uri === '/api/admin/assignments/toggle' && $method === 'POST') {
    (new AdminController())->toggleAssignment();
    exit;
}

if ($uri === '/api/admin/users' && $method === 'GET') {
    (new UserController())->list();
    exit;
}

if ($uri === '/api/admin/users' && $method === 'POST') {
    (new UserController())->create();
    exit;
}

if (preg_match('#^/api/admin/users/([0-9]+)$#', $uri, $matches) && ($method === 'PUT' || $method === 'POST')) {
    (new UserController())->update((int)$matches[1]);
    exit;
}

if (preg_match('#^/api/admin/users/([0-9]+)/toggle$#', $uri, $matches) && $method === 'POST') {
    (new UserController())->toggleStatus((int)$matches[1]);
    exit;
}

if (preg_match('#^/api/admin/users/([0-9]+)$#', $uri, $matches) && $method === 'DELETE') {
    (new UserController())->delete((int)$matches[1]);
    exit;
}

// Ruta por defecto: Cargar la vista SPA principal
require_once __DIR__ . '/../app/Views/layout.php';
