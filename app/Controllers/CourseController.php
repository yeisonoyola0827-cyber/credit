<?php
namespace App\Controllers;

use App\Models\Course;
use App\Models\Attempt;
use App\Models\Certificate;

class CourseController {
    public function list(): void {
        $user = AuthController::checkSession();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            return;
        }

        $channel = $user['role'] === 'admin' ? 'all' : $user['channel_code'];
        $courses = Course::forChannel($channel, $user['id']);

        echo json_encode(['success' => true, 'courses' => $courses]);
    }

    public function show(string $id): void {
        $user = AuthController::checkSession();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            return;
        }

        $course = Course::findById($id, $user['id']);
        if (!$course) {
            http_response_code(404);
            echo json_encode(['error' => 'Curso no encontrado']);
            return;
        }

        echo json_encode(['success' => true, 'course' => $course]);
    }

    public function completeModule(): void {
        $user = AuthController::checkSession();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $moduleId = trim($input['module_id'] ?? '');
        $reflection = trim($input['reflection'] ?? '');

        if (empty($moduleId)) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de módulo requerido']);
            return;
        }

        $success = Course::completeModule($user['id'], $moduleId, $reflection);
        echo json_encode([
            'success' => $success,
            'message' => '¡Misión completada! Has sumado +70 XP.',
            'xp_earned' => 70
        ]);
    }

    public function submitQuiz(): void {
        $user = AuthController::checkSession();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $courseId = trim($input['course_id'] ?? '');
        $userAnswers = $input['answers'] ?? []; // Map {questionId => selectedIndex}

        $questions = Course::getQuestions($courseId);
        if (empty($questions)) {
            http_response_code(400);
            echo json_encode(['error' => 'El curso no tiene preguntas de evaluación']);
            return;
        }

        $total = count($questions);
        $correct = 0;
        $criticalWrong = false;

        foreach ($questions as $q) {
            $selected = $userAnswers[$q['id']] ?? null;
            if ($selected !== null && (int)$selected === (int)$q['answer']) {
                $correct++;
            } else {
                if (!empty($q['critical'])) {
                    $criticalWrong = true;
                }
            }
        }

        $score = (int)round(($correct / $total) * 100);
        $passed = ($score >= 80) && !$criticalWrong;

        $attemptId = Attempt::create([
            'user_id' => $user['id'],
            'course_id' => $courseId,
            'score' => $score,
            'correct_count' => $correct,
            'total_count' => $total,
            'passed' => $passed,
            'critical_wrong' => $criticalWrong
        ]);

        $certificate = null;
        if ($passed) {
            // Verificar si completó todos los módulos para otorgar certificado
            $progress = Course::getUserProgress($courseId, $user['id']);
            if ($progress['is_completed'] || str_starts_with($courseId, 'onb-')) {
                $certificate = Certificate::create($user['id'], $courseId);
            }
        }

        echo json_encode([
            'success' => true,
            'attempt_id' => $attemptId,
            'score' => $score,
            'correct' => $correct,
            'total' => $total,
            'passed' => $passed,
            'critical_wrong' => $criticalWrong,
            'certificate' => $certificate,
            'message' => $passed 
                ? '¡Felicitaciones! Has superado el desafío con éxito (+100 XP).'
                : ($criticalWrong 
                    ? 'Se detectó una falla en una pregunta de control crítico. Revisa el caso e inténtalo de nuevo.' 
                    : 'Puntaje insuficiente (mínimo 80%). Revisa el contenido e inténtalo nuevamente.')
        ]);
    }
}
