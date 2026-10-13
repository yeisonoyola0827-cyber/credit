<?php
namespace App\Controllers;

use App\Models\User;

class UserController {
    public function list(): void {
        $admin = AuthController::checkSession();
        if (!$admin || $admin['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Acceso denegado']);
            return;
        }

        $users = User::all();
        echo json_encode(['success' => true, 'users' => $users]);
    }

    public function create(): void {
        $admin = AuthController::checkSession();
        if (!$admin || $admin['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Acceso denegado']);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        if (empty($input['name']) || empty($input['email'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Nombre y correo electrónico son requeridos']);
            return;
        }

        // Verificar si ya existe
        $existing = User::findByEmail($input['email']);
        if ($existing) {
            http_response_code(400);
            echo json_encode(['error' => 'Ya existe un usuario con este correo electrónico']);
            return;
        }

        $userId = User::create($input);
        $user = User::findById($userId);

        echo json_encode([
            'success' => true,
            'message' => 'Usuario creado exitosamente.',
            'user' => $user
        ]);
    }

    public function update(int $id): void {
        $admin = AuthController::checkSession();
        if (!$admin || $admin['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Acceso denegado']);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $success = User::update($id, $input);
        if ($success) {
            $user = User::findById($id);
            echo json_encode([
                'success' => true,
                'message' => 'Usuario actualizado correctamente.',
                'user' => $user
            ]);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'No se realizaron cambios o datos inválidos']);
        }
    }

    public function toggleStatus(int $id): void {
        $admin = AuthController::checkSession();
        if (!$admin || $admin['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Acceso denegado']);
            return;
        }

        if ($id === (int)$admin['id']) {
            http_response_code(400);
            echo json_encode(['error' => 'No puedes bloquear tu propia cuenta de administrador']);
            return;
        }

        $newStatus = User::toggleStatus($id);
        echo json_encode([
            'success' => true,
            'status' => $newStatus,
            'message' => "El usuario ahora está {$newStatus}."
        ]);
    }

    public function delete(int $id): void {
        $admin = AuthController::checkSession();
        if (!$admin || $admin['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Acceso denegado']);
            return;
        }

        if ($id === (int)$admin['id']) {
            http_response_code(400);
            echo json_encode(['error' => 'No puedes eliminar tu propia cuenta de administrador']);
            return;
        }

        $success = User::delete($id);
        echo json_encode([
            'success' => $success,
            'message' => $success ? 'Usuario eliminado correctamente.' : 'Error al eliminar usuario.'
        ]);
    }
}
