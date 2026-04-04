// ===== DULCE Y JALEO — BACKEND SEGURO =====
// Este servidor actúa como intermediario (proxy) entre el frontend y Airtable / Gemini.
// Todas las API keys están en .env y NUNCA se exponen al navegador.
// Incluye autenticación JWT y gestión de usuarios via Supabase.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors());                         // Permitir peticiones desde el frontend
app.use(express.json({ limit: '10mb' })); // Para body JSON (escaneos, etc.)
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Servir el frontend estático desde la carpeta padre ---
// Esto permite acceder a index.html, css, js, iconos, etc. desde http://localhost:3001/
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

// --- Rutas Webhooks (reemplazo de n8n) ---
const webhookRoutes = require('./routes/webhooks');
app.use('/webhook', webhookRoutes);

// --- Health check ---
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'dulce-jaleo-backend',
        timestamp: new Date().toISOString()
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
