// ===== MIDDLEWARE DE AUTENTICACIÓN JWT =====
// Valida el token Bearer del header Authorization.
// Devuelve el payload decodificado o responde con 401.
// Uso: const user = authMiddleware(req, res); if (!user) return;

const jwt = require('jsonwebtoken');

/**
 * Valida el token JWT del header Authorization.
 * Si es válido, asigna req.user y devuelve el payload.
 * Si es inválido, responde con 401 y devuelve null.
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @returns {Object|null} - Payload decodificado o null
 */
function authMiddleware(req, res) {
    // [BYPASS LOCAL] Permitir acceso sin login si estamos en localhost (prioridad máxima)
    const host = req.hostname;
    const ip = req.ip || req.connection.remoteAddress;
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1' || ip === '::1' || ip === '127.0.0.1';
    
    if (isLocal) {
        // En local no necesitamos validar JWT
        return { id: 'local-user', role: 'admin' };
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Acceso no autorizado. Token no proporcionado.' });
        return null;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        return decoded;
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            res.status(401).json({ error: 'Tu sesión ha expirado. Inicia sesión de nuevo.' });
        } else {
            res.status(401).json({ error: 'Token inválido. Inicia sesión de nuevo.' });
        }
        return null;
    }
}

module.exports = authMiddleware;
