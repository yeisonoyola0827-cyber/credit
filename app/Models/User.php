<?php
namespace App\Models;

use App\Config\Database;
use PDO;

class User {
    public static function findById(int $id): ?array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT id, name, email, role, channel_code, area, gerencia, cohort, leader, status, must_change_password, xp, active_seconds, last_login, created_at FROM users WHERE id = ?");
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        return $user ?: null;
    }

    public static function findByEmail(string $email): ?array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)");
        $stmt->execute([trim($email)]);
        $user = $stmt->fetch();
        return $user ?: null;
    }

    public static function all(): array {
        $pdo = Database::getConnection();
        $stmt = $pdo->query("SELECT id, name, email, role, channel_code, area, gerencia, cohort, leader, status, must_change_password, xp, active_seconds, last_login, created_at FROM users ORDER BY id ASC");
        return $stmt->fetchAll();
    }

    public static function create(array $data): int {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, role, channel_code, area, gerencia, cohort, leader, status, must_change_password, xp, active_seconds) 
            VALUES (:name, :email, :password_hash, :role, :channel_code, :area, :gerencia, :cohort, :leader, :status, :must_change_password, 0, 0)");
        
        $password = !empty($data['password']) ? $data['password'] : 'alo2026';
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);

        $stmt->execute([
            ':name' => $data['name'],
            ':email' => strtolower(trim($data['email'])),
            ':password_hash' => $passwordHash,
            ':role' => $data['role'] ?? 'user',
            ':channel_code' => $data['channel_code'] ?? 'cp',
            ':area' => $data['area'] ?? '',
            ':gerencia' => $data['gerencia'] ?? '',
            ':cohort' => $data['cohort'] ?? 'Demo 2026',
            ':leader' => $data['leader'] ?? 'Mentor Demo',
            ':status' => $data['status'] ?? 'Activo',
            ':must_change_password' => isset($data['must_change_password']) ? (int)$data['must_change_password'] : 1
        ]);

        return (int)$pdo->lastInsertId();
    }

    public static function update(int $id, array $data): bool {
        $pdo = Database::getConnection();
        $fields = [];
        $params = [':id' => $id];

        foreach (['name', 'email', 'role', 'channel_code', 'area', 'gerencia', 'cohort', 'leader', 'status', 'must_change_password'] as $field) {
            if (isset($data[$field])) {
                $fields[] = "{$field} = :{$field}";
                $params[":{$field}"] = $field === 'email' ? strtolower(trim($data[$field])) : $data[$field];
            }
        }

        if (!empty($data['password'])) {
            $fields[] = "password_hash = :password_hash";
            $params[':password_hash'] = password_hash($data['password'], PASSWORD_BCRYPT);
        }

        if (empty($fields)) {
            return false;
        }

        $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute($params);
    }

    public static function updatePassword(int $id, string $newPassword): bool {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?");
        return $stmt->execute([password_hash($newPassword, PASSWORD_BCRYPT), $id]);
    }

    public static function toggleStatus(int $id): string {
        $user = self::findById($id);
        if (!$user) return '';
        $newStatus = ($user['status'] === 'Activo') ? 'Bloqueado' : 'Activo';
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("UPDATE users SET status = ? WHERE id = ?");
        $stmt->execute([$newStatus, $id]);
        return $newStatus;
    }

    public static function delete(int $id): bool {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public static function recordLogin(int $id): void {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?");
        $stmt->execute([$id]);
    }

    public static function addXP(int $id, int $amount): void {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("UPDATE users SET xp = xp + ? WHERE id = ?");
        $stmt->execute([$amount, $id]);
    }

    public static function addActiveSeconds(int $id, int $seconds): void {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("UPDATE users SET active_seconds = active_seconds + ? WHERE id = ?");
        $stmt->execute([$seconds, $id]);
    }
}
