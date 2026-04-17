// ===== AUTH UTILITY — DULCE Y JALEO =====
// Módulo de autenticación para todas las páginas protegidas.
// Expone funciones en window.DulceAuth

(function() {
    'use strict';

    /**
     * Decodifica el payload de un JWT (sin verificar firma).
     * @param {string} token
     * @returns {object|null}
     */
    function decodeToken(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const decoded = atob(payload);
            return JSON.parse(decoded);
        } catch {
            return null;
        }
    }

    /**
     * Verifica si el token es válido y no ha expirado.
     * Redirige a /login.html si no lo es.
     */
    function checkAuth() {
        const token = localStorage.getItem('auth_token');

        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        const payload = decodeToken(token);
        if (!payload || !payload.exp) {
            localStorage.removeItem('auth_token');
            window.location.href = '/login.html';
            return;
        }

        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
            localStorage.removeItem('auth_token');
            window.location.href = '/login.html';
            return;
        }

        // Token válido
        return payload;
    }

    /**
     * Cierra sesión: elimina token y redirige al login.
     */
    function logout() {
        localStorage.removeItem('auth_token');
        window.location.href = '/login.html';
    }

    /**
     * Devuelve el header de autorización para fetch.
     * @returns {object} { 'Authorization': 'Bearer <token>' }
     */
    function getAuthHeader() {
        const token = localStorage.getItem('auth_token');
        if (!token) return {};
        return { 'Authorization': 'Bearer ' + token };
    }

    /**
     * Devuelve la información del usuario decodificada del JWT.
     * @returns {object|null}
     */
    function getUserInfo() {
        const token = localStorage.getItem('auth_token');
        if (!token) return null;
        return decodeToken(token);
    }

    /**
     * Verifica si el usuario actual tiene rol 'admin'.
     * @returns {boolean}
     */
    function isAdmin() {
        const info = getUserInfo();
        return info ? info.role === 'admin' : false;
    }

    // Exponer globalmente
    window.DulceAuth = {
        checkAuth: checkAuth,
        logout: logout,
        getAuthHeader: getAuthHeader,
        getUserInfo: getUserInfo,
        isAdmin: isAdmin
    };

})();
