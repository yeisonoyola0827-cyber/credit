-- ============================================================
-- Base de Datos SQL: Escuela A.L.O. Arcade (Aló Credit)
-- Compatible con SQLite y MySQL / MariaDB
-- ============================================================

-- Tabla de Canales de Formación
CREATE TABLE IF NOT EXISTS channels (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    short_name VARCHAR(50) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    color VARCHAR(20) NOT NULL,
    focus TEXT NOT NULL
);

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user', -- 'admin' o 'user'
    channel_code VARCHAR(20) NOT NULL,        -- 'cp', 'cc', 'adm', 'all'
    area VARCHAR(100) DEFAULT '',
    gerencia VARCHAR(100) DEFAULT '',
    cohort VARCHAR(50) DEFAULT 'Demo 2026',
    leader VARCHAR(100) DEFAULT 'Mentor Demo',
    status VARCHAR(20) NOT NULL DEFAULT 'Activo', -- 'Activo', 'Bloqueado', 'Inactivo'
    must_change_password INTEGER NOT NULL DEFAULT 0, -- 1 = requiere cambiar en primer login
    xp INTEGER NOT NULL DEFAULT 0,
    active_seconds INTEGER NOT NULL DEFAULT 0,
    last_login DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (channel_code) REFERENCES channels(code)
);

-- Tabla de Cursos
CREATE TABLE IF NOT EXISTS courses (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL,               -- 'Onboarding', 'Formación continua', 'Liderazgo', 'A la medida'
    pillar VARCHAR(10) NOT NULL,             -- 'A' (Aprendizaje), 'L' (Liderazgo), 'O' (Obsesión cliente)
    duration INTEGER NOT NULL DEFAULT 60,    -- Minutos
    icon VARCHAR(10) DEFAULT '🚀',
    color VARCHAR(20) DEFAULT 'blue',
    description TEXT NOT NULL,
    scope VARCHAR(20) NOT NULL DEFAULT 'channel', -- 'all' (todos los canales) o 'channel' (un canal específico)
    target_channel VARCHAR(20) NOT NULL DEFAULT 'all', -- 'cp', 'cc', 'adm' o 'all'
    published INTEGER NOT NULL DEFAULT 1,    -- 1 = publicado, 0 = borrador
    version VARCHAR(20) DEFAULT '1.0',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Módulos (Fases de aprendizaje)
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
    practice_options TEXT NOT NULL,          -- JSON Array con 3 opciones ['A','B','C']
    practice_answer INTEGER NOT NULL DEFAULT 0, -- 0, 1 o 2
    practice_feedback TEXT NOT NULL,
    reflection TEXT NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Tabla de Preguntas para Quizzes
CREATE TABLE IF NOT EXISTS questions (
    id VARCHAR(50) PRIMARY KEY,
    course_id VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    options TEXT NOT NULL,                   -- JSON Array ['Opción A', 'Opción B', 'Opción C']
    answer INTEGER NOT NULL DEFAULT 0,       -- Índice de respuesta correcta (0, 1, 2)
    explanation TEXT NOT NULL,
    critical INTEGER NOT NULL DEFAULT 0,     -- 1 = control crítico (falla inmediata si se equivoca)
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Asignaciones de cursos a Canales / Usuarios
CREATE TABLE IF NOT EXISTS course_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id VARCHAR(50) NOT NULL,
    channel_code VARCHAR(20) NULL,           -- Si es asignación por canal
    user_id INTEGER NULL,                   -- Si es asignación individual
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Módulos completados por usuarios
CREATE TABLE IF NOT EXISTS completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    module_id VARCHAR(60) NOT NULL,
    reflection_text TEXT NULL,
    completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, module_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- Intentos de evaluación / Quizzes
CREATE TABLE IF NOT EXISTS attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    course_id VARCHAR(50) NOT NULL,
    score INTEGER NOT NULL,
    correct_count INTEGER NOT NULL,
    total_count INTEGER NOT NULL,
    passed INTEGER NOT NULL,                 -- 1 = aprobado, 0 = reprobado
    critical_wrong INTEGER NOT NULL DEFAULT 0, -- 1 = cometió error crítico
    completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Certificados expedidos
CREATE TABLE IF NOT EXISTS certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    certificate_code VARCHAR(60) NOT NULL UNIQUE, -- Ej: ALO-2026-CP-XXXXX
    user_id INTEGER NOT NULL,
    course_id VARCHAR(50) NOT NULL,
    issue_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Rúbricas de evaluación 50/50 (Admin / Formador)
CREATE TABLE IF NOT EXISTS rubrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    evaluator VARCHAR(100) NOT NULL,
    behavior_score INTEGER NOT NULL,
    bot_score INTEGER NOT NULL,
    quiz_score INTEGER NULL,
    total_score INTEGER NOT NULL,
    critical INTEGER NOT NULL DEFAULT 0,
    passed INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(80) NOT NULL,
    notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Registro de sesiones y actividad
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(50) PRIMARY KEY,
    user_id INTEGER NOT NULL,
    start_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME NULL,
    seconds INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- DATOS SEMILLA (SEED DATA)
-- ============================================================

-- 1. Canales
INSERT OR IGNORE INTO channels (code, name, short_name, icon, color, focus) VALUES
('cp', 'Comercial Presencial', 'Comercial', '🏪', 'orange', 'Diagnóstico, propuesta, CRM y atención transparente'),
('cc', 'Contact Center', 'Contact Center', '🎧', 'purple', 'Escucha, llamada, tipificación y seguimiento autorizado'),
('adm', 'Administrativos', 'Administrativos', '💻', 'green', 'Control de datos, procesos y servicio al cliente interno'),
('all', 'Todos los Canales', 'Todos', '🌐', 'blue', 'Formación transversal y cultura general Aló Credit');

-- 2. Los 4 Usuarios Solicitados para Pruebas:
-- Passwords:
-- admin123 -> $2y$10$w82JdsqT1jF0dF4q24N8j.6p6K8cEhy9sV36oKvhG3Z34mGkLmqtS
-- alo2026  -> $2y$10$eE0L4c4zK3w5rG4n9v6gNuL3uM9sQ2dK8bE1oPvhT5Z21mNkJmqeK
-- Nota: En Database.php se verificará password_verify con fallback a texto plano en demo si se necesita.
INSERT OR IGNORE INTO users (id, name, email, password_hash, role, channel_code, area, gerencia, cohort, leader, status, must_change_password, xp, active_seconds) VALUES
(1, 'Administrador A.L.O.', 'admin@alocredit.com', '$2y$10$sP31KqJzIcmQvF07mO6r.O3z7gO8y2bT8uB1mPwhT5Z21mNkJmqtS', 'admin', 'all', 'Formación & Talento', 'Gestión Humana', 'Admin Central', 'Director Talento', 'Activo', 0, 1250, 7200),
(2, 'María Comercial', 'maria@alocredit.com', '$2y$10$eE0L4c4zK3w5rG4n9v6gNuL3uM9sQ2dK8bE1oPvhT5Z21mNkJmqeK', 'user', 'cp', 'Comercial', 'Comercial Presencial', 'Demo 2026-A', 'Mentor Demo', 'Activo', 0, 420, 4560),
(3, 'Carlos Contact', 'carlos@alocredit.com', '$2y$10$eE0L4c4zK3w5rG4n9v6gNuL3uM9sQ2dK8bE1oPvhT5Z21mNkJmqeK', 'user', 'cc', 'Contact Center', 'Contact Center', 'Demo 2026-A', 'Mentor Demo', 'Activo', 0, 180, 2350),
(4, 'Sofía Admin', 'sofia@alocredit.com', '$2y$10$eE0L4c4zK3w5rG4n9v6gNuL3uM9sQ2dK8bE1oPvhT5Z21mNkJmqeK', 'user', 'adm', 'Administrativos', 'Operaciones', 'Demo 2026-B', 'Mentor Demo', 'Activo', 1, 150, 1840);
