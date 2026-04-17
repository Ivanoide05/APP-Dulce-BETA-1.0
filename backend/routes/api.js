// ===== PROXY SEGURO A AIRTABLE =====
// El frontend llama a /api/records, /api/records/:table, etc.
// Este módulo inyecta el Bearer token desde .env y reenvía la petición a Airtable.
// Todas las rutas requieren autenticación JWT.
// El airtable_base_id se extrae del JWT del usuario autenticado.

const express = require('express');
const router = express.Router();
const authMiddleware = require('../lib/authMiddleware');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const supabase = require('../lib/supabaseClient');


const AIRTABLE_API = 'https://api.airtable.com/v0';
const FALLBACK_BASE_ID = (process.env.AIRTABLE_BASE_ID || process.env.AIRTABLE_BASE_LEGACY || '').trim();
const TOKEN = (process.env.AIRTABLE_API_KEY || '').trim();
const GEMINI_KEY = (process.env.GEMINI_API_KEY || '').trim();
const TABLES = {
    FACTURAS: 'FACTURAS',
    ALBARANES: 'ALBARANES',
    GASTOS_VARIOS: 'GASTOS VARIOS',
    AGENDA: 'AGENDA',
    PEDIDOS: 'PEDIDOS',
    PRODUCTO: 'PRODUCTO'
};

// Helper: fetch nativo de Node 18+
// Acepta baseId como parámetro para soporte multi-tenant
async function airtableFetch(req, tableId, options = {}, baseId = null) {
    const headerBaseId = req.headers['x-airtable-base-id'];
    const headerToken = req.headers['x-airtable-token'];
    
    const effectiveBaseId = (headerBaseId || baseId || FALLBACK_BASE_ID || '').trim();
    const effectiveToken = (headerToken || TOKEN || '').trim();

    if (!effectiveBaseId || !effectiveToken) {
        throw new Error('Configuración de Airtable incompleta (Token o Base ID faltante)');
    }

    // Construcción de URL con parámetros de consulta
    let url = `${AIRTABLE_API}/${effectiveBaseId}/${encodeURIComponent(tableId)}`;
    if (options.queryParams) {
        const params = new URLSearchParams(options.queryParams);
        url += `?${params.toString()}`;
    }

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
        const baseId = user.airtable_base_id || FALLBACK_BASE_ID;
        
        // Multi-tenant: Si es cliente, solo ve sus pedidos.
        // Los admins ven TODO para gestión global.
        const pedidosParams = {};
        if (user.role === 'client' && user.email) {
            pedidosParams.filterByFormula = `{Client} = '${user.email}'`;
            console.log(`[API] Filtrando pedidos para cliente: ${user.email}`);
        }

        const [facturas, albaranes, gastos, agenda, pedidos] = await Promise.all([
            airtableFetch(req, TABLES.FACTURAS, {}, baseId).catch(err => { console.warn(`Skipping FACTURAS: ${err.message}`); return { records: [] }; }),
            airtableFetch(req, TABLES.ALBARANES, {}, baseId).catch(err => { console.warn(`Skipping ALBARANES: ${err.message}`); return { records: [] }; }),
            airtableFetch(req, TABLES.GASTOS_VARIOS, {}, baseId).catch(err => { console.warn(`Skipping GASTOS VARIOS: ${err.message}`); return { records: [] }; }),
            airtableFetch(req, TABLES.AGENDA, {}, baseId).catch(() => ({ records: [] })),
            airtableFetch(req, TABLES.PEDIDOS, { queryParams: pedidosParams }, baseId).catch(() => ({ records: [] }))
        ]);

        res.set('Cache-Control', 'max-age=300, stale-while-revalidate=60');
        res.json({
            facturas: facturas.records || [],
            albaranes: albaranes.records || [],
            gastos: gastos.records || [],
            agenda: agenda.records || [],
            pedidos: pedidos.records || []
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

// ─────────────────────────────────────────────
// PATCH /api/records/:table/:id — Editar un registro existente
// Body: { fields: { ... } }
// ─────────────────────────────────────────────
router.patch('/records/:table/:id', async (req, res) => {
    const user = authMiddleware(req, res);
    if (!user) return;

    const tableKey = req.params.table.toUpperCase();
    const tableId = TABLES[tableKey];
    const recordId = req.params.id;

    if (!tableId) {
        return res.status(400).json({ error: `Tabla desconocida: ${req.params.table}` });
    }

    try {
        const baseId = user.airtable_base_id || FALLBACK_BASE_ID;
        // Usamos airtableFetch para pasar por el mismo embudo de seguridad que el resto de rutas
        const data = await airtableFetch(req, `${tableId}/${recordId}`, {
            method: 'PATCH',
            body: JSON.stringify({ fields: req.body.fields || req.body })
        }, baseId);
        res.json(data);
    } catch (err) {
        console.error(`[API] Error updating record in ${tableKey}:`, err.message);
        res.status(err.status || 500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────
// DELETE /api/records/:table/:id — Eliminar un registro
// ─────────────────────────────────────────────
router.delete('/records/:table/:id', async (req, res) => {
    const user = authMiddleware(req, res);
    if (!user) return;

    const tableKey = req.params.table.toUpperCase();
    const tableId = TABLES[tableKey];
    const recordId = req.params.id;

    if (!tableId) {
        return res.status(400).json({ error: `Tabla desconocida: ${req.params.table}` });
    }

    try {
        const baseId = user.airtable_base_id || FALLBACK_BASE_ID;
        const data = await airtableFetch(req, `${tableId}/${recordId}`, {
            method: 'DELETE'
        }, baseId);
        res.json(data);
    } catch (err) {
        console.error(`[API] Error deleting record in ${tableKey}:`, err.message);
        res.status(err.status || 500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────
// POST /api/ai/analyze-expenses
// Analiza gastos y mermas del mes actual usando Gemini.
// ─────────────────────────────────────────────
router.post('/ai/analyze-expenses', async (req, res) => {
    const user = authMiddleware(req, res);
    if (!user) return;

    try {
        const { expenses, mermas } = req.body;

        if (!expenses || !mermas) {
            return res.status(400).json({ error: 'Faltan datos de expenses o mermas' });
        }

        const AI_PROMPT = `Eres Gema, Auditora Financiera Estricta de DulceOS.
Analiza el siguiente historial de gastos de compras a proveedores (materias primas) y mermas registradas del MES ACTUAL.
Detecta ineficiencias de gasto u originadas por mermas en producción.
Devuelve obligatoriamente un JSON estructurado con el área de mayor fuga y 3 recomendaciones hiper-prácticas y cortas (máx 2 líneas cada una) para reducir fugas monetarias.

Datos de Gastos:
${JSON.stringify(expenses, null, 2)}

Datos de Mermas:
${JSON.stringify(mermas, null, 2)}

Debes responder ÚNICAMENTE con JSON en el siguiente formato, sin texto Markdown alrededor:
{
  "fugaPrincipal": "Nombre del proveedor o producto con mayor gasto ineficiente/merma",
  "recomendaciones": [
    "Consejo 1",
    "Consejo 2",
    "Consejo 3"
  ]
}`;

        const GEMINI_MODELS = [
            'gemini-flash-latest',
            'gemini-flash-lite-latest',
            'gemini-2.0-flash-lite',
            'gemini-2.0-flash-001',
            'gemini-3-flash-preview'
        ];

        const genAI = new GoogleGenerativeAI(GEMINI_KEY);
        let rawText = '';

        for (const modelName of GEMINI_MODELS) {
            try {
                console.log(`[GEMA] Probando modelo: ${modelName}`);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
                });
                const result = await model.generateContent([
                    { text: AI_PROMPT }
                ]);
                rawText = result.response.text();
                console.log(`[GEMA] ✅ Éxito con: ${modelName}`);
                break;
            } catch (err) {
                console.warn(`[GEMA] Fallo en ${modelName}:`, err.message);
                continue;
            }
        }

        if (!rawText) {
            throw new Error('Todos los modelos de Gemini fallaron en el análisis.');
        }

        let cleanText = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        const fb = cleanText.indexOf('{');
        const lb = cleanText.lastIndexOf('}');
        if (fb < 0 || lb <= fb) throw new Error('Respuesta no es JSON válido');
        
        const cleanJson = cleanText.substring(fb, lb + 1);
        const extracted = JSON.parse(cleanJson);

        res.json({ success: true, insights: extracted });

    } catch (err) {
        console.error('[GEMA] Error analyze-expenses:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────
// GET /api/active-notices — Recuperar avisos activos para el cliente
// ─────────────────────────────────────────────
router.get('/active-notices', async (req, res) => {
    // Es una ruta protegida básica para que el cliente vea sus avisos
    const user = authMiddleware(req, res);
    if (!user) return;

    try {
        // Buscamos avisos que sean "Generales" (target_client_id is null) 
        // O avisos específicos para ESTE cliente.
        const { data, error } = await supabase
            .from('global_notices')
            .select('*')
            .eq('active', true)
            .or(`target_client_id.is.null,target_client_id.eq.${user.id}`)
            .order('created_at', { ascending: false });

        if (error) {
             if (error.code === '42P01') return res.json({ success: true, notices: [] });
             throw error;
        }

        res.json({ success: true, notices: data });
    } catch (err) {
        console.error('[API] Error obteniendo avisos:', err.message);
        res.status(500).json({ error: 'Error al obtener avisos.' });
    }
});

module.exports = router;
