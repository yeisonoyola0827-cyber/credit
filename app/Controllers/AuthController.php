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
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Credenciales inválidas o usuario no registrado.']);
            return;
        }

        if ($user['status'] === 'Bloqueado') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Tu usuario se encuentra bloqueado por la administración.']);
            return;
        }

        // Verificación de contraseña: password_verify o contraseñas demo conocidas
        $valid = password_verify($password, $user['password_hash']) 
            || ($password === 'admin123' && $user['role'] === 'admin')
            || ($password === 'alo2026');

        if (!$valid) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Contraseña incorrecta.']);
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
            'must_change_password' => (bool)$cleanUser['must_change_password']
        ]);
    }

    public function quickLogin(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $email = trim($input['email'] ?? '');

        $allowedDemos = [
            'admin@alocredit.com',
            'maria@alocredit.com',
            'carlos@alocredit.com',
            'sofia@alocredit.com'
        ];

        if (!in_array(strtolower($email), $allowedDemos)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Usuario demo no permitido.']);
            return;
        }

        $user = User::findByEmail($email);
        if (!$user) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Usuario demo no encontrado.']);
            return;
        }

        if ($user['status'] === 'Bloqueado') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Este usuario se encuentra bloqueado.']);
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
            'message' => "Bienvenido(a), {$cleanUser['name']}.",
            'user' => $cleanUser,
            'must_change_password' => (bool)$cleanUser['must_change_password']
        ]);
    }

    public function changePassword(): void {
        $user = self::checkSession();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'No autorizado.']);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $newPassword = trim($input['new_password'] ?? '');
        $confirmPassword = trim($input['confirm_password'] ?? '');

        if (strlen($newPassword) < 6) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 6 caracteres.']);
            return;
        }

        if ($newPassword !== $confirmPassword) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Las contraseñas no coinciden.']);
            return;
        }

        $success = User::updatePassword($user['id'], $newPassword);
        if ($success) {
            $updatedUser = User::findById($user['id']);
            echo json_encode([
                'success' => true,
                'message' => 'Contraseña actualizada correctamente. ¡Bienvenido a tu Escuela A.L.O.!',
                'user' => $updatedUser
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al actualizar la contraseña.']);
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
}
