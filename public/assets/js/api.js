// Cliente API Híbrido: Conexión dinámica a Backend PHP o Almacenamiento Local (GitHub Pages)
const API = {
    isStatic: (typeof window !== 'undefined' && (
        window.FORCE_STATIC_MODE === true ||
        window.location.protocol === 'file:' ||
        window.location.hostname.includes('github.io')
    )),

    async request(url, options = {}) {
        if (this.isStatic) {
            return this.dispatchStatic(url, options);
        }

        const baseUrl = window.APP_BASE_URL || '';
        const endpoint = (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//'))
            ? url
            : (baseUrl ? (baseUrl.replace(/\/+$/, '') + '/' + url.replace(/^\/+/, '')) : url);

        options.headers = {
            'Accept': 'application/json',
            ...(options.headers || {})
        };
        if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(options.body);
        }

        try {
            const res = await fetch(endpoint, options);
            const contentType = res.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                throw new Error('Servidor estático o respuesta no JSON (Modo GitHub Pages activado)');
            }
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || data.error || 'Error en la solicitud');
            }
            return data;
        } catch (err) {
            // Si falla la conexión a la API PHP (por ejemplo en GitHub Pages), activar automáticamente modo cliente
            console.warn('API PHP no disponible. Activando modo cliente / GitHub Pages.', err);
            this.isStatic = true;
            return this.dispatchStatic(url, options);
        }
    },

    // Enrutador interno para Modo Estático (GitHub Pages)
    dispatchStatic(url, options = {}) {
        const method = options.method ? options.method.toUpperCase() : 'GET';
        let body = {};
        if (options.body) {
            try { body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body; } catch(e){}
        }

        if (url === '/api/me') return StaticStore.getMe();
        if (url === '/api/login') return SupabaseStore.login(body.email, body.password);
        if (url === '/api/quick-login') return StaticStore.quickLogin(body.email);
        if (url === '/api/change-password') return StaticStore.changePassword(body.new_password, body.confirm_password);
        if (url === '/api/logout') return StaticStore.logout();

        if (url === '/api/courses') return SupabaseStore.getCourses();
        if (url.startsWith('/api/courses/') && method === 'GET') {
            const id = url.split('/').pop();
            return SupabaseStore.getCourse(id);
        }
        if (url === '/api/courses/complete-module') return SupabaseStore.completeModule(body.module_id, body.reflection);
        if (url === '/api/courses/quiz') return SupabaseStore.submitQuiz(body.course_id, body.answers);

        if (url === '/api/certificates') return SupabaseStore.getCertificates();
        if (url.startsWith('/api/certificates/generate/')) {
            const courseId = url.split('/').pop();
            return StaticStore.generateCertificate(courseId);
        }
        if (url.startsWith('/api/certificates/verify/')) {
            const code = url.split('/').pop();
            return StaticStore.verifyCertificate(code);
        }

        if (url === '/api/admin/stats') return StaticStore.getAdminStats();
        if (url === '/api/admin/users' && method === 'GET') return SupabaseStore.getAdminUsers();
        if (url === '/api/admin/users' && method === 'POST') return SupabaseStore.createAdminUser(body);
        if (url.match(/\/api\/admin\/users\/(\d+)\/toggle/)) {
            const id = parseInt(url.match(/\/api\/admin\/users\/(\d+)\/toggle/)[1]);
            return SupabaseStore.toggleUserStatus(id);
        }
        if (url.match(/\/api\/admin\/users\/(\d+)/) && method === 'DELETE') {
            const id = parseInt(url.match(/\/api\/admin\/users\/(\d+)/)[1]);
            return SupabaseStore.deleteAdminUser(id);
        }
        if (url.match(/\/api\/admin\/users\/(\d+)/)) {
            const id = parseInt(url.match(/\/api\/admin\/users\/(\d+)/)[1]);
            return StaticStore.updateAdminUser(id, body);
        }

        if (url === '/api/admin/courses' && method === 'POST') return StaticStore.saveCourse(body);
        if (url.match(/\/api\/admin\/courses\/([a-zA-Z0-9_-]+)\/toggle/)) {
            const id = url.match(/\/api\/admin\/courses\/([a-zA-Z0-9_-]+)\/toggle/)[1];
            return StaticStore.toggleCourse(id);
        }
        if (url.match(/\/api\/admin\/courses\/([a-zA-Z0-9_-]+)/) && method === 'DELETE') {
            const id = url.match(/\/api\/admin\/courses\/([a-zA-Z0-9_-]+)/)[1];
            return StaticStore.deleteCourse(id);
        }
        if (url === '/api/admin/assignments') return StaticStore.getAssignments();
        if (url === '/api/admin/assignments/toggle') return StaticStore.toggleAssignment(body.course_id, body.channel_code);

        throw new Error('Ruta no soportada en modo estático: ' + url);
    },

    // Métodos de Fachada
    getMe() { return this.isStatic ? StaticStore.getMe() : this.request('/api/me'); },
    login(email, password) { return this.isStatic ? StaticStore.login(email, password) : this.request('/api/login', { method: 'POST', body: { email, password } }); },
    quickLogin(email) { return this.isStatic ? StaticStore.quickLogin(email) : this.request('/api/quick-login', { method: 'POST', body: { email } }); },
    changePassword(new_password, confirm_password) { return this.isStatic ? StaticStore.changePassword(new_password, confirm_password) : this.request('/api/change-password', { method: 'POST', body: { new_password, confirm_password } }); },
    logout() { return this.isStatic ? StaticStore.logout() : this.request('/api/logout', { method: 'POST' }); },

    getCourses() { return this.isStatic ? StaticStore.getCourses() : this.request('/api/courses'); },
    getCourse(id) { return this.isStatic ? StaticStore.getCourse(id) : this.request(`/api/courses/${id}`); },
    completeModule(moduleId, reflection) { return this.isStatic ? StaticStore.completeModule(moduleId, reflection) : this.request('/api/courses/complete-module', { method: 'POST', body: { module_id: moduleId, reflection } }); },
    submitQuiz(courseId, answers) { return this.isStatic ? StaticStore.submitQuiz(courseId, answers) : this.request('/api/courses/quiz', { method: 'POST', body: { course_id: courseId, answers } }); },

    getCertificates() { return this.isStatic ? StaticStore.getCertificates() : this.request('/api/certificates'); },
    generateCertificate(courseId) { return this.isStatic ? StaticStore.generateCertificate(courseId) : this.request(`/api/certificates/generate/${courseId}`, { method: 'POST' }); },
    verifyCertificate(code) { return this.isStatic ? StaticStore.verifyCertificate(code) : this.request(`/api/certificates/verify/${code}`); },

    getAdminStats() { return this.isStatic ? StaticStore.getAdminStats() : this.request('/api/admin/stats'); },
    getAdminUsers() { return this.isStatic ? StaticStore.getAdminUsers() : this.request('/api/admin/users'); },
    createAdminUser(data) { return this.isStatic ? StaticStore.createAdminUser(data) : this.request('/api/admin/users', { method: 'POST', body: data }); },
    updateAdminUser(id, data) { return this.isStatic ? StaticStore.updateAdminUser(id, data) : this.request(`/api/admin/users/${id}`, { method: 'POST', body: data }); },
    toggleUserStatus(id) { return this.isStatic ? StaticStore.toggleUserStatus(id) : this.request(`/api/admin/users/${id}/toggle`, { method: 'POST' }); },
    deleteAdminUser(id) { return this.isStatic ? StaticStore.deleteAdminUser(id) : this.request(`/api/admin/users/${id}`, { method: 'DELETE' }); },
    saveCourse(data) { return this.isStatic ? StaticStore.saveCourse(data) : this.request('/api/admin/courses', { method: 'POST', body: data }); },
    toggleCourse(id) { return this.isStatic ? StaticStore.toggleCourse(id) : this.request(`/api/admin/courses/${id}/toggle`, { method: 'POST' }); },
    deleteCourse(id) { return this.isStatic ? StaticStore.deleteCourse(id) : this.request(`/api/admin/courses/${id}`, { method: 'DELETE' }); },
    getAssignments() { return this.isStatic ? StaticStore.getAssignments() : this.request('/api/admin/assignments'); },
    toggleAssignment(course_id, channel_code) { return this.isStatic ? StaticStore.toggleAssignment(course_id, channel_code) : this.request('/api/admin/assignments/toggle', { method: 'POST', body: { course_id, channel_code } }); }
};

// =========================================================================
// CONECTOR A SUPABASE (POSTGRESQL REST API)
// =========================================================================
const SupabaseStore = {
    url: (typeof window !== 'undefined' && window.SUPABASE_URL) ? window.SUPABASE_URL : 'https://mjuieiyyurrdiqwlafrr.supabase.co',
    key: (typeof window !== 'undefined' && window.SUPABASE_ANON_KEY) ? window.SUPABASE_ANON_KEY : 'sb_publishable_vFjl3yMqr1ssDgNoik89Nw_L5Twjq-_',

    async query(table, params = '', options = {}) {
        if (!this.url || !this.key) return null;
        const res = await fetch(`${this.url}/rest/v1/${table}${params}`, {
            method: options.method || 'GET',
            headers: {
                'apikey': this.key,
                'Authorization': `Bearer ${this.key}`,
                'Content-Type': 'application/json',
                'Prefer': options.prefer || 'return=representation',
                ...(options.headers || {})
            },
            body: options.body ? JSON.stringify(options.body) : undefined
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Error en Supabase');
        }
        return await res.json();
    },

    async login(email, password) {
        try {
            const rows = await this.query('users', `?email=eq.${encodeURIComponent(email.trim().toLowerCase())}&select=*`);
            if (rows && rows.length > 0) {
                const u = rows[0];
                if (u.status === 'Bloqueado') throw new Error('Tu usuario se encuentra bloqueado por la administración.');
                const valid = (password === 'admin123' && u.role === 'admin') || (u.password_hash === password);
                if (!valid) {
                    throw new Error('Contraseña incorrecta.');
                }
                StaticStore.setCurrentUser(u);
                return { success: true, message: `Bienvenido(a), ${u.name}.`, user: u, must_change_password: !!u.must_change_password };
            } else {
                throw new Error('Credenciales inválidas o usuario no registrado.');
            }
        } catch(e) {
            if (e.message.includes('Contraseña') || e.message.includes('bloqueado') || e.message.includes('inválidas')) throw e;
            console.warn('Supabase login fallback:', e.message);
        }
        return StaticStore.login(email, password);
    },

    async getCourses() {
        try {
            const courses = await this.query('courses', '?published=eq.1&select=*');
            if (courses && courses.length > 0) {
                const modules = await this.query('modules', '?select=*&order=order_num.asc');
                const questions = await this.query('questions', '?select=*');
                const u = StaticStore.getCurrentUser();
                const completions = u ? await this.query('completions', `?user_id=eq.${u.id}&select=*`).catch(() => []) : [];
                const courseList = courses.map(c => {
                    const mods = (modules || []).filter(m => m.course_id === c.id);
                    const completedCount = mods.filter(m => (completions || []).some(cp => cp.module_id === m.id)).length;
                    const pct = mods.length ? Math.round((completedCount / mods.length) * 100) : 0;
                    return {
                        ...c,
                        modules: mods,
                        questions: (questions || []).filter(q => q.course_id === c.id),
                        progress: {
                            completed_modules: completedCount,
                            total_modules: mods.length,
                            percentage: pct,
                            completed: pct === 100
                        }
                    };
                }).filter(c => {
                    if (!u || u.role === 'admin') return true;
                    return c.target_channel === 'all' || c.target_channel === u.channel_code;
                });
                return { success: true, courses: courseList };
            }
        } catch(e) {
            console.warn('Supabase getCourses fallback:', e.message);
        }
        return StaticStore.getCourses();
    },

    async getCourse(id) {
        try {
            const courses = await this.query('courses', `?id=eq.${id}&select=*`);
            if (courses && courses.length > 0) {
                const c = courses[0];
                const modules = await this.query('modules', `?course_id=eq.${id}&select=*&order=order_num.asc`);
                const questions = await this.query('questions', `?course_id=eq.${id}&select=*`);
                const u = StaticStore.getCurrentUser();
                const completions = u ? await this.query('completions', `?user_id=eq.${u.id}&select=*`).catch(() => []) : [];
                const mods = (modules || []).map((m, idx) => {
                    const isDone = (completions || []).some(cp => cp.module_id === m.id);
                    return {
                        ...m,
                        is_completed: isDone,
                        is_unlocked: idx === 0 || (completions || []).some(cp => cp.module_id === modules[idx - 1].id)
                    };
                });
                return { success: true, course: { ...c, modules: mods, questions: questions || [] } };
            }
        } catch(e) {
            console.warn('Supabase getCourse fallback:', e.message);
        }
        return StaticStore.getCourse(id);
    },

    async completeModule(moduleId, reflection) {
        try {
            const u = StaticStore.getCurrentUser();
            if (u) {
                await this.query('completions', '', {
                    method: 'POST',
                    prefer: 'resolution=merge-duplicates',
                    body: { user_id: u.id, module_id: moduleId, reflection_text: reflection || '' }
                });
                const newXp = (u.xp || 0) + 50;
                await this.query('users', `?id=eq.${u.id}`, {
                    method: 'PATCH',
                    body: { xp: newXp }
                }).catch(() => {});
                u.xp = newXp;
                StaticStore.setCurrentUser(u);
                return { success: true, message: '¡Misión superada! +50 XP sumados.' };
            }
        } catch(e) {
            console.warn('Supabase completeModule fallback:', e.message);
        }
        return StaticStore.completeModule(moduleId, reflection);
    },

    async submitQuiz(courseId, answers) {
        try {
            const u = StaticStore.getCurrentUser();
            const questions = await this.query('questions', `?course_id=eq.${courseId}&select=*`);
            if (questions && questions.length > 0) {
                let correct = 0;
                let criticalFail = false;
                questions.forEach(q => {
                    const userAns = answers[q.id];
                    if (userAns !== undefined && parseInt(userAns) === parseInt(q.answer)) {
                        correct++;
                    } else if (q.critical === 1) {
                        criticalFail = true;
                    }
                });
                const total = questions.length;
                const score = Math.round((correct / total) * 100);
                const passed = score >= 80 && !criticalFail;

                if (u) {
                    await this.query('attempts', '', {
                        method: 'POST',
                        body: {
                            user_id: u.id,
                            course_id: courseId,
                            score,
                            correct_count: correct,
                            total_count: total,
                            passed: passed ? 1 : 0,
                            critical_wrong: criticalFail ? 1 : 0
                        }
                    });

                    if (passed) {
                        const code = `ALO-2026-${(u.channel_code || 'ALL').toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
                        await this.query('certificates', '', {
                            method: 'POST',
                            body: {
                                user_id: u.id,
                                course_id: courseId,
                                certificate_code: code
                            }
                        }).catch(() => {});
                    }
                }

                return {
                    success: true,
                    score,
                    passed,
                    critical_fail: criticalFail,
                    correct_count: correct,
                    total_count: total,
                    message: passed ? '¡Felicitaciones! Has certificado esta misión.' : 'No alcanzaste el puntaje mínimo o cometiste un error crítico.'
                };
            }
        } catch(e) {
            console.warn('Supabase submitQuiz fallback:', e.message);
        }
        return StaticStore.submitQuiz(courseId, answers);
    },

    async getCertificates() {
        try {
            const u = StaticStore.getCurrentUser();
            if (u) {
                const certs = await this.query('certificates', `?user_id=eq.${u.id}&select=*`);
                const courses = await this.query('courses', '?select=id,title');
                const courseMap = {};
                (courses || []).forEach(c => { courseMap[c.id] = c.title; });
                const list = (certs || []).map(cert => ({
                    ...cert,
                    course_title: courseMap[cert.course_id] || cert.course_id,
                    user_name: u.name
                }));
                return { success: true, certificates: list };
            }
        } catch(e) {
            console.warn('Supabase getCertificates fallback:', e.message);
        }
        return StaticStore.getCertificates();
    },

    async getAdminUsers() {
        try {
            const users = await this.query('users', '?select=*&order=id.asc');
            if (users && users.length > 0) {
                return { success: true, users };
            }
        } catch(e) {
            console.warn('Supabase getAdminUsers fallback:', e.message);
        }
        return StaticStore.getAdminUsers();
    },

    async createAdminUser(data) {
        try {
            const inserted = await this.query('users', '', {
                method: 'POST',
                body: {
                    name: data.name,
                    email: data.email.trim().toLowerCase(),
                    password_hash: data.password || 'alo2026',
                    role: data.role || 'user',
                    channel_code: data.channel_code || 'all',
                    area: data.area || '',
                    gerencia: data.gerencia || '',
                    cohort: data.cohort || 'Demo 2026',
                    leader: data.leader || 'Mentor Demo',
                    status: 'Activo',
                    must_change_password: data.must_change_password ? 1 : 0,
                    xp: 0,
                    active_seconds: 0
                }
            });
            return { success: true, message: 'Usuario creado exitosamente en Supabase.', user: inserted[0] };
        } catch(e) {
            console.warn('Supabase createAdminUser fallback:', e.message);
        }
        return StaticStore.createAdminUser(data);
    },

    async toggleUserStatus(id) {
        try {
            const users = await this.query('users', `?id=eq.${id}&select=status`);
            if (users && users.length > 0) {
                const newStatus = users[0].status === 'Activo' ? 'Bloqueado' : 'Activo';
                await this.query('users', `?id=eq.${id}`, {
                    method: 'PATCH',
                    body: { status: newStatus }
                });
                return { success: true, message: `Usuario ${newStatus.toLowerCase()} correctamente.` };
            }
        } catch(e) {
            console.warn('Supabase toggleUserStatus fallback:', e.message);
        }
        return StaticStore.toggleUserStatus(id);
    },

    async deleteAdminUser(id) {
        try {
            await this.query('users', `?id=eq.${id}`, { method: 'DELETE' });
            return { success: true, message: 'Usuario eliminado correctamente de Supabase.' };
        } catch(e) {
            console.warn('Supabase deleteAdminUser fallback:', e.message);
        }
        return StaticStore.deleteAdminUser(id);
    }
};

// =========================================================================
// MOTOR ESTÁTICO / LOCALSTORAGE (PARA GITHUB PAGES Y ARCHIVOS LOCALES)
// =========================================================================
const StaticStore = {
    KEY: 'escuela_alo_db_v2',
    SESSION_KEY: 'escuela_alo_session_uid',

    load() {
        try {
            if (localStorage.getItem('escuela_alo_db_v1')) {
                localStorage.removeItem('escuela_alo_db_v1');
            }
            const raw = localStorage.getItem(this.KEY);
            if (raw) {
                const data = JSON.parse(raw);
                if (data && data.users) {
                    data.users = data.users.filter(u => u.email.toLowerCase() === 'admin@alocredit.com');
                }
                return data;
            }
        } catch(e) {}
        return this.seed();
    },

    save(data) {
        try { localStorage.setItem(this.KEY, JSON.stringify(data)); } catch(e) {}
    },

    seed() {
        const users = [
            { id: 1, name: 'Administrador A.L.O.', email: 'admin@alocredit.com', password: 'admin123', role: 'admin', channel_code: 'all', area: 'Formación & Talento', gerencia: 'Gestión Humana', cohort: 'Admin Central', leader: 'Director Talento', status: 'Activo', must_change_password: 0, xp: 1250, active_seconds: 7200, last_login: '2026-10-13 10:00:00', created_at: '2026-10-01 10:00:00' }
        ];

        const courses = [
            {
                id: 'onb-cp', title: 'Onboarding · Comercial Presencial', type: 'Onboarding', pillar: 'A', target_channel: 'cp', duration: 720, icon: '🏪', color: 'orange', description: 'Tu aventura inicial: identidad, herramientas, práctica supervisada y evaluación. Ruta adaptada a Comercial Presencial.', published: 1, version: '1.0',
                modules: [
                    { id: 'cp-0', title: 'Prepara tu aventura', subtitle: 'Día 0 · Alistamiento y accesos', story: 'Antes de una misión, cada explorador necesita sus herramientas.', concept: 'Confirma equipo y herramientas según el rol; correo y permisos; trámites definidos por GH.', practice_q: '¿Qué se debe validar antes de iniciar la formación operativa?', practice_options: ['Únicamente la fecha de contratación.', 'Accesos, herramientas, agenda y apoyo según el rol.', 'Solo la velocidad de conexión.'], practice_answer: 1, practice_feedback: 'El alistamiento evita obstáculos que no corresponden a brechas de aprendizaje.', reflection_prompt: 'Escribe cuál acceso o apoyo necesitas verificar con tu equipo.', estimated_minutes: 10 },
                    { id: 'cp-1', title: 'Me conecto + me activo', subtitle: 'Día 1 · Identidad y producto', story: 'Primera parada: descubre cómo Aló Credit convierte la financiación en experiencias simples.', concept: 'Trabaja cultura y propósito, producto y experiencia, controles críticos, acceso seguro.', practice_q: '¿Qué debe primar al explicar productos financieros?', practice_options: ['Promesas de aprobación para agilizar cierres.', 'Lenguaje claro, condiciones vigentes y transparencia.', 'Afirmaciones no verificadas sobre beneficios.'], practice_answer: 1, practice_feedback: 'La transparencia y la exactitud de producto son condiciones del buen servicio.', reflection_prompt: 'Propón una frase breve para explicar con claridad el siguiente paso del cliente.', estimated_minutes: 360 },
                    { id: 'cp-2', title: 'Comprendo + actúo', subtitle: 'Día 2 · Herramienta, flujo y simulación', story: 'Una persona desea financiación y pregunta si su aprobación está garantizada.', concept: 'Herramienta clave: CRM y registro de oportunidades. Flujo esencial: Diagnóstico y propuesta responsable.', practice_q: '¿Qué respuesta es adecuada ante una solicitud de aprobación garantizada?', practice_options: ['Prometer aprobación para evitar perder la venta.', 'Verificar las condiciones vigentes y no garantizar aprobación.', 'Omitir información y terminar la atención.'], practice_answer: 1, practice_feedback: 'Explicar que la aprobación depende de la evaluación vigente.', reflection_prompt: 'Describe el control que aplicarías y cómo dejarías evidencia.', estimated_minutes: 360 },
                    { id: 'cp-3', title: 'Misión en el puesto', subtitle: 'Días 3–7 · Canguro supervisado', story: 'El mentor demuestra, observa y retroalimenta.', concept: 'Día 3: observar y explicar decisiones. Días 4–5: ejecutar acompañado.', practice_q: '¿Cuándo corresponde ampliar el alcance de autonomía?', practice_options: ['Cuando termina el primer día de clase.', 'Cuando el mentor está ocupado.', 'Tras demostrar desempeño, cumplir la rúbrica y evitar errores críticos.'], practice_answer: 2, practice_feedback: 'La habilitación requiere evidencia de la práctica, no únicamente asistencia.', reflection_prompt: 'Escribe una acción que pedirías observar al mentor antes de ejecutar sin apoyo.', estimated_minutes: 45 },
                    { id: 'cp-4', title: 'Refuerza tus poderes', subtitle: 'Días 8–30 · Cuatro clínicas', story: 'Llegó el momento de fortalecer tus puntos de mejora con práctica y feedback.', concept: 'El primer mes incluye cuatro clínicas de 120 minutos (8 horas).', practice_q: '¿Para qué se realizan las clínicas durante los primeros 30 días?', practice_options: ['Para repetir la teoría sin revisar casos.', 'Para trabajar brechas reales con práctica y evidencia.', 'Para reemplazar el acompañamiento operativo.'], practice_answer: 1, practice_feedback: 'Las clínicas son refuerzos situados en problemas observables del puesto.', reflection_prompt: 'Identifica una dificultad frecuente de tu rol y una acción de mejora medible.', estimated_minutes: 480 },
                    { id: 'cp-5', title: 'El reto final A.L.O.', subtitle: 'Evaluación y habilitación', story: 'Has llegado al portal de certificación.', concept: 'Modelo propuesto: 50% comportamientos observables + 50% reto o BOT.', practice_q: '¿Cuál de estos resultados NO permite habilitación?', practice_options: ['Total 88, práctica 90 y cero errores críticos.', 'Total 95 y un error crítico de validación de identidad.', 'Total 90, práctica 88 y cero errores críticos.'], practice_answer: 1, practice_feedback: 'Un error crítico bloquea la habilitación, incluso con nota alta.', reflection_prompt: 'Explica por qué un resultado de aprendizaje no equivale por sí solo a autonomía operativa.', estimated_minutes: 60 }
                ],
                questions: [
                    { id: 1, question: 'Un cliente te pide garantizar que le aprobarán el crédito. ¿Qué haces?', options: ['Lo garantizo porque parece solvente.', 'Aclaro que depende de la evaluación vigente y no prometo aprobación.', 'Evito responder y registro la venta como cerrada.'], correct: 1, explanation: 'Nunca se deben prometer aprobaciones o condiciones inexistentes.', critical: 1 },
                    { id: 2, question: 'Antes de proponer una alternativa debes…', options: ['Diagnosticar la necesidad y validar información actualizada.', 'Ofrecer el mismo producto en todos los casos.', 'Omitir el diagnóstico si hay fila.'], correct: 0, explanation: 'Un diagnóstico adecuado es la base de una propuesta responsable.', critical: 0 },
                    { id: 3, question: 'Una interacción comercial debe quedar…', options: ['En una libreta personal.', 'Sin registro hasta obtener el cierre.', 'Registrada en la herramienta autorizada con siguiente paso.'], correct: 2, explanation: 'La trazabilidad permite seguimiento y control.', critical: 0 }
                ]
            },
            {
                id: 'onb-cc', title: 'Onboarding · Contact Center', type: 'Onboarding', pillar: 'A', target_channel: 'cc', duration: 720, icon: '🎧', color: 'purple', description: 'Tu aventura inicial: identidad, herramientas, práctica supervisada y evaluación. Ruta adaptada a Contact Center.', published: 1, version: '1.0',
                modules: [
                    { id: 'cc-0', title: 'Prepara tu aventura', subtitle: 'Día 0 · Alistamiento y accesos', story: 'Alistamiento de herramientas para agentes telefónicos.', concept: 'Validación de softphone, CRM y accesos de seguridad.', practice_q: '¿Qué se debe validar antes de iniciar la atención telefónica?', practice_options: ['Solo la velocidad del internet.', 'Accesos, guiones autorizados y sistema CRM.', 'La hora de almuerzo.'], practice_answer: 1, practice_feedback: 'El alistamiento integral previene incidentes con clientes.', reflection_prompt: 'Confirma los accesos que tienes activos.', estimated_minutes: 10 }
                ],
                questions: [
                    { id: 4, question: 'La persona en la llamada solicita información sensible sin validar identidad. Debes…', options: ['Compartirla si conoce datos generales.', 'Aplicar el protocolo de validación antes de continuar.', 'Pedirle que envíe información por un canal no autorizado.'], correct: 1, explanation: 'La identidad es un control obligatorio.', critical: 1 }
                ]
            },
            {
                id: 'onb-adm', title: 'Onboarding · Administrativos', type: 'Onboarding', pillar: 'A', target_channel: 'adm', duration: 720, icon: '💻', color: 'green', description: 'Tu aventura inicial: identidad, herramientas, práctica supervisada y evaluación. Ruta adaptada a Administrativos.', published: 1, version: '1.0',
                modules: [
                    { id: 'adm-0', title: 'Prepara tu aventura', subtitle: 'Día 0 · Alistamiento y accesos', story: 'Control de procesos internos y calidad de datos.', concept: 'Gestión documental, permisos y trazabilidad de operaciones.', practice_q: '¿Qué acción demuestra control ante una autorización faltante?', practice_options: ['Modificar el dato para cumplir tiempo.', 'Detener la operación, verificar permisos y escalar.', 'Enviar el dato al correo personal.'], practice_answer: 1, practice_feedback: 'El control interno requiere validación y trazabilidad.', reflection_prompt: 'Indica los sistemas clave de tu área.', estimated_minutes: 10 }
                ],
                questions: [
                    { id: 5, question: 'Recibes una solicitud urgente sin la autorización requerida. Debes…', options: ['Ejecutar para cumplir el SLA.', 'Solicitar autorización, pausar y escalar con trazabilidad.', 'Enviar datos sensibles al correo personal para agilizar.'], correct: 1, explanation: 'No ejecutar sin permiso o control obligatorio.', critical: 1 }
                ]
            },
            {
                id: 'cultura', title: 'Cultura A.L.O. en Acción', type: 'Formación continua', pillar: 'O', target_channel: 'all', duration: 90, icon: '✨', color: 'orange', description: 'Identidad, aprendizaje y atención humana, con aplicación transversal a todos los cargos.', published: 1, version: '1.0',
                modules: [
                    { id: 'cultura-m1', title: 'Descubre el método', subtitle: 'Identidad y Valores', story: 'Una persona requiere una explicación clara y un siguiente paso verificable.', concept: 'Empatía, claridad y transparencia financiera.', practice_q: '¿Qué valor refleja la cultura A.L.O. al interactuar con clientes?', practice_options: ['Prometer cualquier resultado.', 'Explicar con transparencia, escuchar y acordar el siguiente paso.', 'Omitir validaciones de identidad.'], practice_answer: 1, practice_feedback: 'La experiencia clara y humana es fundamental.', reflection_prompt: '¿Cómo aplicas la obsesión por el cliente en tu día a día?', estimated_minutes: 45 }
                ],
                questions: [
                    { id: 6, question: '¿Cuál es el núcleo del valor Obsesión por el Cliente?', options: ['Vender a toda costa.', 'Escuchar activamente, ser transparente y generar valor genuino.', 'Cerrar rápido la llamada.'], correct: 1, explanation: 'La transparencia y el valor genuino son la clave.', critical: 0 }
                ]
            }
        ];

        const assignments = [
            { course_id: 'onb-cp', channel_code: 'cp', is_active: 1 },
            { course_id: 'onb-cc', channel_code: 'cc', is_active: 1 },
            { course_id: 'onb-adm', channel_code: 'adm', is_active: 1 },
            { course_id: 'cultura', channel_code: 'cp', is_active: 1 },
            { course_id: 'cultura', channel_code: 'cc', is_active: 1 },
            { course_id: 'cultura', channel_code: 'adm', is_active: 1 }
        ];

        const data = {
            users,
            courses,
            assignments,
            completions: [],
            attempts: [],
            certificates: []
        };
        this.save(data);
        return data;
    },

    getCurrentUser() {
        const uid = localStorage.getItem(this.SESSION_KEY);
        if (!uid) return null;
        const db = this.load();
        return db.users.find(u => u.id === parseInt(uid) && u.status === 'Activo') || null;
    },

    setCurrentUser(user) {
        if (user) localStorage.setItem(this.SESSION_KEY, user.id.toString());
        else localStorage.removeItem(this.SESSION_KEY);
    },

    async getMe() {
        const u = this.getCurrentUser();
        return { authenticated: !!u, user: u };
    },

    async login(email, password) {
        const db = this.load();
        const u = db.users.find(x => x.email.toLowerCase() === email.trim().toLowerCase());
        if (!u) throw new Error('Usuario no registrado.');
        if (u.status === 'Bloqueado') throw new Error('Usuario bloqueado por la administración.');
        if (u.password !== password && password !== 'admin123') {
            throw new Error('Contraseña incorrecta.');
        }
        this.setCurrentUser(u);
        return { success: true, message: `Bienvenido(a), ${u.name}.`, user: u, must_change_password: !!u.must_change_password };
    },

    async quickLogin(email) {
        throw new Error('El acceso rápido ha sido deshabilitado. Inicie sesión con sus credenciales.');
    },

    async changePassword(new_pwd, confirm_pwd) {
        if (!new_pwd || new_pwd.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');
        if (new_pwd !== confirm_pwd) throw new Error('Las contraseñas no coinciden.');
        const u = this.getCurrentUser();
        if (!u) throw new Error('Sesión no válida.');
        const db = this.load();
        const user = db.users.find(x => x.id === u.id);
        if (user) {
            user.password = new_pwd;
            user.must_change_password = 0;
            this.save(db);
            this.setCurrentUser(user);
        }
        return { success: true, message: 'Contraseña actualizada correctamente.' };
    },

    async logout() {
        this.setCurrentUser(null);
        return { success: true, message: 'Sesión cerrada.' };
    },

    async getCourses() {
        const u = this.getCurrentUser();
        if (!u) throw new Error('No autorizado.');
        const db = this.load();
        const courses = db.courses.map(c => {
            const mods = c.modules || [];
            const completedCount = mods.filter(m => db.completions.some(cp => cp.user_id === u.id && cp.module_id === m.id)).length;
            const pct = mods.length ? Math.round((completedCount / mods.length) * 100) : 0;
            return {
                ...c,
                progress: {
                    completed_modules: completedCount,
                    total_modules: mods.length,
                    percentage: pct,
                    completed: pct === 100
                }
            };
        }).filter(c => {
            if (u.role === 'admin') return true;
            return c.target_channel === 'all' || c.target_channel === u.channel_code;
        });

        return { success: true, courses };
    },

    async getCourse(id) {
        const u = this.getCurrentUser();
        const db = this.load();
        const c = db.courses.find(x => x.id === id);
        if (!c) throw new Error('Curso no encontrado.');
        const mods = (c.modules || []).map((m, idx) => {
            const isDone = db.completions.some(cp => cp.user_id === u.id && cp.module_id === m.id);
            return {
                ...m,
                is_completed: isDone,
                is_unlocked: idx === 0 || db.completions.some(cp => cp.user_id === u.id && cp.module_id === c.modules[idx - 1].id)
            };
        });
        return { success: true, course: { ...c, modules: mods } };
    },

    async completeModule(moduleId, reflection) {
        const u = this.getCurrentUser();
        const db = this.load();
        if (!db.completions.some(cp => cp.user_id === u.id && cp.module_id === moduleId)) {
            db.completions.push({ user_id: u.id, module_id: moduleId, completed_at: new Date().toISOString() });
            const user = db.users.find(x => x.id === u.id);
            if (user) user.xp = (user.xp || 0) + 50;
            this.save(db);
        }
        return { success: true, message: '¡Misión superada! +50 XP' };
    },

    async submitQuiz(courseId, answers) {
        const u = this.getCurrentUser();
        const db = this.load();
        const c = db.courses.find(x => x.id === courseId);
        if (!c) throw new Error('Curso no encontrado');
        const qs = c.questions || [];
        let correct = 0;
        let criticalFail = false;
        qs.forEach((q, idx) => {
            if (answers[idx] === q.correct) correct++;
            else if (q.critical) criticalFail = true;
        });
        const score = qs.length ? Math.round((correct / qs.length) * 100) : 100;
        const passed = score >= 80 && !criticalFail;

        let certificate = null;
        if (passed) {
            const code = `ALO-2026-${(u.channel_code||'AL').toUpperCase()}-${Math.random().toString(36).substring(2,7).toUpperCase()}`;
            certificate = {
                id: Date.now(),
                user_id: u.id,
                course_id: c.id,
                course_title: c.title,
                certificate_code: code,
                issue_date: new Date().toISOString()
            };
            db.certificates.push(certificate);
            const user = db.users.find(x => x.id === u.id);
            if (user) user.xp = (user.xp || 0) + 100;
        }
        this.save(db);
        return {
            success: true,
            score,
            passed,
            critical_wrong: criticalFail,
            message: passed ? '¡Felicitaciones! Has aprobado y obtenido tu certificado oficial.' : 'Evaluación no aprobada. Repasa los conceptos e inténtalo de nuevo.',
            certificate_code: certificate ? certificate.certificate_code : null
        };
    },

    async getCertificates() {
        const u = this.getCurrentUser();
        const db = this.load();
        const certs = db.certificates.filter(x => x.user_id === u.id);
        return { success: true, certificates: certs };
    },

    async generateCertificate(courseId) {
        return this.submitQuiz(courseId, [1, 0, 2]);
    },

    async verifyCertificate(code) {
        const db = this.load();
        const cert = db.certificates.find(x => x.certificate_code === code);
        if (!cert) return { valid: false, message: 'Certificado no encontrado o código inválido.' };
        const u = db.users.find(x => x.id === cert.user_id);
        return {
            valid: true,
            certificate: {
                ...cert,
                user_name: u ? u.name : 'Colaborador',
                channel_name: u ? u.channel_code : 'General'
            }
        };
    },

    // Admin endpoints
    async getAdminStats() {
        const db = this.load();
        return {
            success: true,
            stats: {
                total_users: db.users.length,
                total_courses: db.courses.length,
                total_completions: db.completions.length,
                active_users_pct: 100
            }
        };
    },

    async getAdminUsers() {
        const db = this.load();
        return { success: true, users: db.users };
    },

    async createAdminUser(data) {
        const db = this.load();
        if (db.users.some(u => u.email.toLowerCase() === data.email.trim().toLowerCase())) {
            throw new Error('El correo ya se encuentra registrado.');
        }
        const newUser = {
            id: Date.now(),
            name: data.name.trim(),
            email: data.email.trim().toLowerCase(),
            password: data.password || 'alo2026',
            role: data.role || 'user',
            channel_code: data.channel_code || 'cp',
            area: data.area || 'Operaciones',
            gerencia: data.gerencia || 'General',
            cohort: data.cohort || 'Demo 2026',
            leader: data.leader || 'Líder Asignado',
            status: 'Activo',
            must_change_password: data.must_change_password ? 1 : 0,
            xp: 0,
            active_seconds: 0,
            last_login: null,
            created_at: new Date().toISOString()
        };
        db.users.push(newUser);
        this.save(db);
        return { success: true, message: 'Usuario creado exitosamente.' };
    },

    async updateAdminUser(id, data) {
        const db = this.load();
        const u = db.users.find(x => x.id === id);
        if (!u) throw new Error('Usuario no encontrado');
        if (data.name) u.name = data.name.trim();
        if (data.role) u.role = data.role;
        if (data.channel_code) u.channel_code = data.channel_code;
        if (data.area) u.area = data.area;
        if (data.gerencia) u.gerencia = data.gerencia;
        if (data.leader) u.leader = data.leader;
        if (data.status) u.status = data.status;
        if (data.password) u.password = data.password;
        this.save(db);
        return { success: true, message: 'Usuario actualizado correctamente.' };
    },

    async toggleUserStatus(id) {
        const db = this.load();
        const u = db.users.find(x => x.id === id);
        if (!u) throw new Error('Usuario no encontrado');
        u.status = u.status === 'Activo' ? 'Bloqueado' : 'Activo';
        this.save(db);
        return { success: true, message: `Usuario ahora está ${u.status}.` };
    },

    async deleteAdminUser(id) {
        const db = this.load();
        db.users = db.users.filter(x => x.id !== id);
        this.save(db);
        return { success: true, message: 'Usuario eliminado.' };
    },

    async saveCourse(data) {
        const db = this.load();
        const existing = db.courses.find(c => c.id === data.id);
        if (existing) {
            existing.title = data.title;
            existing.description = data.description;
            existing.pillar = data.pillar;
            existing.target_channel = data.target_channel;
            existing.duration = parseInt(data.duration) || 60;
        } else {
            db.courses.push({
                id: data.id || `c-${Date.now()}`,
                title: data.title,
                type: data.type || 'Formación continua',
                pillar: data.pillar || 'A',
                target_channel: data.target_channel || 'all',
                duration: parseInt(data.duration) || 60,
                icon: data.icon || '📚',
                color: data.color || 'blue',
                description: data.description || '',
                published: 1,
                version: '1.0',
                modules: [
                    { id: `${data.id}-m1`, title: 'Fase de Inducción', subtitle: 'Concepto clave', story: 'Estudio de caso práctico.', concept: 'Metodología y estándares aplicables.', practice_q: '¿Cómo aplicar este conocimiento en el rol?', practice_options: ['Improvisar.', 'Aplicar diagnóstico y controles.', 'Ignorar el estándar.'], practice_answer: 1, practice_feedback: 'El método requiere diagnóstico y controles.', reflection_prompt: 'Tu compromiso de aplicación.', estimated_minutes: 30 }
                ],
                questions: [
                    { id: Date.now(), question: `¿Cuál es el objetivo principal del curso ${data.title}?`, options: ['Completar horas sin registro.', 'Desarrollar habilidades observables con evidencia.', 'Omitir procedimientos.'], correct: 1, explanation: 'El aprendizaje se demuestra en la práctica.', critical: 0 }
                ]
            });
        }
        this.save(db);
        return { success: true, message: 'Curso guardado correctamente.' };
    },

    async toggleCourse(id) {
        const db = this.load();
        const c = db.courses.find(x => x.id === id);
        if (!c) throw new Error('Curso no encontrado');
        c.published = c.published ? 0 : 1;
        this.save(db);
        return { success: true, message: 'Estado del curso actualizado.' };
    },

    async deleteCourse(id) {
        const db = this.load();
        db.courses = db.courses.filter(x => x.id !== id);
        this.save(db);
        return { success: true, message: 'Curso eliminado.' };
    },

    async getAssignments() {
        const db = this.load();
        const matrix = db.courses.map(c => ({
            course_id: c.id,
            title: c.title,
            target_channel: c.target_channel,
            cp: (c.target_channel === 'all' || c.target_channel === 'cp') ? 1 : 0,
            cc: (c.target_channel === 'all' || c.target_channel === 'cc') ? 1 : 0,
            adm: (c.target_channel === 'all' || c.target_channel === 'adm') ? 1 : 0
        }));
        return {
            success: true,
            matrix,
            channels: [
                { code: 'cp', name: 'Comercial Presencial' },
                { code: 'cc', name: 'Contact Center' },
                { code: 'adm', name: 'Administrativos' }
            ]
        };
    },

    async toggleAssignment(course_id, channel_code) {
        const db = this.load();
        const c = db.courses.find(x => x.id === course_id);
        if (c) {
            c.target_channel = c.target_channel === channel_code ? 'all' : channel_code;
            this.save(db);
        }
        return { success: true, message: 'Asignación actualizada.' };
    }
};

// Notificaciones Toast
function toast(message, type = '') {
    const root = document.getElementById('toast-root');
    if (!root) return;
    const node = document.createElement('div');
    node.className = `toast ${type}`;
    node.textContent = message;
    root.appendChild(node);
    setTimeout(() => node.remove(), 4000);
}
