// Cliente API Centralizado
const API = {
    async request(url, options = {}) {
        const baseUrl = window.APP_BASE_URL || '';
        const endpoint = (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//'))
            ? url
            : (baseUrl + url);

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
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || data.error || 'Error en la solicitud');
            }
            return data;
        } catch (err) {
            console.error('API Error:', err);
            throw err;
        }
    },

    // Auth
    getMe() { return this.request('/api/me'); },
    login(email, password) { return this.request('/api/login', { method: 'POST', body: { email, password } }); },
    quickLogin(email) { return this.request('/api/quick-login', { method: 'POST', body: { email } }); },
    changePassword(new_password, confirm_password) { return this.request('/api/change-password', { method: 'POST', body: { new_password, confirm_password } }); },
    logout() { return this.request('/api/logout', { method: 'POST' }); },

    // Cursos
    getCourses() { return this.request('/api/courses'); },
    getCourse(id) { return this.request(`/api/courses/${id}`); },
    completeModule(moduleId, reflection) { return this.request('/api/courses/complete-module', { method: 'POST', body: { module_id: moduleId, reflection } }); },
    submitQuiz(courseId, answers) { return this.request('/api/courses/quiz', { method: 'POST', body: { course_id: courseId, answers } }); },

    // Certificados
    getCertificates() { return this.request('/api/certificates'); },
    generateCertificate(courseId) { return this.request(`/api/certificates/generate/${courseId}`, { method: 'POST' }); },
    verifyCertificate(code) { return this.request(`/api/certificates/verify/${code}`); },

    // Admin
    getAdminStats() { return this.request('/api/admin/stats'); },
    getAdminUsers() { return this.request('/api/admin/users'); },
    createAdminUser(data) { return this.request('/api/admin/users', { method: 'POST', body: data }); },
    updateAdminUser(id, data) { return this.request(`/api/admin/users/${id}`, { method: 'POST', body: data }); },
    toggleUserStatus(id) { return this.request(`/api/admin/users/${id}/toggle`, { method: 'POST' }); },
    deleteAdminUser(id) { return this.request(`/api/admin/users/${id}`, { method: 'DELETE' }); },
    saveCourse(data) { return this.request('/api/admin/courses', { method: 'POST', body: data }); },
    toggleCourse(id) { return this.request(`/api/admin/courses/${id}/toggle`, { method: 'POST' }); },
    deleteCourse(id) { return this.request(`/api/admin/courses/${id}`, { method: 'DELETE' }); },
    getAssignments() { return this.request('/api/admin/assignments'); },
    toggleAssignment(course_id, channel_code) { return this.request('/api/admin/assignments/toggle', { method: 'POST', body: { course_id, channel_code } }); }
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
