// ===== API CLIENT — DULCE Y JALEO =====
// Conexión DUAL: primero intenta el servidor proxy (localhost:3001),
// si no está disponible, conecta DIRECTO a Airtable (fallback).
// Así la app funciona tanto con server como abriendo el archivo directamente.

const API_BASE = (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3001'
    : '';

// Configuración de Tablas (Por defecto, pero se cargan dinámicamente)
const DEFAULT_TABLES = {
    FACTURAS: 'tblLC7oMOUQtRWkn7',
    ALBARANES: 'tblX9EQUmwItNJCZI',
    GASTOS_VARIOS: 'tblHzVIPEde7zWnUv',
    PEDIDOS: '', // Se detectará automáticamente
    AGENDA: ''   // Se detectará automáticamente
};

// Obtener mapeo actual con prioridad a lo guardado en localStorage
function getTablesMap() {
    return {
        FACTURAS: localStorage.getItem('AIRTABLE_TABLE_FACTURAS') || DEFAULT_TABLES.FACTURAS,
        ALBARANES: localStorage.getItem('AIRTABLE_TABLE_ALBARANES') || DEFAULT_TABLES.ALBARANES,
        GASTOS_VARIOS: localStorage.getItem('AIRTABLE_TABLE_GASTOS') || DEFAULT_TABLES.GASTOS_VARIOS,
        PEDIDOS: localStorage.getItem('AIRTABLE_TABLE_PEDIDOS') || DEFAULT_TABLES.PEDIDOS,
        AGENDA: localStorage.getItem('AIRTABLE_TABLE_AGENDA') || DEFAULT_TABLES.AGENDA
    };
}

// Obtener claves efectivas (localStorage)
function getAirtableKeys() {
    const rawToken = (localStorage.getItem('AIRTABLE_API_KEY') || '').trim();
    const rawBase = (localStorage.getItem('AIRTABLE_BASE_ID') || '').trim();
    const cleanBase = rawBase.split('/')[0].split('?')[0].trim();
    return { token: rawToken, baseId: cleanBase };
}

// Helper: construye headers para el backend proxy
function getAuthHeaders(includeContentType = true) {
    const token = localStorage.getItem('auth_token');
    const keys = getAirtableKeys();
    const headers = {};
    if (includeContentType) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (keys.token) headers['x-airtable-token'] = keys.token;
    if (keys.baseId) headers['x-airtable-base-id'] = keys.baseId;
    return headers;
}

// ─── CONEXIÓN DIRECTA A AIRTABLE ───
async function airtableDirectFetch(tableId) {
    const keys = getAirtableKeys();
    if (!keys.token || !keys.baseId) throw new Error('Claves no configuradas');

    const url = `https://api.airtable.com/v0/${keys.baseId}/${tableId}`;
    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${keys.token}`,
            'Content-Type': 'application/json'
        }
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) throw new Error('Token no autorizado');
        if (res.status === 404) throw new Error('Base ID o Tabla incorrectos');
        throw new Error(data.error?.message || `Airtable error (${res.status})`);
    }
    return res.json();
}

async function serverIsAvailable() {
    try {
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 1500);
        const res = await fetch(`${API_BASE}/health`, { signal: ctrl.signal });
        clearTimeout(timeout);
        return res.ok;
    } catch { return false; }
}

function handle401(res) {
    if (res.status === 401) {
        if (window.location.protocol === 'file:' || window.location.hostname === 'localhost') return 'fallback';
        localStorage.removeItem('auth_token');
        window.location.href = '/login.html';
        throw new Error('Sesión expirada');
    }
    return 'ok';
}
const DulceAPI = {
    API_BASE,

    /** Auto-Descubrimiento de Tablas vía API de Metadatos */
    async discoverTables(token, baseId) {
        if (!token || !baseId) throw new Error('Token y Base ID requeridos');
        const cleanBase = baseId.split('/')[0].split('?')[0].trim();
        const url = `https://api.airtable.com/v0/meta/bases/${cleanBase}/tables`;
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error(`Error detectando tablas (${res.status})`);
        const data = await res.json();
        const found = {};
        data.tables.forEach(t => {
            const name = t.name.toUpperCase();
            if (name.includes('FACTURA')) found.FACTURAS = t.id;
            if (name.includes('ALBARAN')) found.ALBARANES = t.id;
            if (name.includes('GASTO') || name.includes('VARIOS')) found.GASTOS_VARIOS = t.id;
            if (name.includes('PEDIDO') || name.includes('ORDER') || name.includes('RUTA')) found.PEDIDOS = t.id;
            if (name.includes('AGENDA') || name.includes('CLIENTE')) found.AGENDA = t.id;
        });
        if (found.FACTURAS) localStorage.setItem('AIRTABLE_TABLE_FACTURAS', found.FACTURAS);
        if (found.ALBARANES) localStorage.setItem('AIRTABLE_TABLE_ALBARANES', found.ALBARANES);
        if (found.GASTOS_VARIOS) localStorage.setItem('AIRTABLE_TABLE_GASTOS', found.GASTOS_VARIOS);
        if (found.PEDIDOS) localStorage.setItem('AIRTABLE_TABLE_PEDIDOS', found.PEDIDOS);
        if (found.AGENDA) localStorage.setItem('AIRTABLE_TABLE_AGENDA', found.AGENDA);
        return found;
    },

    async testConnection(token, baseId) {
        if (!token || !baseId) throw new Error('Token y Base ID requeridos');
        const map = getTablesMap();
        const url = `https://api.airtable.com/v0/${baseId}/${map.FACTURAS || 'tblTest'}?maxRecords=1`;
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        return res.ok;
    },

    /** Obtiene todos los registros usando el proxy del server (con fallback directo) */
    async fetchAllRecords() {
        try {
            const serverOk = await serverIsAvailable();
            if (serverOk) {
                const res = await fetch(`${API_BASE}/api/records`, { headers: getAuthHeaders() });
                if (res.ok) return res.json();
                if (res.status === 401) handle401(res);
            }
        } catch (e) {}
        const map = getTablesMap();
        const tasks = [
            airtableDirectFetch(map.FACTURAS),
            airtableDirectFetch(map.ALBARANES),
            airtableDirectFetch(map.GASTOS_VARIOS)
        ];
        if (map.PEDIDOS) tasks.push(airtableDirectFetch(map.PEDIDOS));
        // Si Agenda está en el mapa, será el índice 4
        if (map.AGENDA) tasks.push(airtableDirectFetch(map.AGENDA));
        
        const results = await Promise.all(tasks);
        
        // El array results puede tener 3, 4 o 5 elementos dependiendo de si Pedidos y Agenda existen.
        // Para asegurar seguridad, buscamos índices usando la longitud final
        let resPedidos = [], resAgenda = [];
        if (map.PEDIDOS && map.AGENDA) { resPedidos = results[3]; resAgenda = results[4]; }
        else if (map.PEDIDOS && !map.AGENDA) { resPedidos = results[3]; }
        else if (!map.PEDIDOS && map.AGENDA) { resAgenda = results[3]; }

        return { 
            facturas: results[0].records || [], 
            albaranes: results[1].records || [], 
            gastos: results[2].records || [],
            pedidos: resPedidos.records || [],
            agenda: resAgenda.records || []
        };
    },

    /** Obtiene una tabla específica */
    async fetchTable(tableName) {
        try {
            const serverOk = await serverIsAvailable();
            if (serverOk) {
                const res = await fetch(`${API_BASE}/api/records/${tableName}`, { headers: getAuthHeaders() });
                if (res.ok) return res.json();
            }
        } catch(e) {}
        const map = getTablesMap();
        const tableId = map[tableName.toUpperCase()];
        if (!tableId) throw new Error('Tabla no encontrada: ' + tableName);
        return airtableDirectFetch(tableId);
    },

    /** Crea un registro (Proxy / Direct Fallback) */
    async createRecord(tableName, fields) {
        try {
            const serverOk = await serverIsAvailable();
            if (serverOk) {
                const res = await fetch(`${API_BASE}/api/records/${tableName}`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ fields })
                });
                if (res.ok) return res.json();
            }
        } catch(e) {}
        // Fallback directo a Airtable
        const keys = getAirtableKeys();
        const map = getTablesMap();
        const tableId = map[tableName.toUpperCase()];
        const url = `https://api.airtable.com/v0/${keys.baseId}/${tableId}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${keys.token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields })
        });
        if (!res.ok) throw new Error('Error al guardar directamente en Airtable');
        return res.json();
    },

    /** Actualiza un registro (PATCH) */
    async updateRecord(tableName, recordId, fields) {
        try {
            const serverOk = await serverIsAvailable();
            if (serverOk) {
                const res = await fetch(`${API_BASE}/api/records/${tableName}/${recordId}`, {
                    method: 'PATCH',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ fields })
                });
                if (res.ok) return res.json();
            }
        } catch(e) {}
        // Fallback directo a Airtable
        const keys = getAirtableKeys();
        const map = getTablesMap();
        const tableId = map[tableName.toUpperCase()];
        const url = `https://api.airtable.com/v0/${keys.baseId}/${tableId}/${recordId}`;
        const res = await fetch(url, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${keys.token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields })
        });
        if (!res.ok) throw new Error('Error al actualizar registro en Airtable');
        return res.json();
    },

    /** ESCÁNER: Procesa imagen con IA Gemini (Requiere Servidor) */
    async scanInvoice(base64Image, mimeType = 'image/jpeg') {
        const res = await fetch(`${API_BASE}/webhook/scan-invoice`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ image: base64Image, mimeType })
        });
        if (res.status === 401) handle401(res);
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Fallo en escáner (${res.status}): ${err.substring(0, 100)}`);
        }
        return res.json();
    },

    /** Login y obtención de JWT */
    async login(email, password) {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) throw new Error('Credenciales incorrectas');
        const data = await res.json();
        if (data.token) localStorage.setItem('auth_token', data.token);
        return data;
    },

    /** Fetch genérico con token */
    async authFetch(url, options = {}) {
        const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
        const res = await fetch(fullUrl, {
            ...options,
            headers: { ...getAuthHeaders(), ...(options.headers || {}) }
        });
        if (res.status === 401) handle401(res);
        return res;
    }
};

window.DulceAPI = DulceAPI;
