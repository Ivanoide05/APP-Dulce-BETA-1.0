// Deploy backend to Easypanel
const https = require('https');
const fs = require('fs');

const dockerfile = [
  'FROM node:20-alpine',
  'WORKDIR /app',
  'RUN npm init -y && npm install express@4.21.2 cors@2.8.5',
  'RUN mkdir -p routes',
  'EXPOSE 3001',
  'CMD ["node", "server.js"]'
].join('\n');

const serverJs = `const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);
const webhookRoutes = require('./routes/webhooks');
app.use('/webhook', webhookRoutes);
app.get('/health', (req, res) => { res.json({ status: 'ok', service: 'dulce-jaleo-backend', timestamp: new Date().toISOString() }); });
app.listen(PORT, () => { console.log('Backend running on port ' + PORT); });`;

const apiJs = `const express = require('express');
const router = express.Router();
const AIRTABLE_API = 'https://api.airtable.com/v0';
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TOKEN = process.env.AIRTABLE_API_KEY;
const TABLES = { FACTURAS: process.env.TABLE_FACTURAS, ALBARANES: process.env.TABLE_ALBARANES, GASTOS_VARIOS: process.env.TABLE_GASTOS_VARIOS };
async function airtableFetch(tableId, options = {}) {
  const res = await fetch(AIRTABLE_API + '/' + BASE_ID + '/' + tableId, { ...options, headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const data = await res.json();
  if (!res.ok) { const err = new Error(data.error?.message || 'Airtable error'); err.status = res.status; throw err; }
  return data;
}
router.get('/records', async (req, res) => {
  try {
    const [facturas, albaranes, gastos] = await Promise.all([airtableFetch(TABLES.FACTURAS), airtableFetch(TABLES.ALBARANES), airtableFetch(TABLES.GASTOS_VARIOS)]);
    res.json({ facturas: facturas.records || [], albaranes: albaranes.records || [], gastos: gastos.records || [] });
  } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
});
router.get('/records/:table', async (req, res) => {
  const tableKey = req.params.table.toUpperCase();
  const tableId = TABLES[tableKey];
  if (!tableId) return res.status(400).json({ error: 'Tabla desconocida: ' + req.params.table });
  try { res.json(await airtableFetch(tableId)); } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
});
router.post('/records/:table', async (req, res) => {
  const tableKey = req.params.table.toUpperCase();
  const tableId = TABLES[tableKey];
  if (!tableId) return res.status(400).json({ error: 'Tabla desconocida: ' + req.params.table });
  try { res.json(await airtableFetch(tableId, { method: 'POST', body: JSON.stringify({ records: [{ fields: req.body.fields || req.body }] }) })); }
  catch (err) { res.status(err.status || 500).json({ error: err.message }); }
});
router.get('/config', (req, res) => { res.json({ tables: Object.keys(TABLES), baseConfigured: !!BASE_ID && !!TOKEN }); });
module.exports = router;`;

const webhooksJs = `const express = require('express');
const router = express.Router();
const AIRTABLE_API = 'https://api.airtable.com/v0';
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TOKEN = process.env.AIRTABLE_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const TABLES = { FACTURAS: process.env.TABLE_FACTURAS, ALBARANES: process.env.TABLE_ALBARANES, GASTOS_VARIOS: process.env.TABLE_GASTOS_VARIOS };
router.post('/scan-invoice', async (req, res) => {
  try {
    const { image, mimeType } = req.body;
    if (!image) return res.status(400).json({ error: 'Falta el campo image (base64)' });
    const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_KEY;
    const prompt = 'Analiza esta imagen de un documento comercial (factura, ticket, albaran o gasto). Extrae los siguientes datos en formato JSON estricto: { "tabla_destino": "FACTURAS" | "ALBARANES" | "GASTOS_VARIOS", "PROVEDOR/TITULO": "nombre del proveedor o emisor", "TOTAL": numero_decimal, "FECHA": "YYYY-MM-DD", "NUMERO DE DOC": "numero de documento si existe", "BASE IMPONIBLE": numero_decimal, "IVA": numero_decimal, "CIF": "CIF/NIF del proveedor si aparece", "MONEDA": "EUR", "DETALLES DOC": "resumen de conceptos" } Reglas: Si tiene CIF/NIF e IVA desglosado = FACTURAS. Si solo lista productos sin fiscal = ALBARANES. Si es un ticket de caja o gasto menor = GASTOS_VARIOS. Devuelve SOLO el JSON.';
    const geminiPayload = { contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType || 'image/jpeg', data: image } }] }] };
    const geminiRes = await fetch(geminiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(geminiPayload) });
    if (!geminiRes.ok) { const errText = await geminiRes.text(); throw new Error('Gemini error (' + geminiRes.status + '): ' + errText.substring(0, 300)); }
    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanJson = rawText.replace(/\`\`\`json\\s*/g, '').replace(/\`\`\`\\s*/g, '').trim();
    const extracted = JSON.parse(cleanJson);
    const destino = (extracted.tabla_destino || 'GASTOS_VARIOS').toUpperCase();
    const tableId = TABLES[destino] || TABLES.GASTOS_VARIOS;
    const fields = { 'PROVEDOR/TITULO': extracted['PROVEDOR/TITULO'] || 'Desconocido', 'FECHA': extracted['FECHA'] || new Date().toISOString().slice(0,10), 'NUMERO DE DOC': extracted['NUMERO DE DOC'] || '', 'CIF': extracted['CIF'] || '', 'TOTAL': parseFloat(extracted['TOTAL']) || 0, 'IVA': parseFloat(extracted['IVA']) || 0, 'BASE IMPONIBLE': String(parseFloat(extracted['BASE IMPONIBLE']) || 0), 'DETALLES DOC': extracted['DETALLES DOC'] || '' };
    const airtableRes = await fetch(AIRTABLE_API + '/' + BASE_ID + '/' + tableId, { method: 'POST', headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ records: [{ fields }] }) });
    if (!airtableRes.ok) { const errText = await airtableRes.text(); throw new Error('Airtable error (' + airtableRes.status + '): ' + errText.substring(0, 300)); }
    const saved = await airtableRes.json();
    res.json({ success: true, tabla_destino: destino, fields: { ...extracted, ...fields, 'TOTAL': parseFloat(extracted['TOTAL']) || 0, 'BASE IMPONIBLE': String(parseFloat(extracted['BASE IMPONIBLE']) || 0), 'IVA': parseFloat(extracted['IVA']) || 0, 'DETALLES DOC': extracted['DETALLES DOC'] || '' }, airtable_record: saved.records?.[0] || null });
  } catch (err) { console.error('[WEBHOOK] scan-invoice error:', err.message); res.status(500).json({ error: err.message }); }
});
router.post('/whatsapp-order', async (req, res) => {
  try {
    const { product, quantity, unit, client, clientPhone, note } = req.body;
    if (!product) return res.status(400).json({ error: 'Falta el campo product' });
    res.json({ success: true, order: { id: 'dyn-' + Date.now(), type: 'dynamic', source: 'whatsapp', product, quantity: parseInt(quantity)||1, unit: unit||'Ud', client: client||'Cliente WhatsApp', clientPhone: clientPhone||'', note: note||'', completed: false, completedAt: null } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/lovable-webhook', express.raw({ type: '*/*', limit: '10mb' }), async (req, res) => {
  try {
    let image, mimeType;
    if (req.is('application/json')) { const body = JSON.parse(req.body.toString()); image = body.image; mimeType = body.mimeType || 'image/jpeg'; }
    else { const buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body); image = buffer.toString('base64'); mimeType = req.headers['content-type'] || 'image/jpeg'; }
    const internalRes = await fetch('http://localhost:' + (process.env.PORT||3001) + '/webhook/scan-invoice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image, mimeType }) });
    const result = await internalRes.json();
    res.status(internalRes.status).json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
module.exports = router;`;

const payload = {
  json: {
    projectName: "dulce_y_jaleo",
    serviceName: "backend",
    source: { type: "dockerfile", dockerfile },
    env: "AIRTABLE_API_KEY=YOUR_AIRTABLE_TOKEN\nAIRTABLE_BASE_ID=YOUR_BASE_ID\nGEMINI_API_KEY=YOUR_GEMINI_KEY\nTABLE_FACTURAS=YOUR_TABLE_ID\nTABLE_ALBARANES=YOUR_TABLE_ID\nTABLE_GASTOS_VARIOS=YOUR_TABLE_ID\nPORT=3001",
    domains: [{
      host: "YOUR_BACKEND_DOMAIN",
      https: true,
      port: 3001,
      path: "/"
    }],
    mounts: [
      { type: "file", content: serverJs, mountPath: "/app/server.js" },
      { type: "file", content: apiJs, mountPath: "/app/routes/api.js" },
      { type: "file", content: webhooksJs, mountPath: "/app/routes/webhooks.js" }
    ]
  }
};

const body = JSON.stringify(payload);

const options = {
  hostname: 'YOUR_EASYPANEL_HOST',
  path: '/api/trpc/services.app.createService',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_EASYPANEL_TOKEN',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data.substring(0, 500));
  });
});
req.on('error', e => console.error('Error:', e.message));
req.write(body);
req.end();
