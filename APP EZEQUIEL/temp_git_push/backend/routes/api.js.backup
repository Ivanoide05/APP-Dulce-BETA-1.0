// ===== PROXY SEGURO A AIRTABLE =====
// El frontend llama a /api/records, /api/records/:table, etc.
// Este módulo inyecta el Bearer token desde .env y reenvía la petición a Airtable.

const express = require('express');
const router = express.Router();

const AIRTABLE_API = 'https://api.airtable.com/v0';
const BASE_ID = process.env.AIRTABLE_BASE_ID || process.env.AIRTABLE_BASE_LEGACY;
const TOKEN = process.env.AIRTABLE_API_KEY;

const TABLES = {
    FACTURAS: process.env.TABLE_FACTURAS || 'tblLC7oMOUQtRWkn7',
    ALBARANES: process.env.TABLE_ALBARANES || 'tblX9EQUmwItNJCZI',
    GASTOS_VARIOS: process.env.TABLE_GASTOS_VARIOS || 'tblHzVIPEde7zWnUv'
};

// Helper: fetch nativo de Node 18+
async function airtableFetch(tableId, options = {}) {
    const url = `${AIRTABLE_API}/${BASE_ID}/${tableId}`;
    const res = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });
    const data = await res.json();
    if (!res.ok) {
        const err = new Error(data.error?.message || 'Airtable error');
        err.status = res.status;
        throw err;
    }
    return data;
}

// ─────────────────────────────────────────────
// GET /api/records — Devuelve TODOS los registros de las 3 tablas
// Esto es lo que usa el Dashboard, Facturas, Márgenes
// ─────────────────────────────────────────────
router.get('/records', async (req, res) => {
    try {
        const [facturas, albaranes, gastos] = await Promise.all([
            airtableFetch(TABLES.FACTURAS),
            airtableFetch(TABLES.ALBARANES),
            airtableFetch(TABLES.GASTOS_VARIOS)
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
    const tableKey = req.params.table.toUpperCase();
    const tableId = TABLES[tableKey];

    if (!tableId) {
        return res.status(400).json({ error: `Tabla desconocida: ${req.params.table}. Usa: FACTURAS, ALBARANES, GASTOS_VARIOS` });
    }

    try {
        const data = await airtableFetch(tableId);
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
    const tableKey = req.params.table.toUpperCase();
    const tableId = TABLES[tableKey];

    if (!tableId) {
        return res.status(400).json({ error: `Tabla desconocida: ${req.params.table}` });
    }

    try {
        const data = await airtableFetch(tableId, {
            method: 'POST',
            body: JSON.stringify({ records: [{ fields: req.body.fields || req.body }] })
        });
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
        baseConfigured: !!BASE_ID && !!TOKEN
    });
});

module.exports = router;
