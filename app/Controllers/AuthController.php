<?php
namespace App\Controllers;

use App\Models\User;

class AuthController {
    public static function checkSession(): ?array {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        if (!empty($_SESSION['user_id'])) {
            $user = User::findById((int)$_SESSION['user_id']);
            if ($user && $user['status'] === 'Activo') {
                return $user;
            }
            // Usuario bloqueado o inexistente
            unset($_SESSION['user_id']);
        }
        return null;
    }

    public function me(): void {
        $user = self::checkSession();
        if (!$user) {
            echo json_encode(['authenticated' => false, 'user' => null]);
            return;
        }
        echo json_encode(['authenticated' => true, 'user' => $user]);
    }

    public function login(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $email = trim($input['email'] ?? '');
        $password = trim($input['password'] ?? '');

        if (empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Por favor ingresa correo y contraseña.']);
            return;
        }

        $user = User::findByEmail($email);
        if (!$user) {
            $user = self::syncUserFromSupabase($email);
            if (!$user) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Credenciales inválidas o usuario no registrado.']);
                return;
            }
        }

        if ($user['status'] === 'Bloqueado') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Tu usuario se encuentra bloqueado por la administración.']);
            return;
        }

        // Verificación de contraseña: password_verify, admin123 para rol admin, o coincidencia directa
        $valid = password_verify($password, $user['password_hash']) 
            || ($password === 'admin123' && $user['role'] === 'admin')
            || ($password === $user['password_hash']);

        if (!$valid) {
            // Reintentar sincronizando desde Supabase por si la contraseña se actualizó allí
            $syncedUser = self::syncUserFromSupabase($email);
            if ($syncedUser) {
                $user = $syncedUser;
                $valid = password_verify($password, $user['password_hash']) 
                    || ($password === 'admin123' && $user['role'] === 'admin')
                    || ($password === $user['password_hash']);
            }
        }

        if (!$valid) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Contraseña errada. Por favor verifica tu contraseña e intenta nuevamente.']);
            return;
        }

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $_SESSION['user_id'] = $user['id'];
        User::recordLogin($user['id']);

        $cleanUser = User::findById($user['id']);

        echo json_encode([
            'success' => true,
            'message' => 'Inicio de sesión exitoso.',
            'user' => $cleanUser,
            'must_change_password' => (int)($cleanUser['must_change_password'] ?? 0) === 1
        ]);
    }

    public function quickLogin(): void {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'El acceso rápido ha sido deshabilitado. Ingrese con sus credenciales.']);
    }

    public function changePassword(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $user = self::checkSession();
        if (!$user && !empty($input['email'])) {
            $candidate = User::findByEmail(trim($input['email']));
            if ($candidate && (int)($candidate['must_change_password'] ?? 0) === 1) {
                $user = $candidate;
            }
        }

        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Sesión no válida o expirada. Inicie sesión nuevamente.']);
            return;
        }

        $newPassword = trim($input['new_password'] ?? '');
        $confirmPassword = trim($input['confirm_password'] ?? '');

        if (empty($newPassword) || empty($confirmPassword)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Por favor ingrese y confirme su nueva contraseña.']);
            return;
        }

        if (strlen($newPassword) < 6) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 6 caracteres.']);
            return;
        }

        if ($newPassword !== $confirmPassword) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Las contraseñas no coinciden. Por favor verifique que ambas sean idénticas.']);
            return;
        }

        if (strtolower($newPassword) === 'alo2026') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'La nueva contraseña no puede ser igual a la contraseña temporal genérica (alo2026).']);
            return;
        }

        $success = User::updatePassword($user['id'], $newPassword);
        if ($success) {
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            $_SESSION['user_id'] = $user['id'];
            self::syncPasswordToSupabase($user['email'], $newPassword);
            $updatedUser = User::findById($user['id']);
            echo json_encode([
                'success' => true,
                'message' => '¡Contraseña actualizada exitosamente! Bienvenido a tu Escuela A.L.O.',
                'user' => $updatedUser
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al actualizar la contraseña en la base de datos.']);
        }
    }

    public function logout(): void {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $_SESSION = [];
        session_destroy();
        echo json_encode(['success' => true, 'message' => 'Sesión cerrada correctamente.']);
    }

    private static function syncUserFromSupabase(string $email): ?array {
        $apiKey = 'sb_publishable_vFjl3yMqr1ssDgNoik89Nw_L5Twjq-_';
        $url = 'https://mjuieiyyurrdiqwlafrr.supabase.co/rest/v1/users?email=ilike.' . urlencode(trim($email)) . '&select=*';
        
        $ctx = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => [
                    "apikey: {$apiKey}",
                    "Authorization: Bearer {$apiKey}",
                    "Accept: application/json"
                ],
                'timeout' => 5
            ]
        ]);
        
        $res = @file_get_contents($url, false, $ctx);
        if (!$res) return null;
        
        $data = json_decode($res, true);
        if (!is_array($data) || empty($data)) return null;
        
        $sUser = $data[0];
        $pdo = \App\Config\Database::getConnection();
        $stmt = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) = LOWER(?)");
        $stmt->execute([$sUser['email']]);
        $existing = $stmt->fetch();
        
        if ($existing) {
            $update = $pdo->prepare("UPDATE users SET password_hash = :pwd, role = :role, channel_code = :ch, status = :st, must_change_password = :mcp, name = :name WHERE id = :id");
            $update->execute([
                ':pwd' => $sUser['password_hash'] ?? $sUser['password'] ?? 'alo2026',
                ':role' => $sUser['role'] ?? 'user',
                ':ch' => $sUser['channel_code'] ?? 'cp',
                ':st' => $sUser['status'] ?? 'Activo',
                ':mcp' => (int)($sUser['must_change_password'] ?? 0),
                ':name' => $sUser['name'] ?? 'Colaborador',
                ':id' => $existing['id']
            ]);
            return User::findByEmail($sUser['email']);
        } else {
            $insert = $pdo->prepare("INSERT INTO users (name, email, password_hash, role, channel_code, area, gerencia, cohort, leader, status, must_change_password, xp, active_seconds)
                VALUES (:name, :email, :pwd, :role, :ch, :area, :gerencia, :cohort, :leader, :st, :mcp, :xp, :sec)");
            $insert->execute([
                ':name' => $sUser['name'] ?? 'Colaborador',
                ':email' => strtolower(trim($sUser['email'])),
                ':pwd' => $sUser['password_hash'] ?? $sUser['password'] ?? 'alo2026',
                ':role' => $sUser['role'] ?? 'user',
                ':ch' => $sUser['channel_code'] ?? 'cp',
                ':area' => $sUser['area'] ?? '',
                ':gerencia' => $sUser['gerencia'] ?? '',
                ':cohort' => $sUser['cohort'] ?? 'Demo 2026',
                ':leader' => $sUser['leader'] ?? 'Mentor Demo',
                ':st' => $sUser['status'] ?? 'Activo',
                ':mcp' => (int)($sUser['must_change_password'] ?? 0),
                ':xp' => (int)($sUser['xp'] ?? 0),
                ':sec' => (int)($sUser['active_seconds'] ?? 0)
            ]);
            return User::findByEmail($sUser['email']);
        }
    }

    private static function syncPasswordToSupabase(string $email, string $newPassword): void {
        $apiKey = 'sb_publishable_vFjl3yMqr1ssDgNoik89Nw_L5Twjq-_';
        $url = 'https://mjuieiyyurrdiqwlafrr.supabase.co/rest/v1/users?email=ilike.' . urlencode(trim($email));
        $ctx = stream_context_create([
            'http' => [
                'method' => 'PATCH',
                'header' => [
                    "apikey: {$apiKey}",
                    "Authorization: Bearer {$apiKey}",
                    "Content-Type: application/json",
                    "Prefer: return=minimal"
                ],
                'content' => json_encode([
                    'password_hash' => $newPassword,
                    'must_change_password' => 0
                ]),
                'timeout' => 5
            ]
        ]);
        @file_get_contents($url, false, $ctx);
    }
}
