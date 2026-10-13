// Panel del Administrador (ALO Control Center) Completo y Funcional
const Admin = {
    activeTab: 'dashboard',
    statsData: null,
    usersData: [],
    coursesData: [],
    matrixData: [],

    async init(tab = null) {
        if (tab) this.activeTab = tab;
        this.render();
    },

    async render() {
        const root = document.getElementById('page-root');
        root.innerHTML = `
            <div class="page-head">
                <div>
                    <span class="eyebrow">👑 ALO CONTROL CENTER · MODO ADMINISTRADOR</span>
                    <h1 style="margin:0">Panel de Control General</h1>
                    <p>Gestiona colaboradores, cursos, asignación por canales y métricas en tiempo real.</p>
                </div>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                    <button class="btn btn-primary" onclick="Admin.openUserModal()">➕ Nuevo Usuario</button>
                    <button class="btn btn-primary" style="background:linear-gradient(110deg, #12815f, #0c9376);" onclick="Admin.openCourseModal()">➕ Publicar Curso</button>
                </div>
            </div>

            <!-- Navegación de Pestañas del Administrador -->
            <div style="display:flex; gap:8px; border-bottom:2px solid var(--line); margin-bottom:22px; flex-wrap:wrap;">
                <button class="btn ${this.activeTab==='dashboard'?'btn-primary':'btn-soft'}" onclick="Admin.switchTab('dashboard')">
                    📊 Dashboard & Estadísticas
                </button>
                <button class="btn ${this.activeTab==='users'?'btn-primary':'btn-soft'}" onclick="Admin.switchTab('users')">
                    👥 Usuarios & Roles
                </button>
                <button class="btn ${this.activeTab==='courses'?'btn-primary':'btn-soft'}" onclick="Admin.switchTab('courses')">
                    📚 Cursos & Módulos
                </button>
                <button class="btn ${this.activeTab==='matrix'?'btn-primary':'btn-soft'}" onclick="Admin.switchTab('matrix')">
                    🎯 Matriz de Canales (Asignación)
                </button>
            </div>

            <div id="admin-tab-content">
                <div style="text-align:center; padding:40px;">Cargando información del Control Center...</div>
            </div>
        `;

        this.loadTabContent();
    },

    switchTab(tab) {
        Sound.playClick();
        this.activeTab = tab;
        SPA.renderSidebar();
        this.render();
    },

    async loadTabContent() {
        const container = document.getElementById('admin-tab-content');
        if (!container) return;

        if (this.activeTab === 'dashboard') {
            await this.renderDashboard(container);
        } else if (this.activeTab === 'users') {
            await this.renderUsersTab(container);
        } else if (this.activeTab === 'courses') {
            await this.renderCoursesTab(container);
        } else if (this.activeTab === 'matrix') {
            await this.renderMatrixTab(container);
        }
    },

    // 1. DASHBOARD & MÉTRICAS
    async renderDashboard(container) {
        try {
            const res = await API.getAdminStats();
            const s = res.stats;
            this.statsData = s;

            container.innerHTML = `
                <div class="kpi-grid" style="margin-bottom:24px;">
                    <div class="card kpi-card">
                        <span class="kpi-icon blue">👥</span>
                        <div>
                            <span class="kpi-label">Usuarios Activos</span>
                            <strong class="kpi-value">${s.active_users} / ${s.total_users}</strong>
                            <span class="kpi-sub">Total registrados</span>
                        </div>
                    </div>
                    <div class="card kpi-card">
                        <span class="kpi-icon green">📚</span>
                        <div>
                            <span class="kpi-label">Cursos en Catálogo</span>
                            <strong class="kpi-value">${s.total_courses}</strong>
                            <span class="kpi-sub">Activos en plataforma</span>
                        </div>
                    </div>
                    <div class="card kpi-card">
                        <span class="kpi-icon gold">🎯</span>
                        <div>
                            <span class="kpi-label">Nota Promedio</span>
                            <strong class="kpi-value">${s.avg_score}%</strong>
                            <span class="kpi-sub">Evaluaciones</span>
                        </div>
                    </div>
                    <div class="card kpi-card">
                        <span class="kpi-icon blue">⏱️</span>
                        <div>
                            <span class="kpi-label">Horas Estimadas</span>
                            <strong class="kpi-value">${s.total_hours} h</strong>
                            <span class="kpi-sub">Tiempo acumulado</span>
                        </div>
                    </div>
                </div>

                <div class="section-head">
                    <div>
                        <h2>Estado de los 3 Canales de Formación</h2>
                        <p>Segmentación en tiempo real por cada grupo operativo.</p>
                    </div>
                    <button class="btn btn-outline btn-small" onclick="Admin.switchTab('matrix')">Ver Matriz de Asignación →</button>
                </div>

                <div class="level-grid" style="margin-bottom:28px;">
                    ${Object.entries(s.channels).map(([code, ch]) => `
                        <div class="card level-card current">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span class="mini-badge ${ch.color}" style="font-size:11px; font-weight:900;">${ch.icon} ${ch.short}</span>
                                <span style="font-weight:900; font-size:12px;">${ch.user_count} asesores</span>
                            </div>
                            <h3 style="margin:16px 0 6px;">${ch.name}</h3>
                            <div style="margin:12px 0;">
                                <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px;">
                                    <span>Avance Promedio Onboarding:</span>
                                    <b>${ch.avg_progress}%</b>
                                </div>
                                <div class="progress-track" style="margin:0;"><div class="progress-fill green" style="width:${ch.avg_progress}%"></div></div>
                            </div>
                            <div style="display:flex; justify-content:space-between; font-size:11px; margin-top:8px;">
                                <span>Promedio en Quizzes:</span>
                                <b>${ch.avg_score}%</b>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="section-head">
                    <div>
                        <h2>Últimos Intentos de Evaluación</h2>
                        <p>Registro histórico de calificaciones recientes.</p>
                    </div>
                </div>

                <div class="data-table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Colaborador</th>
                                <th>Canal</th>
                                <th>Curso</th>
                                <th>Nota</th>
                                <th>Resultado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${s.recent_attempts.length ? s.recent_attempts.map(a => `
                                <tr>
                                    <td>${a.completed_at}</td>
                                    <td><strong>${a.user_name}</strong></td>
                                    <td><span class="mini-badge">${a.channel_code?.toUpperCase()}</span></td>
                                    <td>${a.course_title}</td>
                                    <td><strong>${a.score}%</strong> (${a.correct_count}/${a.total_count})</td>
                                    <td>
                                        <span class="mini-badge ${a.passed ? 'green' : 'red'}">
                                            ${a.passed ? 'Aprobado' : (a.critical_wrong ? 'Error Crítico' : 'Refuerzo')}
                                        </span>
                                    </td>
                                </tr>
                            `).join('') : '<tr><td colspan="6" style="text-align:center; padding:20px;">Sin evaluaciones registradas aún.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (e) {
            container.innerHTML = `<div class="card" style="color:var(--red);">Error al cargar estadísticas: ${e.message}</div>`;
        }
    },

    // 2. GESTIÓN DE USUARIOS Y ROLES (CREAR, EDITAR, BLOQUEAR, ELIMINAR)
    async renderUsersTab(container) {
        try {
            const res = await API.getAdminUsers();
            this.usersData = res.users;

            container.innerHTML = `
                <!-- Formulario Rápido de Creación de Usuario -->
                <div class="card" style="margin-bottom:24px; border:2px solid #e1e8f7;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
                        <div>
                            <h3 style="margin:0;">➕ Agregar Nuevo Usuario a la Plataforma</h3>
                            <small style="color:var(--muted);">Crea un nuevo colaborador, asígnale su canal y permisos de acceso.</small>
                        </div>
                    </div>
                    <form id="quick-user-form" onsubmit="Admin.handleQuickCreateUser(event)">
                        <div class="form-grid">
                            <div class="form-field">
                                <label>Nombre Completo *</label>
                                <input type="text" name="name" class="text-input" required placeholder="Ej: Andrés Morales">
                            </div>
                            <div class="form-field">
                                <label>Correo Electrónico *</label>
                                <input type="email" name="email" class="text-input" required placeholder="andres@alocredit.com">
                            </div>
                            <div class="form-field">
                                <label>Canal Asignado (Segmento) *</label>
                                <select name="channel_code" class="select" required>
                                    <option value="cp">🏪 Comercial Presencial</option>
                                    <option value="cc">🎧 Contact Center</option>
                                    <option value="adm">💻 Administrativos</option>
                                    <option value="all">🌐 Todos / Corporativo</option>
                                </select>
                            </div>
                            <div class="form-field">
                                <label>Rol de Permisos *</label>
                                <select name="role" class="select" required>
                                    <option value="user">Colaborador (Estudiante)</option>
                                    <option value="admin">Administrador (Acceso Control Center)</option>
                                </select>
                            </div>
                            <div class="form-field">
                                <label>Contraseña Inicial *</label>
                                <input type="password" name="password" class="text-input" required value="alo2026" placeholder="alo2026">
                            </div>
                            <div class="form-field" style="justify-content:center;">
                                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; margin-top:14px;">
                                    <input type="checkbox" name="must_change_password" value="1" checked>
                                    <span style="font-size:11px;">Exigir cambio de clave en 1er ingreso 🔒</span>
                                </label>
                            </div>
                        </div>
                        <div style="margin-top:16px; text-align:right;">
                            <button type="submit" class="btn btn-primary">✓ Crear y Asignar Usuario</button>
                        </div>
                    </form>
                </div>

                <div class="section-head">
                    <div>
                        <h2>Listado de Colaboradores Registrados (${this.usersData.length})</h2>
                        <p>Edita datos, bloquea cuentas o elimina perfiles.</p>
                    </div>
                </div>

                <div class="data-table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Colaborador</th>
                                <th>Rol</th>
                                <th>Canal Asignado</th>
                                <th>Área</th>
                                <th>Estado</th>
                                <th>Progreso</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.usersData.map(u => `
                                <tr>
                                    <td>
                                        <strong>${u.name}</strong>
                                        <div style="font-size:10px; color:var(--muted);">${u.email}</div>
                                        ${u.must_change_password ? '<span class="mini-badge red" style="font-size:8px;">Debe cambiar clave</span>' : ''}
                                    </td>
                                    <td><span class="mini-badge ${u.role === 'admin' ? 'gold' : 'blue'}">${u.role.toUpperCase()}</span></td>
                                    <td>
                                        <span class="mini-badge ${u.channel_code === 'cp' ? 'orange' : (u.channel_code === 'cc' ? 'purple' : (u.channel_code === 'adm' ? 'green' : 'blue'))}">
                                            ${u.channel_code === 'cp' ? '🏪 Comercial' : (u.channel_code === 'cc' ? '🎧 Contact Center' : (u.channel_code === 'adm' ? '💻 Administrativos' : '🌐 Todos'))}
                                        </span>
                                    </td>
                                    <td>${u.area || '—'}</td>
                                    <td>
                                        <span class="mini-badge ${u.status === 'Activo' ? 'green' : 'red'}">
                                            ${u.status}
                                        </span>
                                    </td>
                                    <td>${u.xp} XP / ${Math.round(u.active_seconds/3600*10)/10} h</td>
                                    <td>
                                        <div class="data-actions">
                                            <button class="btn btn-small btn-outline" onclick="Admin.openUserModal(${u.id})">Editar</button>
                                            <button class="btn btn-small ${u.status === 'Activo' ? 'btn-danger' : 'btn-soft'}" onclick="Admin.toggleUserStatus(${u.id})">
                                                ${u.status === 'Activo' ? 'Bloquear' : 'Desbloquear'}
                                            </button>
                                            ${u.id !== Auth.currentUser.id ? `<button class="btn btn-small btn-danger" onclick="Admin.deleteUser(${u.id})">Eliminar</button>` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (e) {
            container.innerHTML = `<div class="card" style="color:var(--red);">Error al cargar usuarios: ${e.message}</div>`;
        }
    },

    async handleQuickCreateUser(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.must_change_password = form.querySelector('[name="must_change_password"]').checked ? 1 : 0;

        try {
            Sound.playClick();
            await API.createAdminUser(data);
            Sound.playSuccess();
            toast('Usuario creado y asignado exitosamente.', 'success');
            form.reset();
            this.loadTabContent();
        } catch (err) {
            Sound.playError();
            toast(err.message, 'error');
        }
    },

    // 3. GESTIÓN DE CURSOS Y PUBLICACIÓN (CREAR, SEGMENTAR, EDITAR)
    async renderCoursesTab(container) {
        try {
            const res = await API.getCourses();
            this.coursesData = res.courses;

            container.innerHTML = `
                <!-- Formulario Rápido de Creación de Curso -->
                <div class="card" style="margin-bottom:24px; border:2px solid #e1e8f7;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
                        <div>
                            <h3 style="margin:0;">➕ Crear y Publicar Nuevo Curso</h3>
                            <small style="color:var(--muted);">Define el título, contenido y decide si lo ven todos los canales o un canal específico.</small>
                        </div>
                    </div>
                    <form id="quick-course-form" onsubmit="Admin.handleQuickCreateCourse(event)">
                        <div class="form-grid">
                            <div class="form-field full">
                                <label>Título del Curso *</label>
                                <input type="text" name="title" class="text-input" required placeholder="Ej: Gestión de Cobranza Empática">
                            </div>
                            <div class="form-field">
                                <label>¿Qué Canal lo va a Ver? (Segmentación) *</label>
                                <select name="target_channel" class="select" required>
                                    <option value="all">🌐 Todos los Canales (Transversal)</option>
                                    <option value="cp">🏪 Solo Canal Comercial Presencial</option>
                                    <option value="cc">🎧 Solo Canal Contact Center</option>
                                    <option value="adm">💻 Solo Canal Administrativos</option>
                                </select>
                            </div>
                            <div class="form-field">
                                <label>Tipo de Curso</label>
                                <select name="type" class="select">
                                    <option value="Formación continua">Formación continua</option>
                                    <option value="Liderazgo">Liderazgo</option>
                                    <option value="A la medida">A la medida</option>
                                    <option value="Onboarding">Onboarding</option>
                                </select>
                            </div>
                            <div class="form-field">
                                <label>Pilar A.L.O.</label>
                                <select name="pillar" class="select">
                                    <option value="A">🧠 Aprendizaje (A)</option>
                                    <option value="L">🤝 Liderazgo (L)</option>
                                    <option value="O">⭐ Obsesión cliente (O)</option>
                                </select>
                            </div>
                            <div class="form-field">
                                <label>Duración Estimada (Minutos)</label>
                                <input type="number" name="duration" class="text-input" required value="45">
                            </div>
                            <div class="form-field full">
                                <label>Descripción del Curso *</label>
                                <textarea name="description" class="textarea" required placeholder="Describe las habilidades que aprenderán los asesores..."></textarea>
                            </div>
                        </div>
                        <div style="margin-top:16px; text-align:right;">
                            <button type="submit" class="btn btn-primary" style="background:linear-gradient(110deg, #12815f, #0c9376);">
                                ✓ Publicar Curso en Plataforma
                            </button>
                        </div>
                    </form>
                </div>

                <div class="section-head">
                    <div>
                        <h2>Catálogo de Cursos Existentes (${this.coursesData.length})</h2>
                        <p>Edita contenidos, oculta cursos o elimínalos.</p>
                    </div>
                </div>

                <div class="data-table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Curso</th>
                                <th>Tipo</th>
                                <th>Canal que lo ve</th>
                                <th>Duración</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.coursesData.map(c => `
                                <tr>
                                    <td>
                                        <strong>${c.icon} ${c.title}</strong>
                                        <div style="font-size:10px; color:var(--muted);">${c.description.substring(0, 65)}...</div>
                                    </td>
                                    <td><span class="mini-badge">${c.type}</span></td>
                                    <td>
                                        <span class="mini-badge ${c.target_channel === 'all' ? 'gold' : 'blue'}">
                                            ${c.target_channel === 'all' ? '🌐 Todos los Canales' : (c.target_channel === 'cp' ? '🏪 Comercial' : (c.target_channel === 'cc' ? '🎧 Contact Center' : '💻 Administrativos'))}
                                        </span>
                                    </td>
                                    <td>${c.duration} min</td>
                                    <td>
                                        <span class="mini-badge ${c.published ? 'green' : 'red'}">
                                            ${c.published ? 'Publicado' : 'Oculto'}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="data-actions">
                                            <button class="btn btn-small btn-outline" onclick="Admin.openCourseModal('${c.id}')">Editar</button>
                                            <button class="btn btn-small btn-soft" onclick="Admin.toggleCourse('${c.id}')">${c.published ? 'Ocultar' : 'Publicar'}</button>
                                            ${!c.id.startsWith('onb-') ? `<button class="btn btn-small btn-danger" onclick="Admin.deleteCourse('${c.id}')">Eliminar</button>` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (e) {
            container.innerHTML = `<div class="card" style="color:var(--red);">Error al cargar cursos: ${e.message}</div>`;
        }
    },

    async handleQuickCreateCourse(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.published = 1;
        data.scope = data.target_channel === 'all' ? 'all' : 'channel';

        try {
            Sound.playClick();
            await API.saveCourse(data);
            Sound.playSuccess();
            toast('Curso publicado exitosamente.', 'success');
            form.reset();
            this.loadTabContent();
        } catch (err) {
            Sound.playError();
            toast(err.message, 'error');
        }
    },

    // 4. MATRIZ DE CANALES (ASIGNACIÓN DINÁMICA: QUÉ CANAL VE QUÉ CURSO)
    async renderMatrixTab(container) {
        try {
            const res = await API.getAssignments();
            this.matrixData = res.matrix || [];

            container.innerHTML = `
                <div class="card" style="background:#f8faff; border:2px dashed #b9c6e9; margin-bottom:20px; padding:18px;">
                    <h3 style="margin:0 0 6px;">🎯 Matriz Interactiva de Asignación por Canales</h3>
                    <p style="margin:0; font-size:11px; color:var(--muted);">
                        Haz clic sobre los botones para activar o desactivar en tiempo real la visibilidad de cada curso para cada uno de los 3 canales. Los cambios tienen efecto inmediato.
                    </p>
                </div>

                <div class="data-table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th style="width:35%;">Curso</th>
                                <th style="text-align:center;">🏪 Comercial Presencial</th>
                                <th style="text-align:center;">🎧 Contact Center</th>
                                <th style="text-align:center;">💻 Administrativos</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.matrixData.map(c => `
                                <tr>
                                    <td>
                                        <strong>${c.title}</strong>
                                        <div style="font-size:10px; color:var(--muted);">${c.type}</div>
                                    </td>
                                    <td style="text-align:center;">
                                        <button class="btn btn-small ${c.channels.cp ? 'btn-primary' : 'btn-outline'}" 
                                            style="${c.channels.cp ? 'background:#12815f;' : 'opacity:0.6;'}"
                                            onclick="Admin.toggleChannelAssignment('${c.id}', 'cp')">
                                            ${c.channels.cp ? '✓ Activo' : '✕ Inactivo'}
                                        </button>
                                    </td>
                                    <td style="text-align:center;">
                                        <button class="btn btn-small ${c.channels.cc ? 'btn-primary' : 'btn-outline'}" 
                                            style="${c.channels.cc ? 'background:#7b78d3;' : 'opacity:0.6;'}"
                                            onclick="Admin.toggleChannelAssignment('${c.id}', 'cc')">
                                            ${c.channels.cc ? '✓ Activo' : '✕ Inactivo'}
                                        </button>
                                    </td>
                                    <td style="text-align:center;">
                                        <button class="btn btn-small ${c.channels.adm ? 'btn-primary' : 'btn-outline'}" 
                                            style="${c.channels.adm ? 'background:#fa8514;' : 'opacity:0.6;'}"
                                            onclick="Admin.toggleChannelAssignment('${c.id}', 'adm')">
                                            ${c.channels.adm ? '✓ Activo' : '✕ Inactivo'}
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (e) {
            container.innerHTML = `<div class="card" style="color:var(--red);">Error al cargar matriz: ${e.message}</div>`;
        }
    },

    async toggleChannelAssignment(courseId, channelCode) {
        try {
            Sound.playClick();
            await API.toggleAssignment(courseId, channelCode);
            Sound.playSuccess();
            toast('Asignación de canal actualizada.', 'success');
            this.loadTabContent();
        } catch (err) {
            Sound.playError();
            toast(err.message, 'error');
        }
    },

    // MODAL DE USUARIO
    openUserModal(userId = null) {
        Sound.playClick();
        const user = userId ? this.usersData.find(u => u.id === Number(userId)) : null;
        const modalRoot = document.getElementById('modal-root');

        modalRoot.innerHTML = `
            <div class="modal-overlay">
                <div class="modal">
                    <div class="modal-top">
                        <h2>${user ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}</h2>
                        <button class="modal-x" onclick="document.getElementById('modal-root').innerHTML=''">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="admin-user-form" onsubmit="Admin.handleSaveUser(event, ${user ? user.id : 'null'})">
                            <div class="form-grid">
                                <div class="form-field full">
                                    <label>Nombre Completo *</label>
                                    <input type="text" name="name" class="text-input" required value="${user ? user.name : ''}" placeholder="Ej: Laura Méndez">
                                </div>
                                <div class="form-field full">
                                    <label>Correo Institucional *</label>
                                    <input type="email" name="email" class="text-input" required value="${user ? user.email : ''}" placeholder="laura@alocredit.com">
                                </div>
                                <div class="form-field">
                                    <label>Canal Asignado *</label>
                                    <select name="channel_code" class="select" required>
                                        <option value="cp" ${user?.channel_code==='cp'?'selected':''}>🏪 Comercial Presencial</option>
                                        <option value="cc" ${user?.channel_code==='cc'?'selected':''}>🎧 Contact Center</option>
                                        <option value="adm" ${user?.channel_code==='adm'?'selected':''}>💻 Administrativos</option>
                                        <option value="all" ${user?.channel_code==='all'?'selected':''}>🌐 Todos / Corporativo</option>
                                    </select>
                                </div>
                                <div class="form-field">
                                    <label>Rol de Acceso *</label>
                                    <select name="role" class="select" required>
                                        <option value="user" ${user?.role==='user'?'selected':''}>Colaborador (Estudiante)</option>
                                        <option value="admin" ${user?.role==='admin'?'selected':''}>Administrador (Control Center)</option>
                                    </select>
                                </div>
                                <div class="form-field">
                                    <label>Área</label>
                                    <input type="text" name="area" class="text-input" value="${user?.area || ''}" placeholder="Ej: Comercial">
                                </div>
                                <div class="form-field">
                                    <label>Contraseña ${user ? '(Dejar en blanco para conservar)' : '*'}</label>
                                    <input type="password" name="password" class="text-input" ${user ? '' : 'required'} placeholder="${user ? '••••••••' : 'alo2026'}">
                                </div>
                                <div class="form-field full">
                                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                                        <input type="checkbox" name="must_change_password" value="1" ${user?.must_change_password ? 'checked' : (user ? '' : 'checked')}>
                                        <span>Exigir cambio obligatorio de contraseña en el próximo inicio</span>
                                    </label>
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-outline" onclick="document.getElementById('modal-root').innerHTML=''">Cancelar</button>
                                <button type="submit" class="btn btn-primary">Guardar Usuario</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    },

    async handleSaveUser(e, userId) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.must_change_password = form.querySelector('[name="must_change_password"]').checked ? 1 : 0;

        try {
            Sound.playClick();
            if (userId) {
                await API.updateAdminUser(userId, data);
                toast('Usuario actualizado exitosamente.', 'success');
            } else {
                await API.createAdminUser(data);
                toast('Usuario registrado exitosamente.', 'success');
            }
            Sound.playSuccess();
            document.getElementById('modal-root').innerHTML = '';
            this.loadTabContent();
        } catch (err) {
            Sound.playError();
            toast(err.message, 'error');
        }
    },

    async toggleUserStatus(id) {
        try {
            Sound.playClick();
            const res = await API.toggleUserStatus(id);
            toast(res.message, 'success');
            this.loadTabContent();
        } catch (err) {
            Sound.playError();
            toast(err.message, 'error');
        }
    },

    async deleteUser(id) {
        if (!confirm('¿Estás seguro de eliminar este usuario? Sus avances e intentos se borrarán.')) return;
        try {
            Sound.playClick();
            const res = await API.deleteAdminUser(id);
            toast(res.message, 'success');
            this.loadTabContent();
        } catch (err) {
            Sound.playError();
            toast(err.message, 'error');
        }
    },

    // MODAL DE CURSO
    openCourseModal(courseId = null) {
        Sound.playClick();
        const course = courseId ? this.coursesData.find(c => c.id === courseId) : null;
        const modalRoot = document.getElementById('modal-root');

        modalRoot.innerHTML = `
            <div class="modal-overlay">
                <div class="modal wide">
                    <div class="modal-top">
                        <h2>${course ? 'Editar Curso' : 'Publicar Nuevo Curso'}</h2>
                        <button class="modal-x" onclick="document.getElementById('modal-root').innerHTML=''">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="admin-course-form" onsubmit="Admin.handleSaveCourse(event, '${course ? course.id : ''}')">
                            <div class="form-grid">
                                <div class="form-field full">
                                    <label>Título del Curso *</label>
                                    <input type="text" name="title" class="text-input" required value="${course ? course.title : ''}" placeholder="Ej: Manejo de Datos y Privacidad">
                                </div>
                                <div class="form-field">
                                    <label>Tipo de Curso</label>
                                    <select name="type" class="select">
                                        <option value="Formación continua" ${course?.type==='Formación continua'?'selected':''}>Formación continua</option>
                                        <option value="Liderazgo" ${course?.type==='Liderazgo'?'selected':''}>Liderazgo</option>
                                        <option value="A la medida" ${course?.type==='A la medida'?'selected':''}>A la medida</option>
                                        <option value="Onboarding" ${course?.type==='Onboarding'?'selected':''}>Onboarding</option>
                                    </select>
                                </div>
                                <div class="form-field">
                                    <label>¿Qué Canal lo va a Ver? *</label>
                                    <select name="target_channel" class="select" required>
                                        <option value="all" ${course?.target_channel==='all'?'selected':''}>🌐 Todos los Canales (Transversal)</option>
                                        <option value="cp" ${course?.target_channel==='cp'?'selected':''}>🏪 Solo Canal Comercial Presencial</option>
                                        <option value="cc" ${course?.target_channel==='cc'?'selected':''}>🎧 Solo Canal Contact Center</option>
                                        <option value="adm" ${course?.target_channel==='adm'?'selected':''}>💻 Solo Canal Administrativos</option>
                                    </select>
                                </div>
                                <div class="form-field">
                                    <label>Pilar A.L.O.</label>
                                    <select name="pillar" class="select">
                                        <option value="A" ${course?.pillar==='A'?'selected':''}>🧠 Aprendizaje (A)</option>
                                        <option value="L" ${course?.pillar==='L'?'selected':''}>🤝 Liderazgo (L)</option>
                                        <option value="O" ${course?.pillar==='O'?'selected':''}>⭐ Obsesión cliente (O)</option>
                                    </select>
                                </div>
                                <div class="form-field">
                                    <label>Duración Estimada (Minutos)</label>
                                    <input type="number" name="duration" class="text-input" required value="${course ? course.duration : 60}">
                                </div>
                                <div class="form-field full">
                                    <label>Descripción Pedagógica *</label>
                                    <textarea name="description" class="textarea" required placeholder="Describe los objetivos y el alcance formativo...">${course ? course.description : ''}</textarea>
                                </div>
                                <div class="form-field full">
                                    <label style="display:flex; align-items:center; gap:8px;">
                                        <input type="checkbox" name="published" value="1" ${course ? (course.published ? 'checked' : '') : 'checked'}>
                                        <span>Publicar de inmediato en el catálogo de los canales asignados</span>
                                    </label>
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-outline" onclick="document.getElementById('modal-root').innerHTML=''">Cancelar</button>
                                <button type="submit" class="btn btn-primary">Guardar y Publicar</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    },

    async handleSaveCourse(e, courseId) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        if (courseId) data.id = courseId;
        data.published = form.querySelector('[name="published"]').checked ? 1 : 0;
        data.scope = data.target_channel === 'all' ? 'all' : 'channel';

        try {
            Sound.playClick();
            await API.saveCourse(data);
            Sound.playSuccess();
            toast('Curso guardado con éxito.', 'success');
            document.getElementById('modal-root').innerHTML = '';
            this.loadTabContent();
        } catch (err) {
            Sound.playError();
            toast(err.message, 'error');
        }
    },

    async toggleCourse(id) {
        try {
            Sound.playClick();
            const res = await API.toggleCourse(id);
            toast(res.message, 'success');
            this.loadTabContent();
        } catch (err) {
            Sound.playError();
            toast(err.message, 'error');
        }
    },

    async deleteCourse(id) {
        if (!confirm('¿Estás seguro de eliminar este curso?')) return;
        try {
            Sound.playClick();
            const res = await API.deleteCourse(id);
            toast(res.message, 'success');
            this.loadTabContent();
        } catch (err) {
            Sound.playError();
            toast(err.message, 'error');
        }
    }
};
