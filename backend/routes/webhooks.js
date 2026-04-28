// ===== WEBHOOKS — REEMPLAZO DE N8N =====
// Endpoints que reciben datos externos (escaneo de facturas, pedidos WhatsApp)
// y los procesan directamente desde el servidor, sin depender de n8n.
// scan-invoice y whatsapp-order requieren autenticación JWT.

const express = require('express');
const router = express.Router();
const authMiddleware = require('../lib/authMiddleware');
const supabase = require('../lib/supabaseClient');

const { GoogleGenerativeAI } = require('@google/generative-ai');

const AIRTABLE_API = 'https://api.airtable.com/v0';
const FALLBACK_BASE_ID = process.env.AIRTABLE_BASE_ID || process.env.AIRTABLE_BASE_LEGACY;
const TOKEN = process.env.AIRTABLE_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

const TABLES = {
    FACTURAS: 'FACTURAS',
    ALBARANES: 'ALBARANES',
    GASTOS_VARIOS: 'GASTOS VARIOS'
};

// ─────────────────────────────────────────────
// POST /webhook/scan-invoice
// Recibe una imagen en base64, la envía a Gemini para OCR,
// clasifica el resultado y lo guarda en Airtable.
// Requiere autenticación JWT.
// ─────────────────────────────────────────────
router.post('/scan-invoice', async (req, res) => {
    const user = authMiddleware(req, res);
    if (!user) return;

    try {
        const startTime = Date.now();
        const { image, mimeType } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'Falta el campo "image" (base64)' });
        }

        // Usar airtable_base_id del JWT, con fallback al .env
        const baseId = user.airtable_base_id || FALLBACK_BASE_ID;

        // 1. Llamar a Gemini via SDK oficial — gestiona modelos y rutas automáticamente
        const GEMINI_MODELS = [
            'gemini-flash-latest',
            'gemini-flash-lite-latest',
            'gemini-2.0-flash-lite',
            'gemini-2.0-flash-001',
            'gemini-3-flash-preview'
        ];

        const OCR_PROMPT = `Analiza exhaustivamente esta imagen de factura, ticket o albarán y extrae los datos clave.
INSTRUCCIONES CRÍTICAS:
1. "PROVEDOR/TITULO": Busca el nombre comercial del emisor. Prioriza logótipos o textos destacados.
2. "FECHA": Formato YYYY-MM-DD. Si no hay año, asume el actual.
3. "TOTAL": Importe final (numérico). Si es un albarán sin precio, pon 0.
4. "tabla_destino":
   - "FACTURAS" si tiene número de factura, CIF/NIF e IVA desglosado.
   - "ALBARANES" si es una nota de entrega o pedido sin valor fiscal de factura.
   - "GASTOS_VARIOS" para tickets de parking, gasolina o compras menores sin CIF.

Responde Únicamente con un objeto JSON válido, sin markdown, sin código adicional.
Campos requeridos:
{
  "tabla_destino": "FACTURAS|ALBARANES|GASTOS_VARIOS",
  "PROVEDOR/TITULO": "string",
  "TOTAL": number,
  "FECHA": "YYYY-MM-DD",
  "NUMERO DE DOC": "string",
  "BASE IMPONIBLE": number,
  "IVA": number,
  "CIF": "string",
  "DETALLES DOC": "string"
}`;

        const genAI = new GoogleGenerativeAI(GEMINI_KEY);
        let rawText = '';
        let modelUsed = '';
        let lastError = null;

        for (const modelName of GEMINI_MODELS) {
            try {
                console.log(`[SCANNER] Probando modelo: ${modelName}`);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
                });
                const result = await model.generateContent([
                    { text: OCR_PROMPT },
                    { inlineData: { mimeType: mimeType || 'image/jpeg', data: image } }
                ]);
                rawText = result.response.text();
                modelUsed = modelName;
                console.log(`[SCANNER] ✅ Éxito con: ${modelName}`);
                break; // éxito, salimos del bucle
            } catch (err) {
                lastError = err;
                const status = err?.status || err?.statusCode || '';
                const msg = (err.message || '').toLowerCase();
                console.warn(`[SCANNER] Fallo en ${modelName}: ${status} - ${msg.substring(0, 100)}`);
                
                // Si es un error de autenticación crítica (p.ej. API Key inválida), no seguimos probando
                if (msg.includes('api_key_invalid') || msg.includes('401') || msg.includes('403')) {
                    throw new Error(`Error de autenticación: Verifica tu API Key en el panel de Google.`);
                }
                
                // Continuamos probando el siguiente modelo en la lista ante casi cualquier otro error
                // (incluyendo 429 cuota, 404 modelo no habilitado, o 500 saturación)
                continue;
            }
        }

        if (!rawText) {
            let errorMsg = 'Todos los modelos de Gemini fallaron.';
            if (lastError?.message?.includes('monthly spending cap')) {
                errorMsg = 'Límite de gasto superado en Google AI Studio. Sube el cap o espera al próximo mes.';
            } else if (lastError?.message?.includes('429')) {
                errorMsg = 'Cuota de peticiones agotada temporalmente (Error 429).';
            } else {
                errorMsg += ` Último error: ${lastError?.message?.substring(0, 100)}`;
            }
            throw new Error(errorMsg);
        }

        // Limpieza robusta: eliminar markdown code fences y extraer JSON
        let cleanText = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        const fb = cleanText.indexOf('{');
        const lb = cleanText.lastIndexOf('}');
        if (fb < 0 || lb <= fb) {
            throw new Error(`Gemini no devolvio JSON valido: ${rawText.substring(0, 200)}`);
        }
        const cleanJson = cleanText.substring(fb, lb + 1);
        console.log('[SCANNER] Clean JSON:', cleanJson.substring(0, 300));
        const extracted = JSON.parse(cleanJson);

        // 2. Determinar tabla destino (normalizar claves con underscore a nombre limpio)
        const destinoKey = (extracted.tabla_destino || 'GASTOS_VARIOS').toUpperCase().replace(/ /g, '_');
        const tableId = TABLES[destinoKey] || TABLES.GASTOS_VARIOS;
        const destino = destinoKey;

        // 3. Preparar campos
        const fields = {
            'PROVEDOR/TITULO': extracted['PROVEDOR/TITULO'] || extracted['PROVEDOR/ TITULO'] || 'Desconocido',
            'FECHA': extracted['FECHA'] || extracted['Fecha'] || new Date().toISOString().slice(0, 10),
            'NUMERO DE DOC': extracted['NUMERO DE DOC'] || '',
            'CIF': extracted['CIF'] || '',
            'TOTAL': parseFloat(extracted['TOTAL']) || 0,
            'IVA': parseFloat(extracted['IVA']) || 0,
            'BASE IMPONIBLE': String(parseFloat(extracted['BASE IMPONIBLE']) || 0),
            'DETALLES DOC': extracted['DETALLES DOC'] || ''
        };

        const ocrTime = Date.now() - startTime;
        console.log(`[SCANNER] OCR completado en ${ocrTime}ms — ${destino}`);

        // 4. Responder al frontend INMEDIATAMENTE — no esperar a Airtable
        res.json({
            success: true,
            tabla_destino: destino,
            fields: {
                ...extracted,
                ...fields,
                'TOTAL': parseFloat(extracted['TOTAL']) || 0,
                'BASE IMPONIBLE': String(parseFloat(extracted['BASE IMPONIBLE']) || 0),
                'IVA': parseFloat(extracted['IVA']) || 0,
                'DETALLES DOC': extracted['DETALLES DOC'] || ''
            },
            ocr_ms: ocrTime
        });

        // 5. Background: subir imagen a Supabase Storage, luego guardar en Airtable
        const effectiveToken = (process.env.AIRTABLE_API_KEY || '').trim();
        (async () => {
            let imagenStoragePath = null;
            try {
                const now = new Date();
                const quarter = Math.ceil((now.getMonth() + 1) / 3);
                const ext = (mimeType || 'image/jpeg').split('/')[1] || 'jpg';
                const clientId = user.client_id || user.id;
                const storagePath = `${clientId}/${now.getFullYear()}/Q${quarter}/${Date.now()}.${ext}`;
                const imageBuffer = Buffer.from(image, 'base64');
                const { error: uploadErr } = await supabase.storage
                    .from('facturas-clientes')
                    .upload(storagePath, imageBuffer, { contentType: mimeType || 'image/jpeg', upsert: false });
                if (uploadErr) {
                    console.error('[SCANNER] Storage upload failed:', uploadErr.message);
                } else {
                    imagenStoragePath = storagePath;
                    console.log('[SCANNER] Imagen en Storage:', storagePath);
                }
            } catch (storageErr) {
                console.error('[SCANNER] Storage error:', storageErr.message);
            }

            if (imagenStoragePath) fields['IMAGEN_URL'] = imagenStoragePath;

            try {
                const airtableRes = await fetch(`${AIRTABLE_API}/${baseId}/${encodeURIComponent(tableId)}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${effectiveToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ records: [{ fields }] })
                });
                if (!airtableRes.ok) {
                    const t = await airtableRes.text();
                    console.error(`[SCANNER] Airtable save failed: ${t.substring(0, 200)}`);
                } else {
                    console.log(`[SCANNER] Guardado en Airtable (${destino}) — total: ${Date.now() - startTime}ms`);
                }
            } catch (err) {
                console.error(`[SCANNER] Airtable save error: ${err.message}`);
            }
        })();

    } catch (err) {
        console.error('[WEBHOOK] scan-invoice error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────
// POST /webhook/whatsapp-order
// Recibe un pedido desde WhatsApp (vía integración externa)
// y lo inserta en la Hoja de Ruta como pedido dinámico.
// Requiere autenticación JWT.
// ─────────────────────────────────────────────
router.post('/whatsapp-order', async (req, res) => {
    const user = authMiddleware(req, res);
    if (!user) return;

    try {
        const { product, quantity, unit, client, clientPhone, note } = req.body;

        if (!product) {
            return res.status(400).json({ error: 'Falta el campo "product"' });
        }

        // Responder con el pedido formateado para que el frontend lo inyecte en la Ruta
        const order = {
            id: 'dyn-' + Date.now(),
            type: 'dynamic',
            source: 'whatsapp',
            product: product,
            quantity: parseInt(quantity) || 1,
            unit: unit || 'Ud',
            client: client || 'Cliente WhatsApp',
            clientPhone: clientPhone || '',
            note: note || '',
            completed: false,
            completedAt: null
        };

        res.json({
            success: true,
            order: order
        });

        console.log(`[WEBHOOK] Nuevo pedido WhatsApp: ${product} x${order.quantity} — ${client}`);

    } catch (err) {
        console.error('[WEBHOOK] whatsapp-order error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────
// POST /webhook/lovable-webhook (compatibilidad con n8n existente)
// Acepta FormData como lo hacía el webhook de n8n,
// convierte a base64 y redirige internamente a scan-invoice.
// Propaga el header Authorization para que scan-invoice pueda autenticar.
// ─────────────────────────────────────────────
router.post('/lovable-webhook', express.raw({ type: '*/*', limit: '10mb' }), async (req, res) => {
    try {
        // Si viene como JSON (base64 directo), procesamos normalmente
        let image, mimeType;

        if (req.is('application/json')) {
            const body = JSON.parse(req.body.toString());
            image = body.image;
            mimeType = body.mimeType || 'image/jpeg';
        } else {
            // Si es form-data o binary, convertir a base64
            const buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body);
            image = buffer.toString('base64');
            mimeType = req.headers['content-type'] || 'image/jpeg';
        }

        // Preparar headers para la llamada interna, incluyendo Authorization si existe
        const internalHeaders = { 'Content-Type': 'application/json' };
        if (req.headers.authorization) {
            internalHeaders['Authorization'] = req.headers.authorization;
        }

        // Re-usar la lógica de scan-invoice haciendo un fetch a la URL pública
        // En Vercel: usar VERCEL_URL (https://xxx.vercel.app)
        // En localhost: usar http://localhost:PORT
        const isVercel = process.env.VERCEL === 'true';
        const baseUrl = isVercel
            ? `https://${process.env.VERCEL_URL}`
            : `http://localhost:${process.env.PORT || 3002}`;

        const internalRes = await fetch(`${baseUrl}/api/webhook/scan-invoice`, {
            method: 'POST',
            headers: internalHeaders,
            body: JSON.stringify({ image, mimeType })
        });

        const result = await internalRes.json();
        res.status(internalRes.status).json(result);

    } catch (err) {
        console.error('[WEBHOOK] lovable-webhook error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
