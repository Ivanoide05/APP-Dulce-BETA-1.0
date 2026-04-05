// ===== API CLIENT — DULCE Y JALEO =====
// Este módulo gestiona TODAS las comunicaciones con el backend.
// NUNCA se almacena ni se envía ningún token desde el navegador.

const API_BASE = 'https://dulce-y-jaleo-backend.xm1sa3.easypanel.host';

const DulceAPI = {

    // ─── Airtable (vía proxy seguro) ───

    /** Obtiene todos los registros de las 3 tablas (Facturas, Albaranes, Gastos) */
    async fetchAllRecords() {
        const res = await fetch(`${API_BASE}/api/records`);
        if (!res.ok) throw new Error(`Error del servidor (${res.status})`);
        return res.json(); // { facturas: [], albaranes: [], gastos: [] }
    },

    /** Obtiene registros de una tabla específica: 'FACTURAS' | 'ALBARANES' | 'GASTOS_VARIOS' */
    async fetchTable(tableName) {
        const res = await fetch(`${API_BASE}/api/records/${tableName}`);
        if (!res.ok) throw new Error(`Error cargando ${tableName}: ${res.status}`);
        return res.json();
    },

    /** Crea un registro en una tabla. fields = { key: value, ... } */
    async createRecord(tableName, fields) {
        const res = await fetch(`${API_BASE}/api/records/${tableName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields })
        });
        if (!res.ok) throw new Error(`Error guardando en ${tableName}: ${res.status}`);
        return res.json();
    },

    /** Verifica si el backend está configurado */
    async checkConfig() {
        const res = await fetch(`${API_BASE}/api/config`);
        if (!res.ok) return { baseConfigured: false };
        return res.json();
    },

    // ─── Escaneo de Facturas (Gemini OCR vía backend) ───

    /** Envía una imagen como base64 al backend para escaneo con Gemini */
    async scanInvoice(base64Image, mimeType = 'image/jpeg') {
        const res = await fetch(`${API_BASE}/webhook/scan-invoice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image, mimeType })
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Error escaneando (${res.status}): ${err.substring(0, 250)}`);
        }
        return res.json();
    },

    /** Envía imagen como FormData (retrocompatible con n8n) */
    async scanInvoiceFormData(file) {
        const formData = new FormData();
        formData.append('data', file);
        const res = await fetch(`${API_BASE}/webhook/lovable-webhook`, {
            method: 'POST',
            body: formData
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Error servidor (${res.status}): ${err.substring(0, 250)}`);
        }
        return res.json();
    },

    // ─── Health Check ───

    async health() {
        try {
            const res = await fetch(`${API_BASE}/health`);
            return res.ok;
        } catch {
            return false;
        }
    }
};

// Exponer globalmente
window.DulceAPI = DulceAPI;
