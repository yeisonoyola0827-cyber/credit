<?php
namespace App\Config;

use PDO;
use PDOException;

class Database {
    private static ?PDO $pdo = null;

    public static function getConnection(): PDO {
        if (self::$pdo === null) {
            $dataDir = __DIR__ . '/../../data';
            if (!is_dir($dataDir)) {
                mkdir($dataDir, 0777, true);
            }
            $dbPath = $dataDir . '/escuela_alo.sqlite';

            try {
                self::$pdo = new PDO('sqlite:' . $dbPath);
                self::$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                self::$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
                
                // Inicializar esquema si las tablas no existen
                self::initSchema(self::$pdo);
            } catch (PDOException $e) {
                die(json_encode(['error' => 'Error de conexión a base de datos: ' . $e->getMessage()]));
            }
        }
        return self::$pdo;
    }

    private static function initSchema(PDO $pdo): void {
        // Verificar si la tabla users ya existe
        $check = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")->fetch();
        if ($check) {
            return;
        }

        // Crear tablas
        $sql = "
        CREATE TABLE IF NOT EXISTS channels (
            code VARCHAR(20) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            short_name VARCHAR(50) NOT NULL,
            icon VARCHAR(10) NOT NULL,
            color VARCHAR(20) NOT NULL,
            focus TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(120) NOT NULL,
            email VARCHAR(150) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL DEFAULT 'user',
            channel_code VARCHAR(20) NOT NULL,
            area VARCHAR(100) DEFAULT '',
            gerencia VARCHAR(100) DEFAULT '',
            cohort VARCHAR(50) DEFAULT 'Demo 2026',
            leader VARCHAR(100) DEFAULT 'Mentor Demo',
            status VARCHAR(20) NOT NULL DEFAULT 'Activo',
            must_change_password INTEGER NOT NULL DEFAULT 0,
            xp INTEGER NOT NULL DEFAULT 0,
            active_seconds INTEGER NOT NULL DEFAULT 0,
            last_login DATETIME NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (channel_code) REFERENCES channels(code)
        );

        CREATE TABLE IF NOT EXISTS courses (
            id VARCHAR(50) PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            type VARCHAR(50) NOT NULL,
            pillar VARCHAR(10) NOT NULL,
            duration INTEGER NOT NULL DEFAULT 60,
            icon VARCHAR(10) DEFAULT '🚀',
            color VARCHAR(20) DEFAULT 'blue',
            description TEXT NOT NULL,
            scope VARCHAR(20) NOT NULL DEFAULT 'channel',
            target_channel VARCHAR(20) NOT NULL DEFAULT 'all',
            published INTEGER NOT NULL DEFAULT 1,
            version VARCHAR(20) DEFAULT '1.0',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS modules (
            id VARCHAR(60) PRIMARY KEY,
            course_id VARCHAR(50) NOT NULL,
            order_num INTEGER NOT NULL DEFAULT 0,
            title VARCHAR(200) NOT NULL,
            subtitle VARCHAR(200) NOT NULL,
            estimated INTEGER NOT NULL DEFAULT 35,
            story TEXT NOT NULL,
            concept TEXT NOT NULL,
            practice_q TEXT NOT NULL,
            practice_options TEXT NOT NULL,
            practice_answer INTEGER NOT NULL DEFAULT 0,
            practice_feedback TEXT NOT NULL,
            reflection TEXT NOT NULL,
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS questions (
            id VARCHAR(50) PRIMARY KEY,
            course_id VARCHAR(50) NOT NULL,
            text TEXT NOT NULL,
            options TEXT NOT NULL,
            answer INTEGER NOT NULL DEFAULT 0,
            explanation TEXT NOT NULL,
            critical INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS course_assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id VARCHAR(50) NOT NULL,
            channel_code VARCHAR(20) NULL,
            user_id INTEGER NULL,
            assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS completions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            module_id VARCHAR(60) NOT NULL,
            reflection_text TEXT NULL,
            completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, module_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            course_id VARCHAR(50) NOT NULL,
            score INTEGER NOT NULL,
            correct_count INTEGER NOT NULL,
            total_count INTEGER NOT NULL,
            passed INTEGER NOT NULL,
            critical_wrong INTEGER NOT NULL DEFAULT 0,
            completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS certificates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            certificate_code VARCHAR(60) NOT NULL UNIQUE,
            user_id INTEGER NOT NULL,
            course_id VARCHAR(50) NOT NULL,
            issue_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS sessions (
            id VARCHAR(50) PRIMARY KEY,
            user_id INTEGER NOT NULL,
            start_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            end_time DATETIME NULL,
            seconds INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        ";

        $pdo->exec($sql);
        self::seedData($pdo);
    }

    private static function seedData(PDO $pdo): void {
        // Canales
        $channels = [
            ['cp', 'Comercial Presencial', 'Comercial', '🏪', 'orange', 'Diagnóstico, propuesta, CRM y atención transparente'],
            ['cc', 'Contact Center', 'Contact Center', '🎧', 'purple', 'Escucha, llamada, tipificación y seguimiento autorizado'],
            ['adm', 'Administrativos', 'Administrativos', '💻', 'green', 'Control de datos, procesos y servicio al cliente interno'],
            ['all', 'Todos los Canales', 'Todos', '🌐', 'blue', 'Formación transversal y cultura general Aló Credit']
        ];
        $chStmt = $pdo->prepare("INSERT INTO channels (code, name, short_name, icon, color, focus) VALUES (?, ?, ?, ?, ?, ?)");
        foreach ($channels as $ch) {
            $chStmt->execute($ch);
        }

        // Usuario Administrador:
        // Admin: admin@alocredit.com / admin123
        $users = [
            [
                'name' => 'Administrador A.L.O.',
                'email' => 'admin@alocredit.com',
                'password_hash' => password_hash('admin123', PASSWORD_BCRYPT),
                'role' => 'admin',
                'channel_code' => 'all',
                'area' => 'Formación & Talento',
                'gerencia' => 'Gestión Humana',
                'cohort' => 'Admin Central',
                'leader' => 'Director Talento',
                'status' => 'Activo',
                'must_change_password' => 0,
                'xp' => 1250,
                'active_seconds' => 7200
            ]
        ];

        $uStmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, role, channel_code, area, gerencia, cohort, leader, status, must_change_password, xp, active_seconds) VALUES (:name, :email, :password_hash, :role, :channel_code, :area, :gerencia, :cohort, :leader, :status, :must_change_password, :xp, :active_seconds)");
        foreach ($users as $u) {
            $uStmt->execute($u);
        }

        // Cursos Seed
        $courses = [
            // Onboardings por Canal
            [
                'id' => 'onb-cp',
                'title' => 'Onboarding · Comercial Presencial',
                'type' => 'Onboarding',
                'pillar' => 'A',
                'duration' => 720,
                'icon' => '🏪',
                'color' => 'orange',
                'description' => 'Aventura de iniciación en tienda: identidad, herramientas, práctica supervisada y evaluación.',
                'scope' => 'channel',
                'target_channel' => 'cp',
                'published' => 1
            ],
            [
                'id' => 'onb-cc',
                'title' => 'Onboarding · Contact Center',
                'type' => 'Onboarding',
                'pillar' => 'A',
                'duration' => 720,
                'icon' => '🎧',
                'color' => 'purple',
                'description' => 'Aventura de iniciación en llamadas: escucha activa, validación autorizada y manejo responsable de clientes.',
                'scope' => 'channel',
                'target_channel' => 'cc',
                'published' => 1
            ],
            [
                'id' => 'onb-adm',
                'title' => 'Onboarding · Administrativos',
                'type' => 'Onboarding',
                'pillar' => 'A',
                'duration' => 720,
                'icon' => '💻',
                'color' => 'green',
                'description' => 'Aventura inicial en procesos: calidad de datos, autorización, conciliación y control interno.',
                'scope' => 'channel',
                'target_channel' => 'adm',
                'published' => 1
            ],
            // Cursos de Formación Continua Canal Comercial
            [
                'id' => 'venta',
                'title' => 'Diagnóstico y propuesta de valor',
                'type' => 'Formación continua',
                'pillar' => 'O',
                'duration' => 240,
                'icon' => '🧭',
                'color' => 'orange',
                'description' => 'Diagnóstico de necesidades, segmentación y comunicación clara para productos financieros.',
                'scope' => 'channel',
                'target_channel' => 'cp',
                'published' => 1
            ],
            [
                'id' => 'objeciones',
                'title' => 'Objeciones y cierre responsable',
                'type' => 'Formación continua',
                'pillar' => 'A',
                'duration' => 240,
                'icon' => '🎯',
                'color' => 'gold',
                'description' => 'Manejo de dudas, resiliencia y cierre sin presión indebida en punto de atención.',
                'scope' => 'channel',
                'target_channel' => 'cp',
                'published' => 1
            ],
            // Cursos de Formación Continua Canal Contact Center
            [
                'id' => 'guion',
                'title' => 'Guion flexible y escucha telefónica',
                'type' => 'Formación continua',
                'pillar' => 'O',
                'duration' => 240,
                'icon' => '🎧',
                'color' => 'purple',
                'description' => 'Sondeo, escucha activa y adaptación del guion respetando los controles.',
                'scope' => 'channel',
                'target_channel' => 'cc',
                'published' => 1
            ],
            [
                'id' => 'crm',
                'title' => 'CRM, tipificación y seguimiento',
                'type' => 'Formación continua',
                'pillar' => 'A',
                'duration' => 240,
                'icon' => '🗂️',
                'color' => 'blue',
                'description' => 'Registro consistente de interacciones telefónicas y seguimiento autorizado.',
                'scope' => 'channel',
                'target_channel' => 'cc',
                'published' => 1
            ],
            // Cursos de Formación Continua Canal Administrativos
            [
                'id' => 'datos',
                'title' => 'Calidad de datos y control interno',
                'type' => 'Formación continua',
                'pillar' => 'A',
                'duration' => 240,
                'icon' => '📊',
                'color' => 'green',
                'description' => 'Validación, conciliación y controles de acceso en procesos administrativos.',
                'scope' => 'channel',
                'target_channel' => 'adm',
                'published' => 1
            ],
            [
                'id' => 'interno',
                'title' => 'Servicio al cliente interno',
                'type' => 'Formación continua',
                'pillar' => 'O',
                'duration' => 240,
                'icon' => '🤝',
                'color' => 'gold',
                'description' => 'Acuerdos de nivel de servicio, handoff y comunicación interáreas.',
                'scope' => 'channel',
                'target_channel' => 'adm',
                'published' => 1
            ],
            // Cursos Globales (Todos los Canales)
            [
                'id' => 'cultura',
                'title' => 'Cultura A.L.O. en acción',
                'type' => 'Formación continua',
                'pillar' => 'O',
                'duration' => 90,
                'icon' => '✨',
                'color' => 'orange',
                'description' => 'Identidad, aprendizaje y atención humana con aplicación transversal a todos los roles.',
                'scope' => 'all',
                'target_channel' => 'all',
                'published' => 1
            ],
            [
                'id' => 'coaching',
                'title' => 'Coaching con observación',
                'type' => 'Liderazgo',
                'pillar' => 'L',
                'duration' => 60,
                'icon' => '🚀',
                'color' => 'purple',
                'description' => 'Observación estructurada, feedback constructivo y acuerdos de mejora del equipo.',
                'scope' => 'all',
                'target_channel' => 'all',
                'published' => 1
            ],
            [
                'id' => 'feedback',
                'title' => 'Feedback y plan de mejora',
                'type' => 'Liderazgo',
                'pillar' => 'L',
                'duration' => 60,
                'icon' => '💬',
                'color' => 'blue',
                'description' => 'Conversaciones de desarrollo sustentadas en evidencia y métricas observables.',
                'scope' => 'all',
                'target_channel' => 'all',
                'published' => 1
            ]
        ];

        $cStmt = $pdo->prepare("INSERT INTO courses (id, title, type, pillar, duration, icon, color, description, scope, target_channel, published) VALUES (:id, :title, :type, :pillar, :duration, :icon, :color, :description, :scope, :target_channel, :published)");
        foreach ($courses as $c) {
            $cStmt->execute($c);
        }

        // Módulos para los Onboardings de cada canal
        self::seedModulesAndQuestions($pdo);
    }

    private static function seedModulesAndQuestions(PDO $pdo): void {
        $mStmt = $pdo->prepare("INSERT INTO modules (id, course_id, order_num, title, subtitle, estimated, story, concept, practice_q, practice_options, practice_answer, practice_feedback, reflection) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        
        $qStmt = $pdo->prepare("INSERT INTO questions (id, course_id, text, options, answer, explanation, critical) VALUES (?, ?, ?, ?, ?, ?, ?)");

        // 1. Módulos Onboarding Comercial Presencial (onb-cp)
        $cpModules = [
            ['cp-0', 'onb-cp', 0, 'Prepara tu aventura', 'Día 0 · Alistamiento y accesos', 10, 'Antes de una misión, cada asesor necesita sus herramientas de diagnóstico.', 'Confirma equipo, correo, permisos de CRM, agenda y mentor asignado.', '¿Qué se debe validar antes de iniciar la atención?', json_encode(['Solo la fecha de contratación', 'Accesos, CRM, agenda y mentor asignado', 'Solo la velocidad de conexión']), 1, 'El alistamiento asegura una operación transparente desde el primer minuto.', 'Escribe qué acceso o herramienta debes validar antes de abrir el punto.'],
            ['cp-1', 'onb-cp', 1, 'Me conecto + me activo', 'Día 1 · Identidad y producto', 360, 'Descubre cómo Aló Credit convierte la financiación en experiencias humanas.', 'Cultura, transparencia, producto responsable y obsesión por el cliente.', '¿Qué debe primar al explicar los productos financieros?', json_encode(['Promesas de aprobación para cerrar', 'Lenguaje claro, condiciones vigentes y transparencia', 'Omitir las condiciones para agilizar']), 1, 'La transparencia y claridad son el pilar de la confianza.', 'Propón una frase breve para explicar el proceso de solicitud a un cliente.'],
            ['cp-2', 'onb-cp', 2, 'Comprendo + actúo', 'Día 2 · CRM y simulación', 360, 'Un cliente desea financiación y pregunta si la aprobación está garantizada.', 'Herramienta: CRM de oportunidades. Flujo: Diagnóstico responsable y registro.', '¿Qué respuesta es adecuada ante solicitud de aprobación garantizada?', json_encode(['Prometer aprobación inmediata', 'Verificar condiciones vigentes y no garantizar aprobación', 'Omitir información']), 1, 'La aprobación depende de la evaluación vigente; nunca se garantiza.', 'Describe cómo registrarías el caso en la herramienta autorizada.'],
            ['cp-3', 'onb-cp', 3, 'Misión en el puesto', 'Días 3–7 · Canguro supervisado', 45, 'El mentor demuestra, observa y retroalimenta la interacción presencial.', 'Día 3: observación. Días 4-5: ejecución acompañada. Días 6-7: rúbrica ≥85/100.', '¿Cuándo corresponde ampliar la autonomía operativa?', json_encode(['Al terminar el día 1', 'Cuando el mentor esté ocupado', 'Tras cumplir la rúbrica y cero errores críticos']), 2, 'La habilitación exige evidencia de práctica y cero errores críticos.', 'Indica un aspecto que pedirías observar a tu mentor antes de atender solo.'],
            ['cp-4', 'onb-cp', 4, 'Refuerza tus poderes', 'Días 8–30 · Cuatro clínicas', 480, 'Fortalece tus habilidades en manejo de objeciones y cierres éticos.', 'Cuatro clínicas de 120 minutos enfocadas en casos reales y simulación.', '¿Para qué se realizan las clínicas de los primeros 30 días?', json_encode(['Para repetir teoría', 'Para trabajar brechas reales con práctica y evidencia', 'Para reemplazar el acompañamiento']), 1, 'Las clínicas corrigen brechas situadas en problemas reales del puesto.', 'Identifica una duda frecuente de los clientes y tu respuesta recomendada.'],
            ['cp-5', 'onb-cp', 5, 'El reto final A.L.O.', 'Evaluación y habilitación', 60, 'Has llegado al portal final de certificación comercial.', 'Examen de conocimientos + rúbrica de desempeño. Umbral ≥80% sin errores críticos.', '¿Cuál de estos resultados NO permite la habilitación?', json_encode(['Total 88, práctica 90 y 0 errores críticos', 'Total 95 y un error crítico en verificación', 'Total 90 y práctica 88']), 1, 'Un error crítico bloquea la habilitación operativa sin excepción.', 'Explica por qué un puntaje alto no basta si se omite un control obligatorio.']
        ];
        foreach ($cpModules as $m) {
            $mStmt->execute($m);
        }

        // Preguntas Onboarding Comercial
        $cpQuestions = [
            ['qcp1', 'onb-cp', 'Un cliente te pide garantizar que le aprobarán el crédito. ¿Qué haces?', json_encode(['Lo garantizo para cerrar la venta', 'Aclaro que depende de la evaluación vigente y no prometo aprobación', 'Evito responder']), 1, 'Nunca se deben prometer aprobaciones o condiciones fuera de política.', 1],
            ['qcp2', 'onb-cp', 'Antes de proponer una alternativa financiera debes…', json_encode(['Diagnosticar la necesidad y validar información', 'Ofrecer el mismo producto a todos', 'Omitir el diagnóstico']), 0, 'El diagnóstico adecuado es la base de una propuesta responsable.', 0],
            ['qcp3', 'onb-cp', 'Toda interacción comercial debe quedar…', json_encode(['En una libreta personal', 'Sin registro', 'Registrada en el CRM autorizado con siguiente paso']), 2, 'La trazabilidad permite seguimiento y control auditado.', 0],
            ['qcp4', 'onb-cp', '¿Cuál es el criterio de salida a práctica supervisada?', json_encode(['Solo asistencia', 'Examen aprobado, práctica ≥85 y cero errores críticos', 'Solo ver videos']), 1, 'La decisión integra conocimiento, ejecución y controles obligatorios.', 0]
        ];
        foreach ($cpQuestions as $q) {
            $qStmt->execute($q);
        }

        // 2. Módulos Onboarding Contact Center (onb-cc)
        $ccModules = [
            ['cc-0', 'onb-cc', 0, 'Prepara tu diadema', 'Día 0 · Alistamiento telefónico', 10, 'Asegura tus credenciales telefónicas, softphone y acceso al CRM.', 'Verificación de diadema, softphone, permisos de llamada y protocolo.', '¿Qué se debe validar antes de tomar la primera llamada?', json_encode(['Solo la conexión a internet', 'Softphone, diadema, CRM y protocolo de atención', 'La hora de almuerzo']), 1, 'El alistamiento técnico evita caídas de llamadas y fallas de servicio.', 'Anota tu checklist de inicio de turno.'],
            ['cc-1', 'onb-cc', 1, 'Voz y empatía', 'Día 1 · Identidad y protocolo', 360, 'El teléfono exige claridad, calidez y apego total al respeto del cliente.', 'Tono de voz, escucha activa, tipificación y empatía.', '¿Qué prima al atender un cliente en canal telefónico?', json_encode(['Colgar rápido para bajar el AHT', 'Escucha activa, claridad y respeto', 'Transferir de inmediato']), 1, 'La experiencia y la escucha definen la calidad de la llamada.', 'Escribe una frase de saludo empática y profesional.'],
            ['cc-2', 'onb-cc', 2, 'Validación y CRM', 'Día 2 · Controles de seguridad', 360, 'Un usuario solicita información de cuenta sin completar la validación de identidad.', 'Herramienta: CRM y tipificador. Control obligatorio: Validación de identidad.', '¿Qué corresponde hacer antes de brindar información sensible?', json_encode(['Continuar si la persona suena confiable', 'Aplicar el protocolo autorizado de validación de identidad', 'Pedirle su red social']), 1, 'La validación de identidad es un control crítico obligatorio.', 'Explica qué haces si el usuario falla la validación de identidad.'],
            ['cc-3', 'onb-cc', 3, 'Llamadas acompañadas', 'Días 3–7 · Escucha y feedback', 45, 'El mentor monitorea tus llamadas en vivo y retroalimenta cada caso.', 'Monitoreo lado a lado, revisión de tipificación y manejo de objeciones.', '¿Cuándo puede un asesor tomar llamadas sin acompañamiento?', json_encode(['Al segundo día', 'Tras superar la rúbrica de calidad y cero errores críticos', 'Cuando haya fila en cola']), 1, 'La autonomía requiere calidad comprobada y controles cumplidos.', 'Describe una acción para mejorar tu fluidez al tipificar.'],
            ['cc-4', 'onb-cc', 4, 'Clínicas telefónicas', 'Días 8–30 · Casos difíciles', 480, 'Refuerza el manejo de clientes molestos y excepciones de cobranza.', 'Cuatro clínicas de simulación de llamadas y casos especiales.', '¿Cuál es el fin de las clínicas de Contact Center?', json_encode(['Memorizar guiones rígidos', 'Resolver situaciones complejas con técnica y empatía', 'Reducir las llamadas']), 1, 'Las clínicas desarrollan criterio y resolución en situaciones complejas.', 'Escribe un compromiso para mantener la calma en llamadas de alta tensión.'],
            ['cc-5', 'onb-cc', 5, 'Reto final de llamadas', 'Evaluación y habilitación', 60, 'Prueba de conocimientos telefónicos, tipificación y controles críticos.', 'Evaluación final de Contact Center. Umbral ≥80% sin errores críticos.', '¿Qué consecuencia tiene divulgar datos sin validar identidad?', json_encode(['Ninguna', 'Falla crítica que impide la habilitación operativa', 'Solo una llamada de atención menor']), 1, 'La seguridad de datos es crítica para la organización y el cliente.', 'Explica la importancia de la confidencialidad en el canal telefónico.']
        ];
        foreach ($ccModules as $m) {
            $mStmt->execute($m);
        }

        $ccQuestions = [
            ['qcc1', 'onb-cc', 'La persona en la llamada solicita información sensible sin validar identidad. Debes…', json_encode(['Compartirla si conoce datos generales', 'Aplicar el protocolo de validación antes de continuar', 'Pedirle que envíe un mensaje personal']), 1, 'La validación de identidad es un control crítico obligatorio.', 1],
            ['qcc2', 'onb-cc', 'Una buena tipificación en CRM permite…', json_encode(['Dejar trazabilidad y orientar seguimiento autorizado', 'Eliminar registros repetidos', 'Omitir controles futuros']), 0, 'Los registros completos garantizan continuidad en la atención.', 0],
            ['qcc3', 'onb-cc', 'El manejo de objeciones por teléfono se basa en…', json_encode(['Interrumpir para ganar tiempo', 'Presionar el cierre', 'Escuchar, indagar y aclarar con transparencia']), 2, 'La escucha activa y el respeto permiten resolver dudas de raíz.', 0]
        ];
        foreach ($ccQuestions as $q) {
            $qStmt->execute($q);
        }

        // 3. Módulos Onboarding Administrativos (onb-adm)
        $admModules = [
            ['adm-0', 'onb-adm', 0, 'Alistamiento de procesos', 'Día 0 · Accesos y seguridad', 10, 'Asegura tu entorno de trabajo seguro, VPN y sistemas internos.', 'Accesos a bases de datos, flujos de autorización y políticas de seguridad.', '¿Qué debes comprobar antes de operar registros?', json_encode(['Solo la hora', 'Permisos asignados, VPN y políticas de seguridad', 'Nada']), 1, 'Los permisos correctos aseguran la integridad del sistema.', 'Anota qué aplicativos usas en tu jornada habitual.'],
            ['adm-1', 'onb-adm', 1, 'Cultura y calidad de datos', 'Día 1 · Trazabilidad', 360, 'El dato correcto en el momento oportuno previene reprocesos y fallas.', 'Exactitud de registros, autorizaciones formales y servicio interno.', '¿Qué caracteriza una gestión administrativa de excelencia?', json_encode(['Rapidez sin verificar', 'Exactitud, trazabilidad y cumplimiento de controles', 'Omitir soportes']), 1, 'La trazabilidad documental garantiza operaciones confiables.', 'Propón un hábito para evitar errores de digitación en datos clave.'],
            ['adm-2', 'onb-adm', 2, 'Casos y autorizaciones', 'Día 2 · Validación de excepciones', 360, 'Llega una solicitud urgente de cambio de datos sin la autorización debida.', 'Control: No modificar sin soporte formal y visto bueno del área autorizada.', '¿Qué acción demuestra control ante una autorización faltante?', json_encode(['Modificar el dato para cumplir el tiempo', 'Detener la operación, verificar permisos y escalar', 'Enviar el dato a correo personal']), 1, 'Nunca se ejecutan cambios críticos sin la autorización formal requerida.', 'Describe cómo escalas una inconsistencia detectada en un proceso.'],
            ['adm-3', 'onb-adm', 3, 'Acompañamiento operativo', 'Días 3–7 · Supervisión de procesos', 45, 'Ejecución guiada de conciliaciones y aprobación de solicitudes.', 'Revisión cruzada con mentor, validación de SLA y auditoría de calidad.', '¿Cuándo se otorga autonomía en la aprobación de trámites?', json_encode(['Al cumplir una semana de contrato', 'Tras demostrar cero discrepancias en auditoría de rúbrica', 'Cuando haya sobrecarga']), 1, 'La precisión y el control son indispensables para la autonomía.', 'Indica qué paso de control consideras más sensible en tu proceso.'],
            ['adm-4', 'onb-adm', 4, 'Clínicas de optimización', 'Días 8–30 · Reducción de reprocesos', 480, 'Análisis de causa raíz en errores operativos y acuerdos con otras áreas.', 'Cuatro clínicas de resolución de problemas e interacciones de handoff.', '¿Para qué sirven las clínicas de optimización administrativa?', json_encode(['Para revisar teoría básica', 'Para identificar cuellos de botella y reducir reprocesos con evidencia', 'Para archivar casos']), 1, 'Las clínicas identifican mejoras medibles en los flujos operativos.', 'Escribe una propuesta para agilizar la entrega de información a otras áreas.'],
            ['adm-5', 'onb-adm', 5, 'Reto final administrativo', 'Evaluación y certificación', 60, 'Evaluación de políticas de datos, autorización y control interno.', 'Examen final de procesos. Umbral ≥80% sin errores críticos.', '¿Qué ocurre ante un error crítico en manejo de información confidencial?', json_encode(['Se ignora si el total es alto', 'Bloquea la certificación y requiere plan de refuerzo estricto', 'Se aprueba condicional']), 1, 'La seguridad de la información es un estándar no negociable.', 'Explica por qué la calidad de datos impacta directamente al cliente final.']
        ];
        foreach ($admModules as $m) {
            $mStmt->execute($m);
        }

        $admQuestions = [
            ['qad1', 'onb-adm', 'Recibes una solicitud urgente sin la autorización requerida. Debes…', json_encode(['Ejecutar para cumplir el SLA', 'Solicitar autorización, pausar y escalar con trazabilidad', 'Enviar datos al correo personal']), 1, 'No se deben ejecutar acciones sin la autorización debida.', 1],
            ['qad2', 'onb-adm', '¿Cuál es una evidencia válida de calidad de datos?', json_encode(['Un comentario verbal sin soporte', 'Un reporte sin fuente identificada', 'Validación y conciliación documentada']), 2, 'Las decisiones deben tener trazabilidad, fuente y responsable.', 0],
            ['qad3', 'onb-adm', 'Al transferir una solicitud a otra área corresponde…', json_encode(['Definir responsables, información completa y criterio de aceptación', 'Omitir contexto', 'Cerrar el caso antes de confirmar']), 0, 'La claridad en el handoff reduce tiempos y reprocesos innecesarios.', 0]
        ];
        foreach ($admQuestions as $q) {
            $qStmt->execute($q);
        }

        // 4. Módulos para cursos transversales y continuos
        $otherCourses = ['venta', 'objeciones', 'guion', 'crm', 'datos', 'interno', 'cultura', 'coaching', 'feedback'];
        foreach ($otherCourses as $cid) {
            $mStmt->execute([
                "{$cid}-m1",
                $cid,
                0,
                'Descubre el método',
                'Fase 1 · Criterio y marco de acción',
                35,
                'Analiza qué requiere la situación para resolver el caso con excelencia.',
                'Identifica la información disponible, valida políticas y determina el estándar aplicable.',
                '¿Qué caracteriza una decisión profesional bien sustentada?',
                json_encode(['Basarse en hechos, datos y controles del proceso', 'Improvisar para ahorrar tiempo', 'Evitar registrar lo ocurrido']),
                0,
                'Las decisiones de alto impacto parten de datos verificados y controles vigentes.',
                '¿Qué dato necesitarías comprobar antes de resolver un caso similar en tu día a día?'
            ]);
            $mStmt->execute([
                "{$cid}-m2",
                $cid,
                1,
                'Pasa a la acción',
                'Fase 2 · Simulación y transferencia',
                45,
                'Aplica la técnica en un escenario simulado y define tu compromiso de mejora.',
                'El estándar incluye técnica del rol, comunicación asertiva, controles y trazabilidad.',
                '¿Cómo se comprueba la transferencia efectiva al puesto de trabajo?',
                json_encode(['Con solo asistir a una charla', 'Con evidencia observable de aplicación y retroalimentación', 'Con un examen sin práctica']),
                1,
                'El verdadero aprendizaje se evidencia cuando cambia la conducta y mejora el resultado.',
                'Redacta un compromiso concreto y medible para los próximos 7 días en tu rol.'
            ]);

            $qStmt->execute([
                "q-{$cid}-1",
                $cid,
                '¿Cómo debe iniciar la resolución de un caso en este tema?',
                json_encode(['Aplicando conocimiento vigente, diagnóstico y controles', 'Omitiendo registros para ganar tiempo', 'Prometiendo resultados imposibles']),
                0,
                'Todo caso requiere diagnóstico adecuado y apego a las políticas institucionales.',
                0
            ]);
            $qStmt->execute([
                "q-{$cid}-2",
                $cid,
                '¿Qué constituye una evidencia válida de aplicación formativa?',
                json_encode(['Haber visto un video', 'Un caso documentado y feedback de la práctica', 'Estar conectado en la plataforma']),
                1,
                'Aprender requiere práctica documentada y retroalimentación oportuna.',
                0
            ]);
        }

        // Asignaciones iniciales: Cursos de Onboarding y Formación por Canal
        $pdo->exec("INSERT OR IGNORE INTO course_assignments (course_id, channel_code) VALUES 
            ('onb-cp', 'cp'), ('venta', 'cp'), ('objeciones', 'cp'),
            ('onb-cc', 'cc'), ('guion', 'cc'), ('crm', 'cc'),
            ('onb-adm', 'adm'), ('datos', 'adm'), ('interno', 'adm'),
            ('cultura', 'all'), ('coaching', 'all'), ('feedback', 'all')
        ");
    }
}
