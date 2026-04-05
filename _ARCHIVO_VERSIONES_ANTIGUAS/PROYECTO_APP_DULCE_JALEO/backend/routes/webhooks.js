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
        const { image, mimeType } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'Falta el campo "image" (base64)' });
        }

        // 1. Enviar a Gemini para extracción de datos
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

        const geminiPayload = {
            contents: [{
                parts: [
                    {
                        text: `Analiza esta imagen de un documento comercial (factura, ticket, albarán o gasto).
Extrae los siguientes datos en formato JSON estricto:
{
  "tabla_destino": "FACTURAS" | "ALBARANES" | "GASTOS_VARIOS",
  "PROVEDOR/TITULO": "nombre del proveedor o emisor",
  "TOTAL": numero_decimal,
  "FECHA": "YYYY-MM-DD",
  "NUMERO DE DOC": "número de documento si existe",
  "BASE IMPONIBLE": numero_decimal,
  "IVA": numero_decimal,
  "CIF": "CIF/NIF del proveedor si aparece",
  "MONEDA": "EUR",
  "DETALLES DOC": "resumen de conceptos/líneas del documento"
}
Reglas:
- Si tiene CIF/NIF e IVA desglosado → tabla_destino = "FACTURAS"
- Si solo lista productos sin fiscal → tabla_destino = "ALBARANES"
- Si es un ticket de caja o gasto menor → tabla_destino = "GASTOS_VARIOS"
- Devuelve SOLO el JSON, sin markdown ni explicación.`
                    },
                    {
                        inline_data: {
                            mime_type: mimeType || 'image/jpeg',
                            data: image
                        }
                    }
                ]
            }]
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

        // Limpiar markdown si Gemini lo envuelve en ```json ... ```
        const cleanJson = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const extracted = JSON.parse(cleanJson);

        // 2. Determinar tabla destino
        const destino = (extracted.tabla_destino || 'GASTOS_VARIOS').toUpperCase();
        const tableId = TABLES[destino] || TABLES.GASTOS_VARIOS;

        // 3. Preparar campos (ahora todas las tablas tienen TOTAL, IVA, BASE IMPONIBLE, DETALLES DOC)
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

        // 4. Guardar en Airtable
        const airtableRes = await fetch(`${AIRTABLE_API}/${BASE_ID}/${tableId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ records: [{ fields }] })
        });

        if (!airtableRes.ok) {
            const errText = await airtableRes.text();
            throw new Error(`Airtable error (${airtableRes.status}): ${errText.substring(0, 300)}`);
        }

        const saved = await airtableRes.json();

        // 5. Devolver resultado al frontend (datos completos de Gemini + lo guardado en Airtable)
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
            airtable_record: saved.records?.[0] || null
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
