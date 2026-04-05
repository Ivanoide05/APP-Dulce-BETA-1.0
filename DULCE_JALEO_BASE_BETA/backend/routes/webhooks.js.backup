// ===== WEBHOOKS — REEMPLAZO DE N8N =====
// Endpoints que reciben datos externos (escaneo de facturas, pedidos WhatsApp)
// y los procesan directamente desde el servidor, sin depender de n8n.

const express = require('express');
const router = express.Router();

const AIRTABLE_API = 'https://api.airtable.com/v0';
const BASE_ID = process.env.AIRTABLE_BASE_ID || process.env.AIRTABLE_BASE_LEGACY;
const TOKEN = process.env.AIRTABLE_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

const TABLES = {
    FACTURAS: process.env.TABLE_FACTURAS || 'tblLC7oMOUQtRWkn7',
    ALBARANES: process.env.TABLE_ALBARANES || 'tblX9EQUmwItNJCZI',
    GASTOS_VARIOS: process.env.TABLE_GASTOS_VARIOS || 'tblHzVIPEde7zWnUv'
};

// ─────────────────────────────────────────────
// POST /webhook/scan-invoice
// Recibe una imagen en base64, la envía a Gemini para OCR,
// clasifica el resultado y lo guarda en Airtable.
// ─────────────────────────────────────────────
router.post('/scan-invoice', async (req, res) => {
    try {
        const startTime = Date.now();
        const { image, mimeType } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'Falta el campo "image" (base64)' });
        }

        // 1. Enviar a Gemini 2.0 Flash — con JSON mode forzado
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

        const geminiPayload = {
            contents: [{
                parts: [
                    {
                        text: `Analiza esta imagen de documento/ticket/factura y extrae los datos en JSON.
Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin backticks.
Campos requeridos:
- tabla_destino: "FACTURAS" si tiene CIF e IVA desglosado, "ALBARANES" si es lista de productos sin IVA, "GASTOS_VARIOS" si es ticket o gasto menor
- "PROVEDOR/TITULO": nombre del proveedor o comercio
- "TOTAL": número total (ejemplo: 38.99)
- "FECHA": fecha en formato YYYY-MM-DD
- "NUMERO DE DOC": número de documento si existe
- "BASE IMPONIBLE": base imponible si existe, 0 si no
- "IVA": importe de IVA si existe, 0 si no
- "CIF": CIF/NIF si existe
- "DETALLES DOC": resumen breve de los productos/conceptos`
                    },
                    {
                        inline_data: {
                            mime_type: mimeType || 'image/jpeg',
                            data: image
                        }
                    }
                ]
            }],
            generationConfig: {
                maxOutputTokens: 8192,
                temperature: 0.1,
                responseMimeType: 'application/json',
                thinkingConfig: { thinkingBudget: 0 }
            }
        };

        const geminiRes = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload)
        });

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            throw new Error(`Gemini error (${geminiRes.status}): ${errText.substring(0, 300)}`);
        }

        const geminiData = await geminiRes.json();
        const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Limpieza robusta: eliminar markdown code fences y extraer JSON
        let cleanText = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        const fb = cleanText.indexOf('{');
        const lb = cleanText.lastIndexOf('}');
        if (fb < 0 || lb <= fb) {
            throw new Error(`Gemini no devolvió JSON válido: ${rawText.substring(0, 200)}`);
        }
        const cleanJson = cleanText.substring(fb, lb + 1);
        console.log('[SCANNER] Raw Gemini response:', rawText.substring(0, 300));
        console.log('[SCANNER] Clean JSON:', cleanJson.substring(0, 300));
        const extracted = JSON.parse(cleanJson);

        // 2. Determinar tabla destino
        const destino = (extracted.tabla_destino || 'GASTOS_VARIOS').toUpperCase();
        const tableId = TABLES[destino] || TABLES.GASTOS_VARIOS;

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

        // 5. Guardar en Airtable EN BACKGROUND (no bloquea la respuesta)
        fetch(`${AIRTABLE_API}/${BASE_ID}/${tableId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ records: [{ fields }] })
        }).then(airtableRes => {
            if (!airtableRes.ok) {
                airtableRes.text().then(t => console.error(`[SCANNER] Airtable save failed: ${t.substring(0, 200)}`));
            } else {
                console.log(`[SCANNER] Guardado en Airtable (${destino}) — total: ${Date.now() - startTime}ms`);
            }
        }).catch(err => {
            console.error(`[SCANNER] Airtable save error: ${err.message}`);
        });

    } catch (err) {
        console.error('[WEBHOOK] scan-invoice error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────
// POST /webhook/whatsapp-order
// Recibe un pedido desde WhatsApp (vía integración externa)
// y lo inserta en la Hoja de Ruta como pedido dinámico.
//
// Body esperado:
// {
//   "product": "Tarta de Zanahoria",
//   "quantity": 1,
//   "unit": "Ud",
//   "client": "María J.",
//   "clientPhone": "34612345678",
//   "note": "Sin nueces, recoger viernes 18:00"
// }
// ─────────────────────────────────────────────
router.post('/whatsapp-order', async (req, res) => {
    try {
        const { product, quantity, unit, client, clientPhone, note } = req.body;

        if (!product) {
            return res.status(400).json({ error: 'Falta el campo "product"' });
        }

        // Responder con el pedido formateado para que el frontend lo inyecte en la Ruta
        // (La Hoja de Ruta usa localStorage en el frontend, así que devolvemos el objeto
        //  para que el frontend lo inserte. En una futura versión esto irá a base de datos.)
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
// convierte a base64 y redirige internamente a scan-invoice
// ─────────────────────────────────────────────
// File uploads handled via base64 JSON (no multer needed)
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

        // Re-usar la lógica de scan-invoice haciendo un fetch interno
        const internalRes = await fetch(`http://localhost:${process.env.PORT || 3001}/webhook/scan-invoice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
