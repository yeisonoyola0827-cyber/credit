<?php
namespace App\Models;

use App\Config\Database;
use PDO;

class Course {
    public static function all(): array {
        $pdo = Database::getConnection();
        return $pdo->query("SELECT * FROM courses ORDER BY created_at DESC")->fetchAll();
    }

    public static function forChannel(string $channelCode, ?int $userId = null): array {
        $pdo = Database::getConnection();
        
        // Cursos publicados que sean:
        // 1. scope = 'all' o target_channel = 'all'
        // 2. target_channel = $channelCode
        // 3. asignados específicamente al canal o al usuario en course_assignments
        $sql = "
            SELECT DISTINCT c.* 
            FROM courses c
            LEFT JOIN course_assignments ca ON c.id = ca.course_id
            WHERE c.published = 1 
            AND (
                c.scope = 'all' 
                OR c.target_channel = 'all' 
                OR c.target_channel = :channel
                OR ca.channel_code = :channel
                OR (ca.user_id IS NOT NULL AND ca.user_id = :uid)
            )
            ORDER BY 
                CASE WHEN c.type = 'Onboarding' THEN 1 ELSE 2 END,
                c.title ASC
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':channel' => $channelCode,
            ':uid' => $userId ?? 0
        ]);
        $courses = $stmt->fetchAll();

        // Enriquecer con progreso del usuario
        if ($userId) {
            foreach ($courses as &$course) {
                $course['progress'] = self::getUserProgress($course['id'], $userId);
            }
        }

        return $courses;
    }

    public static function findById(string $id, ?int $userId = null): ?array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT * FROM courses WHERE id = ?");
        $stmt->execute([$id]);
        $course = $stmt->fetch();
        if (!$course) return null;

        $course['modules'] = self::getModules($id, $userId);
        $course['questions'] = self::getQuestions($id);
        if ($userId) {
            $course['progress'] = self::getUserProgress($id, $userId);
        }
        return $course;
    }

    public static function getModules(string $courseId, ?int $userId = null): array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT * FROM modules WHERE course_id = ? ORDER BY order_num ASC");
        $stmt->execute([$courseId]);
        $modules = $stmt->fetchAll();

        foreach ($modules as &$mod) {
            $mod['practice_options'] = json_decode($mod['practice_options'] ?: '[]', true);
            if ($userId) {
                $check = $pdo->prepare("SELECT completed_at, reflection_text FROM completions WHERE user_id = ? AND module_id = ?");
                $check->execute([$userId, $mod['id']]);
                $comp = $check->fetch();
                $mod['completed'] = !empty($comp);
                $mod['completed_at'] = $comp['completed_at'] ?? null;
                $mod['user_reflection'] = $comp['reflection_text'] ?? null;
            }
        }
        return $modules;
    }

    public static function getQuestions(string $courseId): array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT id, course_id, text, options, answer, explanation, critical FROM questions WHERE course_id = ?");
        $stmt->execute([$courseId]);
        $questions = $stmt->fetchAll();

        foreach ($questions as &$q) {
            $q['options'] = json_decode($q['options'] ?: '[]', true);
        }
        return $questions;
    }

    public static function getUserProgress(string $courseId, int $userId): array {
        $pdo = Database::getConnection();
        $modStmt = $pdo->prepare("SELECT COUNT(*) FROM modules WHERE course_id = ?");
        $modStmt->execute([$courseId]);
        $totalModules = (int)$modStmt->fetchColumn();

        if ($totalModules === 0) {
            return ['percentage' => 0, 'completed_modules' => 0, 'total_modules' => 0, 'is_completed' => false];
        }

        $compStmt = $pdo->prepare("
            SELECT COUNT(*) 
            FROM completions c 
            JOIN modules m ON c.module_id = m.id 
            WHERE c.user_id = ? AND m.course_id = ?
        ");
        $compStmt->execute([$userId, $courseId]);
        $completedModules = (int)$compStmt->fetchColumn();

        $percentage = round(($completedModules / $totalModules) * 100);

        return [
            'percentage' => $percentage,
            'completed_modules' => $completedModules,
            'total_modules' => $totalModules,
            'is_completed' => ($completedModules >= $totalModules)
        ];
    }

    public static function completeModule(int $userId, string $moduleId, string $reflection = ''): bool {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("INSERT OR REPLACE INTO completions (user_id, module_id, reflection_text, completed_at) VALUES (?, ?, ?, datetime('now'))");
        $success = $stmt->execute([$userId, $moduleId, trim($reflection)]);
        if ($success) {
            User::addXP($userId, 70);
        }
        return $success;
    }

    public static function create(array $data): string {
        $pdo = Database::getConnection();
        $id = !empty($data['id']) ? $data['id'] : 'curso-' . substr(md5(uniqid('', true)), 0, 8);
        
        $stmt = $pdo->prepare("
            INSERT INTO courses (id, title, type, pillar, duration, icon, color, description, scope, target_channel, published, version)
            VALUES (:id, :title, :type, :pillar, :duration, :icon, :color, :description, :scope, :target_channel, :published, :version)
        ");
        
        $stmt->execute([
            ':id' => $id,
            ':title' => $data['title'],
            ':type' => $data['type'] ?? 'Formación continua',
            ':pillar' => $data['pillar'] ?? 'A',
            ':duration' => (int)($data['duration'] ?? 60),
            ':icon' => $data['icon'] ?? '🚀',
            ':color' => $data['color'] ?? 'blue',
            ':description' => $data['description'] ?? '',
            ':scope' => $data['scope'] ?? 'channel',
            ':target_channel' => $data['target_channel'] ?? 'all',
            ':published' => isset($data['published']) ? (int)$data['published'] : 1,
            ':version' => $data['version'] ?? '1.0'
        ]);

        return $id;
    }

    public static function update(string $id, array $data): bool {
        $pdo = Database::getConnection();
        $fields = [];
        $params = [':id' => $id];

        foreach (['title', 'type', 'pillar', 'duration', 'icon', 'color', 'description', 'scope', 'target_channel', 'published', 'version'] as $col) {
            if (isset($data[$col])) {
                $fields[] = "{$col} = :{$col}";
                $params[":{$col}"] = $data[$col];
            }
        }

        if (empty($fields)) return false;

        $sql = "UPDATE courses SET " . implode(', ', $fields) . " WHERE id = :id";
        return $pdo->prepare($sql)->execute($params);
    }

    public static function togglePublish(string $id): int {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT published FROM courses WHERE id = ?");
        $stmt->execute([$id]);
        $current = (int)$stmt->fetchColumn();
        $new = $current === 1 ? 0 : 1;
        
        $up = $pdo->prepare("UPDATE courses SET published = ? WHERE id = ?");
        $up->execute([$new, $id]);
        return $new;
    }

    public static function getChannelAssignments(): array {
        $pdo = Database::getConnection();
        $courses = $pdo->query("SELECT id, title, target_channel, scope, type FROM courses ORDER BY title ASC")->fetchAll();
        $assignments = $pdo->query("SELECT course_id, channel_code FROM course_assignments WHERE channel_code IS NOT NULL")->fetchAll();
        
        $assignedMap = [];
        foreach ($assignments as $a) {
            $assignedMap[$a['course_id'] . '_' . $a['channel_code']] = true;
        }

        foreach ($courses as &$c) {
            $isAll = ($c['scope'] === 'all' || $c['target_channel'] === 'all');
            $c['channels'] = [
                'cp' => $isAll || $c['target_channel'] === 'cp' || !empty($assignedMap[$c['id'] . '_cp']),
                'cc' => $isAll || $c['target_channel'] === 'cc' || !empty($assignedMap[$c['id'] . '_cc']),
                'adm' => $isAll || $c['target_channel'] === 'adm' || !empty($assignedMap[$c['id'] . '_adm'])
            ];
        }
        return $courses;
    }

    public static function toggleChannelAssignment(string $courseId, string $channelCode): bool {
        $pdo = Database::getConnection();
        $course = self::findById($courseId);
        if (!$course) return false;

        // Si era 'all', desacoplamos a canales individuales
        if ($course['target_channel'] === 'all' || $course['scope'] === 'all') {
            $pdo->prepare("UPDATE courses SET target_channel = 'custom', scope = 'channel' WHERE id = ?")->execute([$courseId]);
            // Insertar los otros canales excepto el que estamos quitando si era ese
            foreach (['cp', 'cc', 'adm'] as $ch) {
                if ($ch !== $channelCode) {
                    $pdo->prepare("INSERT OR IGNORE INTO course_assignments (course_id, channel_code) VALUES (?, ?)")->execute([$courseId, $ch]);
                }
            }
            return true;
        }

        // Verificar si ya existe en course_assignments
        $check = $pdo->prepare("SELECT id FROM course_assignments WHERE course_id = ? AND channel_code = ?");
        $check->execute([$courseId, $channelCode]);
        $exists = $check->fetchColumn();

        if ($exists || $course['target_channel'] === $channelCode) {
            // Quitar asignación
            $pdo->prepare("DELETE FROM course_assignments WHERE course_id = ? AND channel_code = ?")->execute([$courseId, $channelCode]);
            if ($course['target_channel'] === $channelCode) {
                $pdo->prepare("UPDATE courses SET target_channel = 'none' WHERE id = ?")->execute([$courseId]);
            }
        } else {
            // Agregar asignación
            $pdo->prepare("INSERT INTO course_assignments (course_id, channel_code) VALUES (?, ?)")->execute([$courseId, $channelCode]);
        }
        return true;
    }

    public static function delete(string $id): bool {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("DELETE FROM courses WHERE id = ?");
        return $stmt->execute([$id]);
    }
}
