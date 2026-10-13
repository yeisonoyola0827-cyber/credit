<?php
namespace App\Controllers;

use App\Models\Certificate;
use App\Models\Course;

class CertificateController {
    public function myCertificates(): void {
        $user = AuthController::checkSession();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            return;
        }

        $certs = Certificate::getByUser($user['id']);
        echo json_encode(['success' => true, 'certificates' => $certs]);
    }

    public function generate(string $courseId): void {
        $user = AuthController::checkSession();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'No autorizado']);
            return;
        }

        // Verificar que el curso exista
        $course = Course::findById($courseId, $user['id']);
        if (!$course) {
            http_response_code(404);
            echo json_encode(['error' => 'Curso no encontrado']);
            return;
        }

        $cert = Certificate::create($user['id'], $courseId);
        echo json_encode([
            'success' => true,
            'certificate' => $cert,
            'message' => 'Certificado generado con éxito.'
        ]);
    }

    public function verify(string $code): void {
        $cert = Certificate::findByCode($code);
        if (!$cert) {
            http_response_code(404);
            echo json_encode(['valid' => false, 'message' => 'Folio de certificado no encontrado o inválido.']);
            return;
        }

        echo json_encode([
            'valid' => true,
            'certificate' => $cert,
            'message' => 'Certificado verificado oficialmente en Escuela A.L.O.'
        ]);
    }
}
