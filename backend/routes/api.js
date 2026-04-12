// ===== PROXY SEGURO A AIRTABLE =====
// El frontend llama a /api/records, /api/records/:table, etc.
// Este módulo inyecta el Bearer token desde .env y reenvía la petición a Airtable.
// Todas las rutas requieren autenticación JWT.
// El airtable_base_id se extrae del JWT del usuario autenticado.

const express = require('express');
const router = express.Router();
const authMiddleware = require('../lib/authMiddleware');

const AIRTABLE_API = 'https://api.airtable.com/v0';
const FALLBACK_BASE_ID = (process.env.AIRTABLE_BASE_ID || process.env.AIRTABLE_BASE_LEGACY || '').trim();
const TOKEN = (process.env.AIRTABLE_API_KEY || '').trim();

const TABLES = {
    FACTURAS: process.env.TABLE_FACTURAS || 'tblLC7oMOUQtRWkn7',
    ALBARANES: process.env.TABLE_ALBARANES || 'tblX9EQUmwItNJCZI',
    GASTOS_VARIOS: process.env.TABLE_GASTOS_VARIOS || 'tblHzVIPEde7zWnUv'
};

// Helper: fetch nativo de Node 18+
// Acepta baseId como parámetro para soporte multi-tenant
async function airtableFetch(req, tableId, options = {}, baseId = null) {
    // Prefer baseId from headers, then from param, then fallback
    const headerBaseId = req.headers['x-airtable-base-id'];
    const headerToken = req.headers['x-airtable-token'];
    
    const effectiveBaseId = (headerBaseId || baseId || FALLBACK_BASE_ID || '').trim();
    const effectiveToken = (headerToken || TOKEN || '').trim();

    if (!effectiveBaseId || !effectiveToken) {
        throw new Error('Configuración de Airtable incompleta (Token o Base ID faltante)');
    }

    const url = `${AIRTABLE_API}/${effectiveBaseId}/${tableId}`;
    const res = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${effectiveToken}`,
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const errorMsg = data.error?.message || 'Airtable error';
        console.error(`[AIRTABLE_PROXY] Error ${res.status} in ${effectiveBaseId}/${tableId}:`, errorMsg);
        
        const err = new Error(errorMsg);
        err.status = res.status;
        err.details = data.error; 
        throw err;
    }
    return data;
}

// ─────────────────────────────────────────────
// GET /api/records — Devuelve TODOS los registros de las 3 tablas
// Esto es lo que usa el Dashboard, Facturas, Márgenes
// ─────────────────────────────────────────────
router.get('/records', async (req, res) => {
    const user = authMiddleware(req, res);
    if (!user) return;

    try {
        // Usar airtable_base_id del JWT, con fallback al .env
        const baseId = user.airtable_base_id || FALLBACK_BASE_ID;

        const [facturas, albaranes, gastos] = await Promise.all([
            airtableFetch(req, TABLES.FACTURAS, {}, baseId),
            airtableFetch(req, TABLES.ALBARANES, {}, baseId),
            airtableFetch(req, TABLES.GASTOS_VARIOS, {}, baseId)
        ]);

        res.json({
            facturas: facturas.records || [],
            albaranes: albaranes.records || [],
            gastos: gastos.records || []
        });
    } catch (err) {
        console.error('[API] Error fetching records:', err.message);
        res.status(err.status || 500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────
// GET /api/records/:table — Registros de una tabla específica
// :table = FACTURAS | ALBARANES | GASTOS_VARIOS
// ─────────────────────────────────────────────
router.get('/records/:table', async (req, res) => {
    const user = authMiddleware(req, res);
    if (!user) return;

    const tableKey = req.params.table.toUpperCase();
    const tableId = TABLES[tableKey];

    if (!tableId) {
        return res.status(400).json({ error: `Tabla desconocida: ${req.params.table}. Usa: FACTURAS, ALBARANES, GASTOS_VARIOS` });
    }

    try {
        const baseId = user.airtable_base_id || FALLBACK_BASE_ID;
        const data = await airtableFetch(req, tableId, {}, baseId);
        res.json(data);
    } catch (err) {
        console.error(`[API] Error fetching ${tableKey}:`, err.message);
        res.status(err.status || 500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────
// POST /api/records/:table — Crear un registro en una tabla
// Body: { fields: { ... } }
// ─────────────────────────────────────────────
router.post('/records/:table', async (req, res) => {
    const user = authMiddleware(req, res);
    if (!user) return;

    const tableKey = req.params.table.toUpperCase();
    const tableId = TABLES[tableKey];

    if (!tableId) {
        return res.status(400).json({ error: `Tabla desconocida: ${req.params.table}` });
    }

    try {
        const baseId = user.airtable_base_id || FALLBACK_BASE_ID;
        const data = await airtableFetch(req, tableId, {
            method: 'POST',
            body: JSON.stringify({ records: [{ fields: req.body.fields || req.body }] })
        }, baseId);
        res.json(data);
    } catch (err) {
        console.error(`[API] Error creating record in ${tableKey}:`, err.message);
        res.status(err.status || 500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────
// GET /api/config — Devuelve config pública (sin secrets)
// El frontend puede saber qué tablas existen, pero no ve tokens
// ─────────────────────────────────────────────
router.get('/config', (req, res) => {
    res.json({
        tables: Object.keys(TABLES),
        baseConfigured: !!FALLBACK_BASE_ID && !!TOKEN
    });
});

module.exports = router;
