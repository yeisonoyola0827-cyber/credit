// Orquestador SPA y Vistas de la Escuela A.L.O.
const SPA = {
    user: null,
    currentPage: 'home',
    courses: [],

    init(user) {
        this.user = user;
        this.renderShell();
        if (user.role === 'admin') {
            this.navigate('admin');
        } else {
            this.navigate('home');
        }
    },

    renderShell() {
        const root = document.getElementById('app-root');
        root.innerHTML = `
            <div class="app-shell">
                <aside id="sidebar" class="sidebar"></aside>
                <div class="shell-main">
                    <header id="topbar" class="topbar"></header>
                    <main id="page-root" class="page-root" tabindex="-1"></main>
                    <footer class="app-footer">
                        <span>Escuela A.L.O. · Aló Credit 2026 · Arquitectura MVC PHP + SPA</span>
                        <div style="display:flex; gap:10px; align-items:center;">
                            <span>Canal Activo: <b>${this.getChannelLabel(this.user.channel_code)}</b></span>
                            <span class="mini-badge ${this.user.role === 'admin' ? 'gold' : 'blue'}">${this.user.role.toUpperCase()}</span>
                        </div>
                    </footer>
                </div>
            </div>
            <div id="modal-root"></div>
            <div id="toast-root"></div>
        `;
        this.renderSidebar();
        this.renderTopbar();
    },

    getChannelLabel(code) {
        const map = {
            'cp': '🏪 Comercial Presencial',
            'cc': '🎧 Contact Center',
            'adm': '💻 Administrativos',
            'all': '🌐 Todos los Canales'
        };
        return map[code] || code;
    },

    renderSidebar() {
        const u = this.user;
        const xp = u.xp || 0;
        const level = Math.floor(xp / 500) + 1;
        const isAdmin = u.role === 'admin';

        const sidebar = document.getElementById('sidebar');
        sidebar.innerHTML = `
            <div class="brand-pane">
                <div class="brand-bottom">ESCUELA <b>A.L.O.</b></div>
            </div>

            ${isAdmin ? `
                <div class="side-kicker" style="color:#ffd054;">👑 ALO Control Center</div>
                <nav class="side-nav" style="margin-bottom:12px;">
                    <button class="nav-btn ${this.currentPage==='admin'&&Admin.activeTab==='dashboard'?'active':''}" onclick="SPA.navigate('admin', 'dashboard')">
                        <span class="nav-icon">📊</span><span>Dashboard & Métricas</span>
                    </button>
                    <button class="nav-btn ${this.currentPage==='admin'&&Admin.activeTab==='users'?'active':''}" onclick="SPA.navigate('admin', 'users')">
                        <span class="nav-icon">👥</span><span>Usuarios & Roles</span>
                    </button>
                    <button class="nav-btn ${this.currentPage==='admin'&&Admin.activeTab==='courses'?'active':''}" onclick="SPA.navigate('admin', 'courses')">
                        <span class="nav-icon">📚</span><span>Cursos & Publicación</span>
                    </button>
                    <button class="nav-btn ${this.currentPage==='admin'&&Admin.activeTab==='matrix'?'active':''}" onclick="SPA.navigate('admin', 'matrix')">
                        <span class="nav-icon">🎯</span><span>Matriz de Canales</span>
                    </button>
                </nav>
                <div class="side-divider"></div>
                <div class="side-kicker">🎮 Modo Vista Alumno</div>
            ` : `
                <div class="side-kicker">🎮 Zona de Aprendizaje</div>
            `}

            <nav class="side-nav">
                <button class="nav-btn ${this.currentPage==='home'?'active':''}" onclick="SPA.navigate('home')">
                    <span class="nav-icon">🏠</span><span>Inicio</span>
                </button>
                <button class="nav-btn ${this.currentPage==='onboarding'?'active':''}" onclick="SPA.navigate('onboarding')">
                    <span class="nav-icon">🗺️</span><span>Mi Onboarding</span>
                    <span class="nav-tag">CANAL</span>
                </button>
                <button class="nav-btn ${this.currentPage==='catalog'?'active':''}" onclick="SPA.navigate('catalog')">
                    <span class="nav-icon">📚</span><span>Formación Continua</span>
                </button>
                <button class="nav-btn ${this.currentPage==='leadership'?'active':''}" onclick="SPA.navigate('leadership')">
                    <span class="nav-icon">🧭</span><span>Escuela Liderazgo</span>
                </button>
                <button class="nav-btn ${this.currentPage==='evaluations'?'active':''}" onclick="SPA.navigate('evaluations')">
                    <span class="nav-icon">🧩</span><span>Evaluaciones</span>
                </button>
                <button class="nav-btn ${this.currentPage==='badges'?'active':''}" onclick="SPA.navigate('badges')">
                    <span class="nav-icon">🏆</span><span>Mis Certificados</span>
                </button>
            </nav>

            <div class="side-bottom">
                <div class="side-achievement">
                    <span>🌟</span>
                    <div>
                        <b>${xp} XP Acumulados</b>
                        <small>Nivel ${level} · Modo Aprendizaje</small>
                    </div>
                </div>
            </div>
        `;
    },

    renderTopbar() {
        const u = this.user;
        const isAdmin = u.role === 'admin';
        const topbar = document.getElementById('topbar');
        topbar.innerHTML = `
            <div>
                <span class="topbar-greeting">¡Hola, ${u.name.split(' ')[0]}! 👋</span>
                <span class="topbar-sub">${this.getChannelLabel(u.channel_code)}</span>
            </div>
            <div class="topbar-spacer"></div>

            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                ${isAdmin ? `
                    <button class="btn btn-small btn-primary" onclick="Admin.openUserModal()" title="Agregar nuevo colaborador">
                        ➕ Usuario
                    </button>
                    <button class="btn btn-small btn-primary" style="background:linear-gradient(110deg, #12815f, #0c9376);" onclick="Admin.openCourseModal()" title="Publicar nuevo curso">
                        ➕ Curso
                    </button>
                    <button class="btn btn-small btn-outline" onclick="SPA.navigate('admin')">
                        👑 Control Center
                    </button>
                ` : ''}

                <span class="top-pill ${isAdmin?'admin':''}">
                    ${isAdmin ? '⚙️ Administrador' : '🎮 Modo Alumno'}
                </span>

                <div class="user-picker">
                    <div class="user-avatar">${u.name[0]}</div>
                    <div>
                        <div class="user-name-label">${u.name}</div>
                        <small style="color:var(--muted); font-size:10px;">${u.email}</small>
                    </div>
                </div>

                <button class="btn-logout" onclick="Auth.logout()" title="Cerrar Sesión">
                    Cerrar Sesión ⎋
                </button>
            </div>
        `;
    },

    async navigate(page, tab = null) {
        Sound.playClick();
        this.currentPage = page;

        const root = document.getElementById('page-root');
        root.innerHTML = `<div style="text-align:center; padding:50px;">Cargando...</div>`;

        if (page === 'admin') {
            await Admin.init(tab);
        } else if (page === 'home') {
            await this.renderHome();
        } else if (page === 'onboarding') {
            await this.renderOnboarding();
        } else if (page === 'catalog') {
            await this.renderCatalog();
        } else if (page === 'leadership') {
            await this.renderLeadership();
        } else if (page === 'evaluations') {
            await this.renderEvaluations();
        } else if (page === 'badges') {
            await this.renderBadges();
        }
        this.renderSidebar();
    },

    async renderHome() {
        const res = await API.getCourses();
        this.courses = res.courses;

        const onbCourse = this.courses.find(c => c.type === 'Onboarding') || this.courses[0];
        const onbProg = onbCourse?.progress?.percentage || 0;

        const root = document.getElementById('page-root');
        root.innerHTML = `
            <div class="page-head">
                <div>
                    <span class="eyebrow">✨ UNIVERSO DE FORMACIÓN A.L.O.</span>
                    <h1 style="margin:0">Bienvenido a tu Aventura</h1>
                    <p>Canal Asignado: <b>${this.getChannelLabel(this.user.channel_code)}</b></p>
                </div>
            </div>

            <div class="hero">
                <div class="hero-content">
                    <span class="hero-top">⭐ EDUTAINMENT · ALÓ CREDIT 2026</span>
                    <h1>¡Sigue subiendo <em>de nivel!</em></h1>
                    <p>Aprende jugando con casos reales, responde microretos éticos y transforma tu talento en impacto para los clientes.</p>
                    <div class="hero-actions">
                        ${onbCourse ? `<button class="btn btn-primary" onclick="CoursePlayer.startCourse('${onbCourse.id}')">🚀 Continuar Mi Onboarding</button>` : ''}
                        <button class="btn btn-outline" style="background:#fff3; color:#fff; border-color:#fff6;" onclick="SPA.navigate('catalog')">Explorar Cursos</button>
                    </div>
                </div>
                <div class="hero-coin">🌟</div>
            </div>

            <div class="section-head">
                <div>
                    <h2>Tu Tablero de Mando</h2>
                    <p>Progreso correspondiente a tu canal formativo.</p>
                </div>
            </div>

            <div class="kpi-grid">
                <div class="card kpi-card">
                    <span class="kpi-icon blue">⏱️</span>
                    <div>
                        <span class="kpi-label">Tiempo Activo</span>
                        <strong class="kpi-value">${Math.round(this.user.active_seconds/60)} min</strong>
                        <span class="kpi-sub">En plataforma</span>
                    </div>
                </div>
                <div class="card kpi-card">
                    <span class="kpi-icon gold">🌟</span>
                    <div>
                        <span class="kpi-label">Experiencia</span>
                        <strong class="kpi-value">${this.user.xp} XP</strong>
                        <span class="kpi-sub">Logros acumulados</span>
                    </div>
                </div>
                <div class="card kpi-card">
                    <span class="kpi-icon green">🗺️</span>
                    <div>
                        <span class="kpi-label">Avance Onboarding</span>
                        <strong class="kpi-value">${onbProg}%</strong>
                        <span class="kpi-sub">Ruta de inducción</span>
                    </div>
                </div>
                <div class="card kpi-card">
                    <span class="kpi-icon blue">📚</span>
                    <div>
                        <span class="kpi-label">Cursos en tu Canal</span>
                        <strong class="kpi-value">${this.courses.length}</strong>
                        <span class="kpi-sub">Disponibles</span>
                    </div>
                </div>
            </div>

            <div class="section-head">
                <div>
                    <h2>Cursos de tu Canal</h2>
                    <p>Contenidos diseñados específicamente para tu rol y responsabilidades.</p>
                </div>
                <button class="btn btn-ghost" onclick="SPA.navigate('catalog')">Ver Todos →</button>
            </div>

            <div class="course-grid">
                ${this.courses.slice(0, 3).map(c => this.renderCourseCard(c)).join('')}
            </div>
        `;
    },

    renderCourseCard(c) {
        const prog = c.progress?.percentage || 0;
        return `
            <div class="card course-card">
                <div class="course-cover ${c.color}">
                    <span class="course-cover-label">${c.type.toUpperCase()} · PILAR ${c.pillar}</span>
                    <span class="course-cover-icon">${c.icon}</span>
                </div>
                <div class="course-body">
                    <h3>${c.title}</h3>
                    <p>${c.description}</p>
                    <div class="course-meta">
                        <span class="mini-badge">${c.duration} min</span>
                        <span class="mini-badge ${c.target_channel === 'all' ? 'gold' : 'blue'}">
                            ${c.target_channel === 'all' ? 'Transversal' : 'Canal'}
                        </span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill ${prog === 100 ? 'green' : ''}" style="width:${prog}%;"></div>
                    </div>
                    <div class="course-footer">
                        <small style="font-weight:800; color:var(--muted);">${prog}% completado</small>
                        <button class="btn btn-small btn-primary" onclick="CoursePlayer.startCourse('${c.id}')">
                            ${prog > 0 ? 'Continuar' : 'Iniciar'} →
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    async renderOnboarding() {
        const res = await API.getCourses();
        const onbCourse = res.courses.find(c => c.type === 'Onboarding') || res.courses[0];
        if (!onbCourse) {
            document.getElementById('page-root').innerHTML = '<div class="card">No hay curso de Onboarding asignado a tu canal.</div>';
            return;
        }

        const fullRes = await API.getCourse(onbCourse.id);
        const course = fullRes.course;
        const modules = course.modules || [];

        const root = document.getElementById('page-root');
        root.innerHTML = `
            <div class="page-head">
                <div>
                    <span class="eyebrow">🗺️ RUTA DE BIENVENIDA · TU CANAL</span>
                    <h1 style="margin:0">${course.title}</h1>
                    <p>Secuencia estructurada desde el Día 0 hasta la habilitación operativa y clínica.</p>
                </div>
                <button class="btn btn-primary" onclick="CoursePlayer.startQuiz('${course.id}')">Presentar Evaluación Final</button>
            </div>

            <div class="level-grid">
                ${modules.map((m, i) => `
                    <div class="card level-card ${m.completed ? 'finished' : 'current'}">
                        <div class="level-num">NIVEL ${i} · ${m.subtitle}</div>
                        <div class="level-large">${['🧰','🌈','🎯','🎮','⚡','🏆'][i] || '🎮'}</div>
                        <h3>${m.title}</h3>
                        <p style="font-size:11px; color:var(--muted); flex:1;">${m.story}</p>
                        <span class="mini-badge ${m.completed ? 'green' : 'orange'}" style="margin:10px 0;">
                            ${m.completed ? '✓ Misión Superada' : 'Disponible para Cursar'}
                        </span>
                        <button class="btn ${m.completed ? 'btn-outline' : 'btn-primary'} btn-wide" onclick="CoursePlayer.startCourse('${course.id}', ${i})">
                            ${m.completed ? 'Repasar Misión' : '¡Jugar Misión!'} →
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    async renderCatalog() {
        const res = await API.getCourses();
        const courses = res.courses;

        const root = document.getElementById('page-root');
        root.innerHTML = `
            <div class="page-head">
                <div>
                    <span class="eyebrow">📚 BIBLIOTECA CURRICULAR</span>
                    <h1 style="margin:0">Cursos de tu Canal</h1>
                    <p>Cursos asignados según tu segmento: <b>${this.getChannelLabel(this.user.channel_code)}</b>.</p>
                </div>
            </div>

            <div class="course-grid">
                ${courses.map(c => this.renderCourseCard(c)).join('')}
            </div>
        `;
    },

    async renderLeadership() {
        const res = await API.getCourses();
        const lCourses = res.courses.filter(c => c.pillar === 'L' || c.type === 'Liderazgo');

        const root = document.getElementById('page-root');
        root.innerHTML = `
            <div class="page-head">
                <div>
                    <span class="eyebrow">🤝 EL PILAR L · LIDERAZGO</span>
                    <h1 style="margin:0">Escuela de Liderazgo</h1>
                    <p>Desarrollo de líderes con evidencia, coaching y retroalimentación oportuna.</p>
                </div>
            </div>

            <div class="course-grid">
                ${lCourses.map(c => this.renderCourseCard(c)).join('')}
            </div>
        `;
    },

    async renderEvaluations() {
        const res = await API.getCourses();
        const courses = res.courses;

        const root = document.getElementById('page-root');
        root.innerHTML = `
            <div class="page-head">
                <div>
                    <span class="eyebrow">🧩 ZONA DE RETOS Y EXÁMENES</span>
                    <h1 style="margin:0">Evaluaciones de tu Canal</h1>
                    <p>Demuestra tu conocimiento y controles críticos para habilitación formativa.</p>
                </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:12px;">
                ${courses.map(c => `
                    <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:18px 24px;">
                        <div style="display:flex; align-items:center; gap:16px;">
                            <span style="font-size:32px;">${c.icon}</span>
                            <div>
                                <h3 style="margin:0;">${c.title}</h3>
                                <small style="color:var(--muted);">${c.type} · Umbral mínimo 80%</small>
                            </div>
                        </div>
                        <button class="btn btn-primary" onclick="CoursePlayer.startQuiz('${c.id}')">Resolver Reto →</button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    async renderBadges() {
        const res = await API.getCertificates();
        const certs = res.certificates || [];

        const root = document.getElementById('page-root');
        root.innerHTML = `
            <div class="page-head">
                <div>
                    <span class="eyebrow">🏆 RECONOCIMIENTOS Y CONSTANCIAS</span>
                    <h1 style="margin:0">Mis Certificados</h1>
                    <p>Constancias digitales oficiales expedidas con folio único de verificación.</p>
                </div>
            </div>

            ${certs.length ? `
                <div style="display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:16px;">
                    ${certs.map(cert => `
                        <div class="card" style="border:2px solid #fed8b1; background:#fffcf6; padding:24px;">
                            <span class="mini-badge gold">🎓 CERTIFICADO OFICIAL</span>
                            <h3 style="margin:12px 0 6px;">${cert.course_title}</h3>
                            <div style="font-size:12px; font-family:monospace; color:var(--orange-hot); font-weight:900; margin-bottom:12px;">
                                FOLIO: ${cert.certificate_code}
                            </div>
                            <div style="font-size:11px; color:var(--muted); margin-bottom:18px;">
                                Fecha de emisión: ${cert.issue_date.split(' ')[0]}
                            </div>
                            <button class="btn btn-primary btn-wide" onclick="CoursePlayer.showCertificate('${cert.certificate_code}')">
                                📜 Ver / Imprimir Diploma
                            </button>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div class="card" style="text-align:center; padding:40px;">
                    <div style="font-size:48px;">🎓</div>
                    <h2>Aún no has desbloqueado certificados</h2>
                    <p style="color:var(--muted); max-width:400px; margin:10px auto 20px;">
                        Completa una ruta de aprendizaje y supera su evaluación final con al menos 80% para recibir tu diploma con folio verificable.
                    </p>
                    <button class="btn btn-primary" onclick="SPA.navigate('onboarding')">Ir a mi Onboarding</button>
                </div>
            `}
        `;
    }
};

// Iniciar aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});
