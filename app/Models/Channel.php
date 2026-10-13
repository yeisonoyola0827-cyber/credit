<?php
namespace App\Models;

use App\Config\Database;
use PDO;

class Channel {
    public static function all(): array {
        $pdo = Database::getConnection();
        return $pdo->query("SELECT * FROM channels ORDER BY code ASC")->fetchAll();
    }

    public static function findByCode(string $code): ?array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT * FROM channels WHERE code = ?");
        $stmt->execute([$code]);
        $channel = $stmt->fetch();
        return $channel ?: null;
    }
}
