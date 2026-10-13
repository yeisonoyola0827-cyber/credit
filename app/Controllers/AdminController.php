<?php
namespace App\Controllers;

use App\Config\Database;
use App\Models\Course;
use App\Models\User;
use App\Models\Attempt;
use PDO;

class AdminController {
    public function stats(): void {
        $admin = AuthController::checkSession();
        if (!$admin || $admin['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Acceso denegado']);
            return;
        }

        $pdo = Database::getConnection();

        // Totales globales
        $totalUsers = (int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
        $activeUsers = (int)$pdo->query("SELECT COUNT(*) FROM users WHERE status = 'Activo'")->fetchColumn();
        $totalCourses = (int)$pdo->query("SELECT COUNT(*) FROM courses WHERE published = 1")->fetchColumn();
        $totalCompletions = (int)$pdo->query("SELECT COUNT(*) FROM completions")->fetchColumn();
        $avgScore = (float)$pdo->query("SELECT COALESCE(AVG(score), 0) FROM attempts")->fetchColumn();
        $totalSeconds = (int)$pdo->query("SELECT COALESCE(SUM(active_seconds), 0) FROM users")->fetchColumn();

        // Estadísticas desglosadas por Canal
        $channelStats = [];
        $channels = $pdo->query("SELECT * FROM channels WHERE code != 'all'")->fetchAll();
        foreach ($channels as $ch) {
            $code = $ch['code'];
            $uCount = (int)$pdo->query("SELECT COUNT(*) FROM users WHERE channel_code = '{$code}'")->fetchColumn();
            $onbCourseId = "onb-{$code}";
            
            // Avance promedio de Onboarding en este canal
            $progressQuery = "
                SELECT COALESCE(AVG(
                    (SELECT COUNT(*) FROM completions c JOIN modules m ON c.module_id = m.id WHERE c.user_id = u.id AND m.course_id = '{$onbCourseId}') * 100.0 / 6
                ), 0)
                FROM users u
                WHERE u.channel_code = '{$code}'
            ";
            $avgProgress = round((float)$pdo->query($progressQuery)->fetchColumn());

            // Nota promedio de evaluaciones
            $scoreQuery = "
                SELECT COALESCE(AVG(a.score), 0) 
                FROM attempts a 
                JOIN users u ON a.user_id = u.id 
                WHERE u.channel_code = '{$code}'
            ";
            $chScore = round((float)$pdo->query($scoreQuery)->fetchColumn());

            $channelStats[$code] = [
                'name' => $ch['name'],
                'short' => $ch['short_name'],
                'icon' => $ch['icon'],
                'color' => $ch['color'],
                'user_count' => $uCount,
                'avg_progress' => $avgProgress,
                'avg_score' => $chScore
            ];
        }

        // Últimos intentos
        $recentAttempts = Attempt::all();

        echo json_encode([
            'success' => true,
            'stats' => [
                'total_users' => $totalUsers,
                'active_users' => $activeUsers,
                'total_courses' => $totalCourses,
                'total_completions' => $totalCompletions,
                'avg_score' => round($avgScore),
                'total_hours' => round($totalSeconds / 3600, 1),
                'channels' => $channelStats,
                'recent_attempts' => array_slice($recentAttempts, 0, 10)
            ]
        ]);
    }

    public function saveCourse(): void {
        $admin = AuthController::checkSession();
        if (!$admin || $admin['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Acceso denegado']);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        if (empty($input['title']) || empty($input['description'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Título y descripción son requeridos']);
            return;
        }

        $id = $input['id'] ?? null;
        if ($id && Course::findById($id)) {
            Course::update($id, $input);
            $courseId = $id;
            $msg = 'Curso actualizado correctamente.';
        } else {
            $courseId = Course::create($input);
            $msg = 'Curso creado exitosamente en el catálogo.';
        }

        // Si se asignó a canal específico o a todos
        if (!empty($input['target_channel'])) {
            $pdo = Database::getConnection();
            $pdo->prepare("DELETE FROM course_assignments WHERE course_id = ?")->execute([$courseId]);
            $pdo->prepare("INSERT INTO course_assignments (course_id, channel_code) VALUES (?, ?)")
                ->execute([$courseId, $input['target_channel']]);
        }

        echo json_encode([
            'success' => true,
            'message' => $msg,
            'course' => Course::findById($courseId)
        ]);
    }

    public function toggleCourse(string $id): void {
        $admin = AuthController::checkSession();
        if (!$admin || $admin['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Acceso denegado']);
            return;
        }

        $newStatus = Course::togglePublish($id);
        echo json_encode([
            'success' => true,
            'published' => $newStatus,
            'message' => $newStatus === 1 ? 'Curso publicado.' : 'Curso despublicado.'
        ]);
    }

    public function deleteCourse(string $id): void {
        $admin = AuthController::checkSession();
        if (!$admin || $admin['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Acceso denegado']);
            return;
        }

        if (str_starts_with($id, 'onb-')) {
            http_response_code(400);
            echo json_encode(['error' => 'Los cursos de Onboarding troncal no pueden eliminarse']);
            return;
        }

        $success = Course::delete($id);
        echo json_encode([
            'success' => $success,
            'message' => $success ? 'Curso eliminado del catálogo.' : 'Error al eliminar curso.'
        ]);
    }

    public function getAssignments(): void {
        $admin = AuthController::checkSession();
        if (!$admin || $admin['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Acceso denegado']);
            return;
        }

        $matrix = Course::getChannelAssignments();
        echo json_encode(['success' => true, 'matrix' => $matrix]);
    }

    public function toggleAssignment(): void {
        $admin = AuthController::checkSession();
        if (!$admin || $admin['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Acceso denegado']);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $courseId = trim($input['course_id'] ?? '');
        $channelCode = trim($input['channel_code'] ?? '');

        if (!$courseId || !$channelCode) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de curso y código de canal requeridos']);
            return;
        }

        $success = Course::toggleChannelAssignment($courseId, $channelCode);
        echo json_encode([
            'success' => $success,
            'message' => 'Asignación de canal actualizada.',
            'matrix' => Course::getChannelAssignments()
        ]);
    }
}

