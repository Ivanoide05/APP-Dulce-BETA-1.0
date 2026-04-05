// Configuración dinámica del API_BASE (Local Host, Vercel o File://)
const getApiBase = () => {
    const host = window.location.hostname;
    // Si estamos en Vercel, usamos rutas relativas
    if (host.includes('vercel.app')) return '';
    // Si estamos en Localhost o abriendo archivo directo, conectamos al puerto 3001
    return 'http://localhost:3001';
};

const API_BASE = getApiBase();

// Helper: construye headers con autorización
function getAuthHeaders(includeContentType = true) {
    const token = localStorage.getItem('auth_token');
    const headers = {};
    if (includeContentType) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return headers;
}

// Helper: gestiona respuestas 401 (sesión expirada)
function handle401(res) {
    if (res.status === 401) {
        localStorage.removeItem('auth_token');
        // Redirección relativa para soportar apertura desde archivos locales
        window.location.href = 'login.html';
        throw new Error('Sesión expirada');
    }
}

const DulceAPI = {
    API_BASE: API_BASE,
    getHeaders: getAuthHeaders,

    // ─── Airtable (vía proxy seguro) ───

    /** Obtiene todos los registros de las 3 tablas (Facturas, Albaranes, Gastos) */
    async fetchAllRecords() {
        const res = await fetch(`${API_BASE}/api/records`, {
            headers: getAuthHeaders()
        });
        handle401(res);
        if (!res.ok) throw new Error(`Error del servidor (${res.status})`);
        return res.json(); // { facturas: [], albaranes: [], gastos: [] }
    },

    /** Obtiene registros de una tabla específica: 'FACTURAS' | 'ALBARANES' | 'GASTOS_VARIOS' */
    async fetchTable(tableName) {
        const res = await fetch(`${API_BASE}/api/records/${tableName}`, {
            headers: getAuthHeaders()
        });
        handle401(res);
        if (!res.ok) throw new Error(`Error cargando ${tableName}: ${res.status}`);
        return res.json();
    },

    /** Crea un registro en una tabla. fields = { key: value, ... } */
    async createRecord(tableName, fields) {
        const res = await fetch(`${API_BASE}/api/records/${tableName}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ fields })
        });
        handle401(res);
        if (!res.ok) throw new Error(`Error guardando en ${tableName}: ${res.status}`);
        return res.json();
    },

    /** Verifica si el backend está configurado */
    async checkConfig() {
        const res = await fetch(`${API_BASE}/api/config`, {
            headers: getAuthHeaders()
        });
        handle401(res);
        if (!res.ok) return { baseConfigured: false };
        return res.json();
    },

    // ─── Escaneo de Facturas (Gemini OCR vía backend) ───

    /** Envía una imagen como base64 al backend para escaneo con Gemini */
    async scanInvoice(base64Image, mimeType = 'image/jpeg') {
        const res = await fetch(`${API_BASE}/webhook/scan-invoice`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ image: base64Image, mimeType })
        });
        handle401(res);
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
        // FormData: no incluir Content-Type (el navegador lo pone con boundary)
        const token = localStorage.getItem('auth_token');
        const headers = {};
        if (token) headers['Authorization'] = 'Bearer ' + token;
        const res = await fetch(`${API_BASE}/webhook/lovable-webhook`, {
            method: 'POST',
            headers: headers,
            body: formData
        });
        handle401(res);
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Error servidor (${res.status}): ${err.substring(0, 250)}`);
        }
        return res.json();
    },

    /** Login: obtiene JWT a través del backend */
    async login(email, password) {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
            throw new Error(err.error || 'Fallo en la autenticación');
        }
        const data = await res.json();
        if (data.token) localStorage.setItem('auth_token', data.token);
        return data;
    },

    /** Fetch genérico con token JWT incluido */
    async authFetch(url, options = {}) {
        const fullUrl = (url.startsWith('http') || url.startsWith('/')) ? `${API_BASE}${url}` : `${API_BASE}/${url}`;
        const res = await fetch(fullUrl, {
            ...options,
            headers: { ...getAuthHeaders(), ...(options.headers || {}) }
        });
        handle401(res);
        return res;
    },

    // ─── Health Check ───

    async health() {
        try {
            const res = await fetch(`${API_BASE}/health`, {
                headers: getAuthHeaders()
            });
            return res.ok;
        } catch {
            return false;
        }
    }
};

// Exponer globalmente
window.DulceAPI = DulceAPI;
