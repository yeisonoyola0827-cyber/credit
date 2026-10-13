<?php
// Detección automática de Base URL para máxima portabilidad (PHP CLI, XAMPP, Apache, Subcarpetas)
$scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME']));
$baseUrl = ($scriptDir === '/' || $scriptDir === '.' || empty($scriptDir)) ? '' : rtrim($scriptDir, '/');
?>
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#5169B7">
    <meta name="description" content="Escuela A.L.O. Arcade: experiencia interactiva de formación, onboarding, evaluación y analítica de Aló Credit. Arquitectura MVC PHP + SPA.">
    <title>Escuela A.L.O. | Level up · Tu talento transforma</title>
    <link rel="icon" type="image/png" href="<?= $baseUrl ?>/assets/logo.png">
    
    <!-- Hojas de Estilo Desacopladas -->
    <link rel="stylesheet" href="<?= $baseUrl ?>/assets/css/app.css?v=2.0">
    <link rel="stylesheet" href="<?= $baseUrl ?>/assets/css/auth.css?v=2.0">
    <link rel="stylesheet" href="<?= $baseUrl ?>/assets/css/certificate.css?v=2.0">
</head>
<body>
    <div id="app-root">
        <!-- Renderizado dinámico de la SPA o Login -->
        <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; font-family:'Montserrat',sans-serif; color:#5169b7;">
            <div style="text-align:center;">
                <div style="font-size:48px; margin-bottom:12px;">★</div>
                <h2 style="margin:0;">Iniciando Escuela A.L.O....</h2>
            </div>
        </div>
    </div>

    <!-- Inyección de configuración global para SPA -->
    <script>
        window.APP_BASE_URL = "<?= $baseUrl ?>";
        window.SUPABASE_URL = "https://mjuieiyyurrdiqwlafrr.supabase.co";
        window.SUPABASE_ANON_KEY = "sb_publishable_vFjl3yMqr1ssDgNoik89Nw_L5Twjq-_";
    </script>

    <!-- Scripts de la Aplicación -->
    <script src="<?= $baseUrl ?>/assets/js/sound.js?v=2.0"></script>
    <script src="<?= $baseUrl ?>/assets/js/api.js?v=2.0"></script>
    <script src="<?= $baseUrl ?>/assets/js/course-player.js?v=2.0"></script>
    <script src="<?= $baseUrl ?>/assets/js/admin.js?v=2.0"></script>
    <script src="<?= $baseUrl ?>/assets/js/auth.js?v=2.0"></script>
    <script src="<?= $baseUrl ?>/assets/js/spa.js?v=2.0"></script>
</body>
</html>
