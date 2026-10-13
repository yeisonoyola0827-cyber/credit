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
                <img src="${window.APP_BASE_URL || ''}/assets/logo.png" alt="Aló Credit, logotipo oficial">
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
            <div class="topbar-left">
                <button class="hamburger" onclick="SPA.toggleSidebar()" aria-label="Abrir menú">☰</button>
                <div>
                    <span class="topbar-greeting">¡Hola, ${u.name.split(' ')[0]}! 👋</span>
                    <span class="topbar-sub">${this.getChannelLabel(u.channel_code)}</span>
                </div>
            </div>
            <div class="topbar-spacer"></div>

            <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                ${isAdmin ? `
                    <button class="btn btn-small ${this.currentPage==='admin'?'btn-primary':'btn-outline'}" onclick="SPA.navigate('admin')">
                        👑 Control Center
                    </button>
                    <button class="btn btn-small ${this.currentPage==='home'?'btn-primary':'btn-soft'}" onclick="SPA.navigate('home')">
                        🎮 Vista Alumno
                    </button>
                ` : ''}

                <span class="top-pill ${isAdmin?'admin':''}">
                    ${isAdmin ? '⚙️ Administrador' : '🎮 Modo Alumno'}
                </span>

                <!-- Selector rápido de usuario para pruebas demo -->
                <div class="user-picker">
                    <div class="user-avatar">${u.name[0]}</div>
                    <select id="switch-user-quick" onchange="Auth.quickLogin(this.value)" style="border:1px solid var(--line); background:#f7f8fd; border-radius:10px; padding:6px 10px; font-weight:750; font-size:11px; color:var(--ink); cursor:pointer;" title="Cambiar usuario de prueba">
                        <option value="admin@alocredit.com" ${u.email==='admin@alocredit.com'?'selected':''}>👑 Admin Central</option>
                        <option value="maria@alocredit.com" ${u.email==='maria@alocredit.com'?'selected':''}>🏪 María (Comercial)</option>
                        <option value="carlos@alocredit.com" ${u.email==='carlos@alocredit.com'?'selected':''}>🎧 Carlos (Contact)</option>
                        <option value="sofia@alocredit.com" ${u.email==='sofia@alocredit.com'?'selected':''}>💻 Sofía (Admin)</option>
                    </select>
                </div>

                <button class="btn-logout" onclick="Auth.logout()" title="Cerrar Sesión">
                    ⎋ Salir
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
                    <span class="eyebrow">✨ TU UNIVERSO DE APRENDIZAJE</span>
                    <h1 style="margin:0">Bienvenido a Escuela A.L.O.</h1>
                    <p>Aprendizaje · Liderazgo · Obsesión por el cliente · Canal: <b>${this.getChannelLabel(this.user.channel_code)}</b></p>
                </div>
            </div>

            <div class="hero">
                <div class="hero-content">
                    <span class="hero-top">⭐ A.L.O. ARCADE · EDUTAINMENT</span>
                    <h1>¡Sigue subiendo <em>de nivel!</em></h1>
                    <p>Aprende jugando con casos reales, responde microretos éticos y transforma tu talento en impacto para los clientes.</p>
                    <div class="hero-actions">
                        ${onbCourse ? `<button class="btn btn-primary" onclick="CoursePlayer.startCourse('${onbCourse.id}')">🚀 Continuar mi aventura</button>` : ''}
                        <button class="btn btn-ghost-light" onclick="SPA.navigate('catalog')">📚 Explorar cursos</button>
                    </div>
                </div>
                <img class="hero-avatar" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyODAiIGhlaWdodD0iMzIwIiB2aWV3Qm94PSIwIDAgMTYwIDE4MCIgc2hhcGUtcmVuZGVyaW5nPSJjcmlzcEVkZ2VzIj4KPGRlZnM+PGZpbHRlciBpZD0ic2hhZG93IiB4PSItMzAlIiB5PSItMzAlIiB3aWR0aD0iMTYwJSIgaGVpZ2h0PSIxNjAlIj48ZmVEcm9wU2hhZG93IGR4PSI0IiBkeT0iNyIgc3RkRGV2aWF0aW9uPSIyLjUiIGZsb29kLWNvbG9yPSIjM2U0YTYwIiBmbG9vZC1vcGFjaXR5PSIuMjUiLz48L2ZpbHRlcj48L2RlZnM+CjxnIGZpbHRlcj0idXJsKCNzaGFkb3cpIj4KPCEtLSBiYWNrcGFjayAtLT4gPHJlY3QgeD0iMjgiIHk9Ijg5IiB3aWR0aD0iMjUiIGhlaWdodD0iNDIiIGZpbGw9IiM1MTY5YjciLz48cmVjdCB4PSIyMiIgeT0iOTciIHdpZHRoPSIxMiIgaGVpZ2h0PSIzMiIgZmlsbD0iIzMwNDg4NCIvPgo8IS0tIHNob2VzIC0tPiA8cmVjdCB4PSI0OCIgeT0iMTUwIiB3aWR0aD0iMzEiIGhlaWdodD0iMTYiIGZpbGw9IiMzZTRhNjAiLz48cmVjdCB4PSI5MSIgeT0iMTUwIiB3aWR0aD0iMzEiIGhlaWdodD0iMTYiIGZpbGw9IiMzZTRhNjAiLz48cmVjdCB4PSI0MyIgeT0iMTYyIiB3aWR0aD0iMzkiIGhlaWdodD0iOSIgZmlsbD0iIzMwNDg4NCIvPjxyZWN0IHg9IjkxIiB5PSIxNjIiIHdpZHRoPSIzNiIgaGVpZ2h0PSI5IiBmaWxsPSIjMzA0ODg0Ii8+CjwhLS0gbGVncyAtLT4gPHJlY3QgeD0iNTEiIHk9IjEzMyIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI3IiBmaWxsPSIjM2U0YTYwIi8+PHJlY3QgeD0iODgiIHk9IjEzMyIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI3IiBmaWxsPSIjM2U0YTYwIi8+CjwhLS0gdG9yc28gLS0+IDxyZWN0IHg9IjQzIiB5PSI5MCIgd2lkdGg9Ijc0IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjZmE4NTE0Ii8+PHJlY3QgeD0iNTUiIHk9Ijk3IiB3aWR0aD0iNTAiIGhlaWdodD0iMzMiIGZpbGw9IiNmZmYiLz48dGV4dCB4PSI2OCIgeT0iMTIxIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjIiIGZvbnQtd2VpZ2h0PSI5MDAiIGZpbGw9IiNmMTU4MjQiPkE8L3RleHQ+CjwhLS0gYXJtcyAtLT4gPHJlY3QgeD0iMjQiIHk9IjkxIiB3aWR0aD0iMjAiIGhlaWdodD0iMTgiIGZpbGw9IiNmYTg1MTQiLz48cmVjdCB4PSIxNyIgeT0iMTA0IiB3aWR0aD0iMjIiIGhlaWdodD0iMjEiIGZpbGw9IiNmNGFlNzYiLz48cmVjdCB4PSIxMTciIHk9IjkyIiB3aWR0aD0iMjEiIGhlaWdodD0iMjAiIGZpbGw9IiNmYTg1MTQiLz48cmVjdCB4PSIxMjMiIHk9IjgyIiB3aWR0aD0iMjEiIGhlaWdodD0iMjgiIGZpbGw9IiNmNGFlNzYiLz48cmVjdCB4PSIxMzMiIHk9IjY4IiB3aWR0aD0iMTQiIGhlaWdodD0iMjAiIGZpbGw9IiNmNGFlNzYiLz4KPCEtLSBuZWNrIC0tPiA8cmVjdCB4PSI2OCIgeT0iNzYiIHdpZHRoPSIyNyIgaGVpZ2h0PSIxOSIgZmlsbD0iI2Y0YWU3NiIvPgo8IS0tIGhhaXIgLS0+IDxyZWN0IHg9IjUzIiB5PSIyNCIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU1IiBmaWxsPSIjNDgzNTJlIi8+PHJlY3QgeD0iNDUiIHk9IjM5IiB3aWR0aD0iMTQiIGhlaWdodD0iNDAiIGZpbGw9IiM0ODM1MmUiLz48cmVjdCB4PSIxMDYiIHk9IjM5IiB3aWR0aD0iMTUiIGhlaWdodD0iNDAiIGZpbGw9IiM0ODM1MmUiLz4KPCEtLSBmYWNlIC0tPiA8cmVjdCB4PSI1NiIgeT0iMzkiIHdpZHRoPSI1MiIgaGVpZ2h0PSI0NCIgZmlsbD0iI2Y1YmQ4OCIvPjxyZWN0IHg9IjUxIiB5PSI0OSIgd2lkdGg9IjEwIiBoZWlnaHQ9IjI4IiBmaWxsPSIjZjViZDg4Ii8+PHJlY3QgeD0iMTA0IiB5PSI1MiIgd2lkdGg9IjEwIiBoZWlnaHQ9IjI1IiBmaWxsPSIjZjViZDg4Ii8+CjxyZWN0IHg9IjY4IiB5PSI1OCIgd2lkdGg9IjciIGhlaWdodD0iOCIgZmlsbD0iIzNlNGE2MCIvPjxyZWN0IHg9IjkxIiB5PSI1OCIgd2lkdGg9IjciIGhlaWdodD0iOCIgZmlsbD0iIzNlNGE2MCIvPjxyZWN0IHg9Ijc5IiB5PSI3MyIgd2lkdGg9IjE1IiBoZWlnaHQ9IjQiIGZpbGw9IiNjOTZjNGEiLz4KPCEtLSBmcmluZ2UgLS0+IDxyZWN0IHg9IjU2IiB5PSIzMSIgd2lkdGg9IjU1IiBoZWlnaHQ9IjE1IiBmaWxsPSIjNDgzNTJlIi8+PHJlY3QgeD0iNTciIHk9IjQwIiB3aWR0aD0iMzEiIGhlaWdodD0iOCIgZmlsbD0iIzQ4MzUyZSIvPgo8IS0tIGhlYWRwaG9uZSBhcmMgLS0+IDxwYXRoIGQ9Ik01MCA0NHYtNXEwLTI4IDMyLTI4dDMyIDI4djUiIHN0cm9rZT0iIzUxNjliNyIgc3Ryb2tlLXdpZHRoPSI5IiBmaWxsPSJub25lIi8+PHJlY3QgeD0iNDMiIHk9IjQyIiB3aWR0aD0iMTAiIGhlaWdodD0iMjgiIHJ4PSIyIiBmaWxsPSIjNTE2OWI3Ii8+PHJlY3QgeD0iMTEyIiB5PSI0MiIgd2lkdGg9IjEwIiBoZWlnaHQ9IjI4IiByeD0iMiIgZmlsbD0iIzUxNjliNyIvPgo8L2c+CjxnIGZpbGw9IiNmZmQyNGMiPjxwYXRoIGQ9Ik0xNyAzNGw0IDkgMTAgMi04IDYgMyAxMC05LTUtOCA1IDItMTAtOC02IDExLTJ6Ii8+PHJlY3QgeD0iMTM2IiB5PSIxOSIgd2lkdGg9IjgiIGhlaWdodD0iOCIvPjxyZWN0IHg9IjEyNyIgeT0iMjgiIHdpZHRoPSI5IiBoZWlnaHQ9IjkiLz48cmVjdCB4PSIxNDQiIHk9IjI4IiB3aWR0aD0iOSIgaGVpZ2h0PSI5Ii8+PHJlY3QgeD0iMTM2IiB5PSIzNiIgd2lkdGg9IjgiIGhlaWdodD0iOCIvPjwvZz4KPC9zdmc+Cg==" alt="Exploradora A.L.O. de estilo pixel art">
                <span class="hero-coin">◉</span>
                <span class="hero-coin two">✦</span>
                <span class="hero-star">🌟</span>
            </div>

            <div class="section-head">
                <div>
                    <h2>Tu Tablero de Jugador</h2>
                    <p>Métricas de aprendizaje y avance correspondientes a tu perfil</p>
                </div>
            </div>

            <div class="kpi-grid">
                <div class="card kpi-card">
                    <span class="kpi-icon blue">⏱️</span>
                    <div>
                        <span class="kpi-label">Tiempo Activo</span>
                        <strong class="kpi-value">${Math.round(this.user.active_seconds/60)} min</strong>
                        <span class="kpi-sub">Tiempo estimado</span>
                    </div>
                </div>
                <div class="card kpi-card">
                    <span class="kpi-icon gold">🎯</span>
                    <div>
                        <span class="kpi-label">Nota Promedio</span>
                        <strong class="kpi-value">${onbProg > 0 ? onbProg + '%' : '—'}</strong>
                        <span class="kpi-sub">Evaluaciones registradas</span>
                    </div>
                </div>
                <div class="card kpi-card">
                    <span class="kpi-icon green">📚</span>
                    <div>
                        <span class="kpi-label">Rutas Activas</span>
                        <strong class="kpi-value">${this.courses.length}</strong>
                        <span class="kpi-sub">Cursos asignados</span>
                    </div>
                </div>
                <div class="card kpi-card">
                    <span class="kpi-icon gold">⭐</span>
                    <div>
                        <span class="kpi-label">Experiencia</span>
                        <strong class="kpi-value">${this.user.xp} XP</strong>
                        <span class="kpi-sub">Logros acumulados</span>
                    </div>
                </div>
            </div>

            <div class="home-body" style="margin-top:18px">
                <div>
                    <article class="card mission-card">
                        <div class="card-header">
                            <h3>🗺️ Mi ruta actual</h3>
                            <span class="mini-badge orange">ONBOARDING</span>
                        </div>
                        <div class="mission-heading">
                            <div class="mission-badge">🏪</div>
                            <div>
                                <h3>${onbCourse ? onbCourse.title : 'Onboarding'}</h3>
                                <p>${onbProg}% completado</p>
                            </div>
                        </div>
                        <div class="progress-track"><div class="progress-fill green" style="width:${onbProg}%;"></div></div>
                        <div class="progress-row"><span>Avance de tu onboarding</span><b>${onbProg}%</b></div>
                        <div class="mini-path">
                            <div class="path-step"><div class="step-cube ${onbProg>=20?'done':'now'}">${onbProg>=20?'✓':'1'}</div><small>Alistamiento</small></div>
                            <div class="path-step"><div class="step-cube ${onbProg>=40?'done':onbProg>=20?'now':''}">${onbProg>=40?'✓':'2'}</div><small>Identidad</small></div>
                            <div class="path-step"><div class="step-cube ${onbProg>=60?'done':onbProg>=40?'now':''}">${onbProg>=60?'✓':'3'}</div><small>Práctica</small></div>
                            <div class="path-step"><div class="step-cube ${onbProg>=80?'done':onbProg>=60?'now':''}">${onbProg>=80?'✓':'4'}</div><small>Canguro</small></div>
                            <div class="path-step"><div class="step-cube ${onbProg===100?'done':onbProg>=80?'now':''}">${onbProg===100?'✓':'5'}</div><small>Clínicas</small></div>
                        </div>
                        ${onbCourse ? `<button class="btn btn-primary btn-wide" onclick="CoursePlayer.startCourse('${onbCourse.id}')">Continuar ruta →</button>` : ''}
                    </article>

                    <div class="section-head" style="margin-top:22px;">
                        <div>
                            <h2>Los tres pilares A.L.O.</h2>
                            <p>Una escuela, tres fuerzas que mueven el desarrollo</p>
                        </div>
                    </div>
                    <div class="pillar-grid">
                        <div class="pillar-card">
                            <span class="pillar-symbol">🧠</span><b>Aprendizaje</b><small>Dominar el rol, practicar y corregir con evidencia.</small>
                        </div>
                        <div class="pillar-card l">
                            <span class="pillar-symbol">🤝</span><b>Liderazgo</b><small>Convertir el aprendizaje en coaching y desarrollo.</small>
                        </div>
                        <div class="pillar-card o">
                            <span class="pillar-symbol">⭐</span><b>Obsesión por el cliente</b><small>Escuchar, explicar con transparencia y generar valor.</small>
                        </div>
                    </div>
                </div>

                <div>
                    <article class="card">
                        <div class="card-header"><h3>🎮 Segmentación por Canales</h3></div>
                        <p class="subtle" style="font-size:11px;margin-bottom:15px">Canal asignado a tu perfil de colaborador:</p>
                        <div class="role-grid">
                            <button class="role-tile ${this.user.channel_code==='cp'?'selected':''}">
                                <span class="role-icon">🏪</span><b>Comercial</b>
                            </button>
                            <button class="role-tile ${this.user.channel_code==='cc'?'selected':''}">
                                <span class="role-icon">🎧</span><b>Contact Center</b>
                            </button>
                            <button class="role-tile ${this.user.channel_code==='adm'?'selected':''}">
                                <span class="role-icon">💻</span><b>Administrativos</b>
                            </button>
                        </div>
                    </article>

                    <article class="card" style="margin-top:16px">
                        <div class="card-header"><h3>🏆 Tu recompensa</h3></div>
                        <div class="xp-card">
                            <span>🌟</span>
                            <div><b>${this.user.xp} XP acumulados</b><small>Nivel ${Math.floor(this.user.xp/500)+1} · Tu talento transforma</small></div>
                        </div>
                        <div class="progress-track"><div class="progress-fill" style="width:${(this.user.xp % 500) / 5}%;"></div></div>
                        <div class="progress-row"><small>Siguiente nivel</small><b>${500 - (this.user.xp % 500)} XP restantes</b></div>
                        <button class="btn btn-soft btn-wide" style="margin-top:17px" onclick="SPA.navigate('badges')">Ver mis logros y diplomas →</button>
                    </article>
                </div>
            </div>

            <div class="section-head" style="margin-top:28px;">
                <div>
                    <h2>Formación continua para tu rol</h2>
                    <p>Microretos, casos y aprendizaje aplicable según tu canal</p>
                </div>
                <button class="btn btn-ghost" onclick="SPA.navigate('catalog')">Ver catálogo completo →</button>
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

// Iniciar aplicación al cargar el DOM o de inmediato si ya está listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { Auth.init(); });
} else {
    Auth.init();
}
