<?php
namespace App\Models;

use App\Config\Database;
use PDO;

class Certificate {
    public static function create(int $userId, string $courseId): array {
        $pdo = Database::getConnection();
        
        // Verificar si ya existe
        $check = $pdo->prepare("SELECT * FROM certificates WHERE user_id = ? AND course_id = ?");
        $check->execute([$userId, $courseId]);
        $existing = $check->fetch();
        if ($existing) {
            return $existing;
        }

        // Generar código único de folio: ALO-2026-XXXXX
        $user = User::findById($userId);
        $channel = strtoupper($user['channel_code'] ?? 'ALO');
        $hash = strtoupper(substr(md5(uniqid((string)$userId, true)), 0, 6));
        $code = "ALO-2026-{$channel}-{$hash}";

        $stmt = $pdo->prepare("INSERT INTO certificates (certificate_code, user_id, course_id, issue_date) VALUES (?, ?, ?, datetime('now'))");
        $stmt->execute([$code, $userId, $courseId]);

        return [
            'id' => (int)$pdo->lastInsertId(),
            'certificate_code' => $code,
            'user_id' => $userId,
            'course_id' => $courseId,
            'issue_date' => date('Y-m-d H:i:s')
        ];
    }

    public static function getByUser(int $userId): array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("
            SELECT cert.*, c.title as course_title, c.type as course_type, u.name as user_name, u.channel_code 
            FROM certificates cert 
            JOIN courses c ON cert.course_id = c.id 
            JOIN users u ON cert.user_id = u.id 
            WHERE cert.user_id = ? 
            ORDER BY cert.issue_date DESC
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public static function findByCode(string $code): ?array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("
            SELECT cert.*, c.title as course_title, c.type as course_type, u.name as user_name, u.channel_code, u.email as user_email
            FROM certificates cert 
            JOIN courses c ON cert.course_id = c.id 
            JOIN users u ON cert.user_id = u.id 
            WHERE cert.certificate_code = ?
        ");
        $stmt->execute([trim($code)]);
        $res = $stmt->fetch();
        return $res ?: null;
    }
}
