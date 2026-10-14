// Módulo de Autenticación y Cambio Obligatorio de Contraseña
const Auth = {
    currentUser: null,

    async init() {
        try {
            const data = await API.getMe();
            if (data.authenticated && data.user) {
                this.currentUser = data.user;
                const mustChange = Number(data.user.must_change_password) === 1 || data.user.must_change_password === true;
                if (mustChange) {
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

                    <div id="login-alert" class="auth-alert error" style="display:none;"></div>

                    <form id="login-form" class="auth-form">
                        <label>
                            <span>Correo Electrónico</span>
                            <input type="email" id="login-email" required placeholder="tu.correo@alocredit.com" autocomplete="username">
                        </label>
                        <label>
                            <span>Contraseña</span>
                            <div class="password-input-wrap">
                                <input type="password" id="login-password" required placeholder="••••••••" autocomplete="current-password">
                                <button type="button" class="btn-toggle-pwd" onclick="Auth.togglePasswordVisibility('login-password', this)" title="Ver u ocultar contraseña">👁️</button>
                            </div>
                        </label>
                        <button type="submit" id="btn-login-submit" class="btn btn-primary btn-auth-submit">
                            🚀 Iniciar Misión
                        </button>
                    </form>
                </div>
            </div>
            <div id="modal-root"></div>
            <div id="toast-root" aria-live="polite" aria-atomic="true"></div>
        `;

        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
    },

    async handleLogin(e) {
        e.preventDefault();
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        const alertBox = document.getElementById('login-alert');
        const submitBtn = document.getElementById('btn-login-submit');

        if (alertBox) {
            alertBox.style.display = 'none';
            alertBox.textContent = '';
        }

        const email = emailInput ? emailInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';

        if (!email || !password) {
            const msg = 'Por favor ingresa tu correo y contraseña.';
            if (alertBox) {
                alertBox.textContent = msg;
                alertBox.style.display = 'flex';
            }
            toast(msg, 'error');
            return;
        }

        try {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = '🚀 Verificando credenciales...';
            }
            Sound.playClick();
            const res = await API.login(email, password);
            if (res.success && res.user) {
                this.currentUser = res.user;
                if (typeof StaticStore !== 'undefined') {
                    StaticStore.setCurrentUser(res.user);
                }
                toast(res.message, 'success');
                const mustChange = Number(res.must_change_password) === 1 || res.must_change_password === true || Number(res.user.must_change_password) === 1;
                if (mustChange) {
                    this.showChangePasswordModal();
                } else {
                    SPA.init(this.currentUser);
                }
            }
        } catch (err) {
            Sound.playError();
            const msg = err.message || 'Error de inicio de sesión';
            if (alertBox) {
                alertBox.textContent = msg;
                alertBox.style.display = 'flex';
            }
            if (passwordInput) {
                passwordInput.focus();
                passwordInput.select();
            }
            toast(msg, 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '🚀 Iniciar Misión';
            }
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

                    <div id="change-pwd-alert" class="auth-alert error" style="display:none;"></div>

                    <form id="change-password-form" class="auth-form" onsubmit="Auth.handleChangePassword(event)">
                        <label>
                            <span>Nueva Contraseña (mínimo 6 caracteres)</span>
                            <div class="password-input-wrap">
                                <input type="password" id="new-password" required minlength="6" placeholder="Ingresa tu nueva clave" autocomplete="new-password" oninput="Auth.checkPasswordMatch()">
                                <button type="button" class="btn-toggle-pwd" onclick="Auth.togglePasswordVisibility('new-password', this)" title="Ver u ocultar contraseña">👁️</button>
                            </div>
                        </label>
                        <label>
                            <span>Confirmar Nueva Contraseña</span>
                            <div class="password-input-wrap">
                                <input type="password" id="confirm-password" required minlength="6" placeholder="Repite tu nueva clave" autocomplete="new-password" oninput="Auth.checkPasswordMatch()">
                                <button type="button" class="btn-toggle-pwd" onclick="Auth.togglePasswordVisibility('confirm-password', this)" title="Ver u ocultar contraseña">👁️</button>
                            </div>
                            <div id="password-match-hint" class="password-match-hint" style="display:none;"></div>
                        </label>
                        <button type="submit" id="btn-change-pwd-submit" class="btn btn-primary btn-auth-submit">
                            ✓ Guardar y Acceder a mi Canal
                        </button>
                    </form>
                </div>
            </div>
        `;
    },

    checkPasswordMatch() {
        const newPwd = document.getElementById('new-password')?.value || '';
        const confirmPwd = document.getElementById('confirm-password')?.value || '';
        const hint = document.getElementById('password-match-hint');
        if (!hint) return;

        if (!confirmPwd) {
            hint.style.display = 'none';
            return;
        }

        hint.style.display = 'flex';
        if (newPwd === confirmPwd) {
            hint.className = 'password-match-hint success';
            hint.textContent = '✓ Las contraseñas coinciden';
        } else {
            hint.className = 'password-match-hint error';
            hint.textContent = '⚠️ Las contraseñas no coinciden';
        }
    },

    togglePasswordVisibility(inputId, btn) {
        const input = document.getElementById(inputId);
        if (!input) return;
        if (input.type === 'password') {
            input.type = 'text';
            btn.textContent = '🙈';
        } else {
            input.type = 'password';
            btn.textContent = '👁️';
        }
    },

    async handleChangePassword(e) {
        e.preventDefault();
        const alertBox = document.getElementById('change-pwd-alert');
        const submitBtn = document.getElementById('btn-change-pwd-submit');
        const newPwdInput = document.getElementById('new-password');
        const confirmPwdInput = document.getElementById('confirm-password');

        if (alertBox) {
            alertBox.style.display = 'none';
            alertBox.textContent = '';
        }

        const newPassword = newPwdInput ? newPwdInput.value : '';
        const confirmPassword = confirmPwdInput ? confirmPwdInput.value : '';

        const showError = (msg) => {
            Sound.playError();
            if (alertBox) {
                alertBox.textContent = msg;
                alertBox.style.display = 'flex';
            }
            toast(msg, 'error');
        };

        if (!newPassword || !confirmPassword) {
            showError('Por favor completa todos los campos requeridos.');
            return;
        }

        if (newPassword.length < 6) {
            showError('La contraseña debe tener al menos 6 caracteres.');
            newPwdInput?.focus();
            return;
        }

        if (newPassword !== confirmPassword) {
            showError('Las contraseñas no coinciden. Por favor verifica que ambas sean idénticas.');
            confirmPwdInput?.focus();
            return;
        }

        if (newPassword.toLowerCase() === 'alo2026') {
            showError('La nueva contraseña no puede ser igual a la contraseña temporal genérica (alo2026).');
            newPwdInput?.focus();
            return;
        }

        try {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = '⏳ Guardando nueva contraseña...';
            }
            Sound.playClick();
            const res = await API.changePassword(newPassword, confirmPassword);
            if (res && res.success) {
                Sound.playSuccess();
                toast(res.message || 'Contraseña actualizada exitosamente.', 'success');
                const updatedUser = res.user || { ...(this.currentUser || {}), must_change_password: 0 };
                updatedUser.must_change_password = 0;
                this.currentUser = updatedUser;
                if (typeof StaticStore !== 'undefined') {
                    StaticStore.setCurrentUser(this.currentUser);
                }
                const modalRoot = document.getElementById('modal-root');
                if (modalRoot) modalRoot.innerHTML = '';
                SPA.init(this.currentUser);
            } else {
                throw new Error(res?.message || 'Error al actualizar contraseña.');
            }
        } catch (err) {
            showError(err.message || 'Error al actualizar contraseña');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '✓ Guardar y Acceder a mi Canal';
            }
        }
    },

    async logout() {
        try {
            Sound.playClick();
            await API.logout();
            this.currentUser = null;
            if (typeof StaticStore !== 'undefined') {
                StaticStore.logout();
            }
            toast('Sesión cerrada correctamente.', 'success');
            this.renderLogin();
        } catch (err) {
            this.currentUser = null;
            this.renderLogin();
        }
    }
};
