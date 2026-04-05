
    // ===== API CLIENT — DULCE Y JALEO (inlined) =====
    const getApiBase = () => {
        const host = window.location.hostname;
        if (!host || host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3001';
        return 'https://dulce-y-jaleo-backend.xm1sa3.easypanel.host';
    };
    const API_BASE = getApiBase();

    // Proteger la ruta si no hay token (solo si no es login.html)
    if (!localStorage.getItem('auth_token') && !window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html';
    }

    const DulceAPI = {
        async fetchAllRecords() {
            const res = await fetch(`${API_BASE}/api/records`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
            });
            if (!res.ok) throw new Error(`Error del servidor (${res.status})`);
            return res.json();
        },
        async fetchTable(tableName) {
            const res = await fetch(`${API_BASE}/api/records/${tableName}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
            });
            if (!res.ok) throw new Error(`Error cargando ${tableName}: ${res.status}`);
            return res.json();
        },
        async createRecord(tableName, fields) {
            const res = await fetch(`${API_BASE}/api/records/${tableName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({ records: [{ fields }] })
            });
            return res.json();
        },
        async checkConfig() {
            const res = await fetch(`${API_BASE}/api/config`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
            });
            if (!res.ok) return { baseConfigured: false };
            return res.json();
        }
    };
    window.DulceAPI = DulceAPI;
    