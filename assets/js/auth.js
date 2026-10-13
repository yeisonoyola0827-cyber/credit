// Módulo de Autenticación y Cambio Obligatorio de Contraseña
const Auth = {
    currentUser: null,

    async init() {
        try {
            const data = await API.getMe();
            if (data.authenticated && data.user) {
                this.currentUser = data.user;
                if (data.user.must_change_password) {
                    this.showChangePasswordModal();
                } else {
                    SPA.init(this.currentUser);
                }
            } else {
                this.renderLogin();
            }
        } catch (e) {
            this.renderLogin();
        }
    },

    renderLogin() {
        const root = document.getElementById('app-root');
        root.innerHTML = `
            <div class="auth-wrapper">
                <div class="auth-card">
                    <div style="background:#fff; border-radius:18px; padding:10px 14px; margin-bottom:16px; text-align:center;">
                        <img src="${(window.APP_BASE_URL && window.APP_BASE_URL !== '.') ? (window.APP_BASE_URL + '/assets/logo.png') : './assets/logo.png'}" style="height:60px; width:auto; max-width:200px; display:block; margin:0 auto 6px;" alt="Aló Credit, logotipo oficial">
                        <div class="brand-bottom">ESCUELA <b>A.L.O.</b></div>
                    </div>
                    <div class="auth-tagline">Arcade de Aprendizaje · Aló Credit 2026</div>

                    <form id="login-form" class="auth-form">
                        <label>
                            <span>Correo Electrónico</span>
                            <input type="email" id="login-email" required placeholder="tu.correo@alocredit.com">
                        </label>
                        <label>
                            <span>Contraseña</span>
                            <input type="password" id="login-password" required placeholder="••••••••">
                        </label>
                        <button type="submit" class="btn btn-primary btn-auth-submit">
                            🚀 Iniciar Misión
                        </button>
                    </form>

                    <div class="demo-accounts">
                        <div class="demo-accounts-title">Acceso Rápido de Prueba (4 Vistas)</div>
                        <div class="demo-user-grid">
                            <button type="button" class="demo-user-btn admin" onclick="Auth.quickLogin('admin@alocredit.com')">
                                <span class="badge-avatar">⚙️</span>
                                <div class="demo-user-info">
                                    <b>Administrador</b>
                                    <small>Control Center</small>
                                </div>
                            </button>
                            <button type="button" class="demo-user-btn cp" onclick="Auth.quickLogin('maria@alocredit.com')">
                                <span class="badge-avatar">🏪</span>
                                <div class="demo-user-info">
                                    <b>Canal Comercial</b>
                                    <small>María Demo</small>
                                </div>
                            </button>
                            <button type="button" class="demo-user-btn cc" onclick="Auth.quickLogin('carlos@alocredit.com')">
                                <span class="badge-avatar">🎧</span>
                                <div class="demo-user-info">
                                    <b>Contact Center</b>
                                    <small>Carlos Ejemplo</small>
                                </div>
                            </button>
                            <button type="button" class="demo-user-btn adm" onclick="Auth.quickLogin('sofia@alocredit.com')">
                                <span class="badge-avatar">💻</span>
                                <div class="demo-user-info">
                                    <b>Administrativos</b>
                                    <small>1er Ingreso 🔒</small>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div id="modal-root"></div>
        `;

        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
    },

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            Sound.playClick();
            const res = await API.login(email, password);
            if (res.success && res.user) {
                this.currentUser = res.user;
                toast(res.message, 'success');
                if (res.must_change_password) {
                    this.showChangePasswordModal();
                } else {
                    SPA.init(this.currentUser);
                }
            }
        } catch (err) {
            Sound.playError();
            toast(err.message || 'Error de inicio de sesión', 'error');
        }
    },

    async quickLogin(email) {
        try {
            Sound.playCoin();
            const res = await API.quickLogin(email);
            if (res.success && res.user) {
                this.currentUser = res.user;
                toast(res.message, 'success');
                if (res.must_change_password) {
                    this.showChangePasswordModal();
                } else {
                    SPA.init(this.currentUser);
                }
            }
        } catch (err) {
            Sound.playError();
            toast(err.message || 'Error de acceso rápido', 'error');
        }
    },

    showChangePasswordModal() {
        const modalRoot = document.getElementById('modal-root') || document.body;
        modalRoot.innerHTML = `
            <div class="modal-overlay">
                <div class="must-change-modal">
                    <div class="must-change-icon">🔒</div>
                    <h2>Primer Ingreso Detectado</h2>
                    <p>Por seguridad de tu cuenta en Escuela A.L.O., debes actualizar tu contraseña temporal antes de comenzar.</p>

                    <form id="change-password-form" class="auth-form" onsubmit="Auth.handleChangePassword(event)">
                        <label>
                            <span>Nueva Contraseña (mínimo 6 caracteres)</span>
                            <input type="password" id="new-password" required minlength="6" placeholder="Ingresa tu nueva clave">
                        </label>
                        <label>
                            <span>Confirmar Nueva Contraseña</span>
                            <input type="password" id="confirm-password" required minlength="6" placeholder="Repite tu nueva clave">
                        </label>
                        <button type="submit" class="btn btn-primary btn-auth-submit">
                            ✓ Guardar y Acceder a mi Canal
                        </button>
                    </form>
                </div>
            </div>
        `;
    },

    async handleChangePassword(e) {
        e.preventDefault();
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword !== confirmPassword) {
            Sound.playError();
            toast('Las contraseñas no coinciden.', 'error');
            return;
        }

        try {
            Sound.playClick();
            const res = await API.changePassword(newPassword, confirmPassword);
            if (res.success) {
                Sound.playSuccess();
                toast(res.message, 'success');
                this.currentUser = res.user;
                document.getElementById('modal-root').innerHTML = '';
                SPA.init(this.currentUser);
            }
        } catch (err) {
            Sound.playError();
            toast(err.message || 'Error al actualizar contraseña', 'error');
        }
    },

    async logout() {
        try {
            Sound.playClick();
            await API.logout();
            this.currentUser = null;
            toast('Sesión cerrada correctamente.', 'success');
            this.renderLogin();
        } catch (err) {
            this.renderLogin();
        }
    }
};
