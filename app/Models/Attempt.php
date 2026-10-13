<?php
namespace App\Models;

use App\Config\Database;
use PDO;

class Attempt {
    public static function create(array $data): int {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("
            INSERT INTO attempts (user_id, course_id, score, correct_count, total_count, passed, critical_wrong, completed_at)
            VALUES (:user_id, :course_id, :score, :correct_count, :total_count, :passed, :critical_wrong, datetime('now'))
        ");
        $stmt->execute([
            ':user_id' => $data['user_id'],
            ':course_id' => $data['course_id'],
            ':score' => $data['score'],
            ':correct_count' => $data['correct_count'],
            ':total_count' => $data['total_count'],
            ':passed' => $data['passed'] ? 1 : 0,
            ':critical_wrong' => $data['critical_wrong'] ? 1 : 0
        ]);

        if ($data['passed']) {
            User::addXP($data['user_id'], 100);
        }

        return (int)$pdo->lastInsertId();
    }

    public static function getByUser(int $userId): array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("
            SELECT a.*, c.title as course_title, c.icon as course_icon 
            FROM attempts a 
            JOIN courses c ON a.course_id = c.id 
            WHERE a.user_id = ? 
            ORDER BY a.completed_at DESC
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public static function all(): array {
        $pdo = Database::getConnection();
        $stmt = $pdo->query("
            SELECT a.*, u.name as user_name, u.email as user_email, u.channel_code, c.title as course_title 
            FROM attempts a 
            JOIN users u ON a.user_id = u.id 
            JOIN courses c ON a.course_id = c.id 
            ORDER BY a.completed_at DESC
        ");
        return $stmt->fetchAll();
    }
}
