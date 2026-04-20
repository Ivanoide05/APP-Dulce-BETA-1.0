// ===== EXPORT TRIMESTRAL =====
// GET /export/trimestre?year=2026&q=1
// Genera un ZIP con: resumen.csv (formato AEAT) + imágenes de Supabase Storage.
// Requiere autenticación JWT de cliente (necesita airtable_base_id).

const express = require('express');
const router = express.Router();
const archiver = require('archiver');
const authMiddleware = require('../lib/authMiddleware');
const supabase = require('../lib/supabaseClient');

const AIRTABLE_API = 'https://api.airtable.com/v0';
const TOKEN = process.env.AIRTABLE_API_KEY;

const TABLE_IDS = {
    FACTURAS: 'FACTURAS',
    ALBARANES: 'ALBARANES',
    GASTOS_VARIOS: 'GASTOS VARIOS'
};

function quarterRange(year, q) {
    const pad = n => String(n).padStart(2, '0');
    const startMonth = (q - 1) * 3 + 1;
    const endMonth = q * 3;
    const endDay = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][endMonth];
    return {
        start: `${year}-${pad(startMonth)}-01`,
        end: `${year}-${pad(endMonth)}-${pad(endDay)}`
    };
}

async function fetchAirtableRecords(baseId, tableId, filterFormula) {
    const base = `${AIRTABLE_API}/${baseId}/${encodeURIComponent(tableId)}`;
    const url = filterFormula ? `${base}?filterByFormula=${encodeURIComponent(filterFormula)}` : base;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${TOKEN}` } });
    if (!res.ok) {
        console.error(`[EXPORT] Airtable error para ${tableId}:`, await res.text().catch(() => ''));
        return [];
    }
    const data = await res.json();
    return data.records || [];
}

// GET /export/debug?year=2026&q=2  — devuelve JSON con lo que Airtable retorna (sin ZIP)
router.get('/debug', async (req, res) => {
    const user = authMiddleware(req, res);
    if (!user) return;

    const baseId = user.airtable_base_id;
    if (!baseId) return res.status(403).json({ error: 'Sin airtable_base_id en JWT' });

    const year = parseInt(req.query.year) || new Date().getFullYear();
    const q = parseInt(req.query.q) || 2;
    const { start, end } = quarterRange(year, q);
    const filter = `AND({FECHA}>='${start}',{FECHA}<='${end}')`;

    const [facturas, albaranes, gastos] = await Promise.all([
        fetchAirtableRecords(baseId, TABLE_IDS.FACTURAS, filter),
        fetchAirtableRecords(baseId, TABLE_IDS.ALBARANES, filter),
        fetchAirtableRecords(baseId, TABLE_IDS.GASTOS_VARIOS, filter)
    ]);

    // También prueba sin filtro para ver si hay registros en general
    const [facturasTodas] = await Promise.all([
        fetchAirtableRecords(baseId, TABLE_IDS.FACTURAS, '')
    ]);

    res.json({
        baseId,
        filter,
        range: { start, end },
        conFiltro: { facturas: facturas.length, albaranes: albaranes.length, gastos: gastos.length },
        sinFiltro: { facturasTodas: facturasTodas.length },
        todasLasFechas: facturasTodas.map(r => ({
            fecha: r.fields['FECHA'],
            proveedor: r.fields['PROVEDOR/TITULO'],
            imagen_url: r.fields['IMAGEN_URL'] || null
        })),
        primeraConFiltro: facturas[0]?.fields || null
    });
});

router.get('/trimestre', async (req, res) => {
    const user = authMiddleware(req, res);
    if (!user) return;

    const baseId = user.airtable_base_id;
    if (!baseId) {
        return res.status(403).json({ error: 'Esta cuenta no tiene base de Airtable configurada.' });
    }

    const year = parseInt(req.query.year) || new Date().getFullYear();
    const q = parseInt(req.query.q);
    if (!q || q < 1 || q > 4) {
        return res.status(400).json({ error: 'Parámetro q inválido. Debe ser 1, 2, 3 o 4.' });
    }

    const { start, end } = quarterRange(year, q);
    const filter = `AND({FECHA}>='${start}',{FECHA}<='${end}')`;
    console.log(`[EXPORT] Q${q}/${year} → filtro: ${filter}`);

    const [facturas, albaranes, gastos] = await Promise.all([
        fetchAirtableRecords(baseId, TABLE_IDS.FACTURAS, filter),
        fetchAirtableRecords(baseId, TABLE_IDS.ALBARANES, filter),
        fetchAirtableRecords(baseId, TABLE_IDS.GASTOS_VARIOS, filter)
    ]);
    console.log(`[EXPORT] Registros: facturas=${facturas.length}, albaranes=${albaranes.length}, gastos=${gastos.length}`);

    const allRecords = [
        ...facturas.map(r => ({ ...r, _categoria: 'FACTURAS' })),
        ...albaranes.map(r => ({ ...r, _categoria: 'ALBARANES' })),
        ...gastos.map(r => ({ ...r, _categoria: 'GASTOS_VARIOS' }))
    ];

    const zipName = `DulceOS_Q${q}_${year}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('error', err => {
        console.error('[EXPORT] Archiver error:', err.message);
    });
    archive.pipe(res);

    // CSV formato AEAT Libro Registro de Facturas Recibidas (separador ;)
    const csvHeader = 'Fecha;Nº Doc;NIF Emisor;Nombre Emisor;Base Imponible;IVA;Total;Categoría;Descripción\n';
    const csvRows = allRecords.map(r => {
        const f = r.fields;
        return [
            f['FECHA'] || '',
            f['NUMERO DE DOC'] || '',
            f['CIF'] || '',
            f['PROVEDOR/TITULO'] || '',
            f['BASE IMPONIBLE'] || '0',
            f['IVA'] || '0',
            f['TOTAL'] || '0',
            r._categoria,
            (f['DETALLES DOC'] || '').replace(/;/g, ',')
        ].join(';');
    }).join('\n');
    archive.append(csvHeader + csvRows, { name: 'resumen.csv' });

    // Imágenes desde Supabase Storage
    for (const record of allRecords) {
        const storagePath = record.fields['IMAGEN_URL'];
        if (!storagePath) continue;
        try {
            const { data, error } = await supabase.storage
                .from('facturas-clientes')
                .download(storagePath);
            if (error || !data) {
                console.warn('[EXPORT] Imagen no encontrada:', storagePath);
                continue;
            }
            const ext = storagePath.split('.').pop();
            const docId = (record.fields['NUMERO DE DOC'] || record.id).replace(/[/\\?%*:|"<>]/g, '-');
            const filename = `imagenes/${docId}.${ext}`;
            const arrayBuffer = await data.arrayBuffer();
            archive.append(Buffer.from(arrayBuffer), { name: filename });
        } catch (e) {
            console.error('[EXPORT] Error descargando imagen:', e.message);
        }
    }

    archive.finalize();
});

module.exports = router;
