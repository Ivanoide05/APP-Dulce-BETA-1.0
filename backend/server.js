// ===== DULCE Y JALEO — BACKEND SEGURO =====
// Este servidor actúa como intermediario (proxy) entre el frontend y Airtable / Gemini.
// Todas las API keys están en .env y NUNCA se exponen al navegador.
// Incluye autenticación JWT, gestión de usuarios via Supabase, y rate limiting.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Orígenes permitidos (whitelist CORS) ---
const ALLOWED_ORIGINS = [
    'http://localhost:3002',
    'http://localhost:3001',
    'http://localhost:3000',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3000',
    // Vercel preview y producción
    /^https:\/\/.*\.vercel\.app$/,
    // Dominio propio (si se configura)
    process.env.APP_DOMAIN || null
].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        // Permitir peticiones sin origen (Postman, curl, server-to-server)
        if (!origin) return callback(null, true);
        const allowed = ALLOWED_ORIGINS.some(o =>
            typeof o === 'string' ? o === origin : o.test(origin)
        );
        if (allowed) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Bloqueado origen: ${origin}`);
            callback(new Error(`Origen no permitido por política CORS: ${origin}`));
        }
    },
    credentials: true
};

// --- Rate limiter para el endpoint de escaneo (caro en compute + API) ---
const scannerLimiter = rateLimit({
    windowMs: 60 * 1000,       // ventana de 1 minuto
    max: 20,                    // máximo 20 peticiones por IP/minuto
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Demasiadas peticiones al escáner. Por favor espera un momento.'
    }
});

// --- Rate limiter general (protección básica contra DoS) ---
const generalLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,  // ventana de 10 minutos
    max: 500,                   // máximo 500 peticiones globales por IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas peticiones. Inténtalo más tarde.' }
});

// --- Middleware ---
app.use(cors(corsOptions));
app.use(generalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Servir el frontend estático con headers para HTML sin caché ---
// Esto garantiza que siempre se sirva la versión más reciente del index.html
app.get(['/', '/index.html'], (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});
app.get('/sw.js', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, '..', 'sw.js'));
});
app.use(express.static(path.join(__dirname, '..')));

// --- Rutas de Autenticación ---
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// --- Rutas de Administración ---
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// --- Rutas API (proxy seguro a Airtable) ---
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// --- Rutas de Export trimestral ---
const exportRoutes = require('./routes/export');
app.use('/export', exportRoutes);

// --- Rutas Webhooks con rate limiting específico en el escáner ---
const webhookRoutes = require('./routes/webhooks');
app.use('/webhook/scan-invoice', scannerLimiter);
app.use('/webhook/lovable-webhook', scannerLimiter);
app.use('/webhook', webhookRoutes);

// --- Health check ---
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'dulce-jaleo-backend',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development'
    });
});

// --- Arrancar (solo en local, no en Vercel) ---
if (require.main === module) {
    app.listen(PORT, () => {
        console.log('');
        console.log('  🍞 Dulce y Jaleo Backend');
        console.log(`  ✅ Servidor corriendo en: http://localhost:${PORT}`);
        console.log(`  🔐 Auth:     http://localhost:${PORT}/api/auth`);
        console.log(`  👤 Admin:    http://localhost:${PORT}/api/admin`);
        console.log(`  📡 API:      http://localhost:${PORT}/api`);
        console.log(`  🔗 Webhooks: http://localhost:${PORT}/webhook`);
        console.log(`  💻 Frontend: http://localhost:${PORT}/index.html`);
        console.log('');
    });
}

// Exportar para Vercel
module.exports = app;
