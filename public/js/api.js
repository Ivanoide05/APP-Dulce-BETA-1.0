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
    GASTOS_VARIOS: 'tblHzVIPEde7zWnUv'
};

// Obtener mapeo actual con prioridad a lo guardado en localStorage
function getTablesMap() {
    return {
        FACTURAS: localStorage.getItem('AIRTABLE_TABLE_FACTURAS') || DEFAULT_TABLES.FACTURAS,
        ALBARANES: localStorage.getItem('AIRTABLE_TABLE_ALBARANES') || DEFAULT_TABLES.ALBARANES,
        GASTOS_VARIOS: localStorage.getItem('AIRTABLE_TABLE_GASTOS') || DEFAULT_TABLES.GASTOS_VARIOS
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

    /** Auto-Descubrimiento de Tablas vía API de Metadatos */
    async discoverTables(token, baseId) {
        if (!token || !baseId) throw new Error('Token y Base ID requeridos');
        const cleanBase = baseId.split('/')[0].split('?')[0].trim();
        
        // Airtable Metadata API (Requiere scope schema.bases:read)
        const url = `https://api.airtable.com/v0/meta/bases/${cleanBase}/tables`;
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
            if (res.status === 403) throw new Error('Token sin permiso schema.bases:read');
            throw new Error(`Error detectando tablas (${res.status})`);
        }
        
        const data = await res.json(); // { tables: [ { id, name, ... }, ... ] }
        const found = {};
        
        data.tables.forEach(t => {
            const name = t.name.toUpperCase();
            if (name.includes('FACTURA')) found.FACTURAS = t.id;
            if (name.includes('ALBARAN')) found.ALBARANES = t.id;
            if (name.includes('GASTO') || name.includes('VARIOS')) found.GASTOS_VARIOS = t.id;
        });

        if (!found.FACTURAS) throw new Error('No se encontró la tabla de FACTURAS por nombre.');
        
        // Guardar persistente
        localStorage.setItem('AIRTABLE_TABLE_FACTURAS', found.FACTURAS);
        if (found.ALBARANES) localStorage.setItem('AIRTABLE_TABLE_ALBARANES', found.ALBARANES);
        if (found.GASTOS_VARIOS) localStorage.setItem('AIRTABLE_TABLE_GASTOS', found.GASTOS_VARIOS);
        
        return found;
    },

    async testConnection(token, baseId) {
        if (!token || !baseId) throw new Error('Token y Base ID requeridos');
        const cleanBase = baseId.split('/')[0].split('?')[0].trim();
        const map = getTablesMap();
        const url = `https://api.airtable.com/v0/${cleanBase}/${map.FACTURAS}?maxRecords=1`;
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            if (res.status === 401) throw new Error('Token no autorizado');
            if (res.status === 404) throw new Error('Tabla o Base no encontrada');
            throw new Error(`Error (${res.status})`);
        }
        return true;
    },

    async fetchAllRecords() {
        const keys = getAirtableKeys();
        if (!keys.token || !keys.baseId) return { facturas: [], albaranes: [], gastos: [] };

        try {
            const serverOk = await serverIsAvailable();
            if (serverOk) {
                const res = await fetch(`${API_BASE}/api/records`, { headers: getAuthHeaders() });
                if (handle401(res) !== 'fallback' && res.ok) return res.json();
            }
        } catch (e) { /* server fail -> fallback */ }

        const map = getTablesMap();
        try {
            const [facturas, albaranes, gastos] = await Promise.all([
                airtableDirectFetch(map.FACTURAS),
                airtableDirectFetch(map.ALBARANES),
                airtableDirectFetch(map.GASTOS_VARIOS)
            ]);
            return {
                facturas: facturas.records || [],
                albaranes: albaranes.records || [],
                gastos: gastos.records || []
            };
        } catch (err) { throw err; }
    }
};

window.DulceAPI = DulceAPI;
