const fs = require('fs');
let txt = fs.readFileSync('C:\\Users\\ivanr\\Desktop\\IA\\Dulce_Jaleo_Proyecto_Completo\\DULCE_JALEO_BASE_BETA\\index.html', 'utf8');

const startStr = '// ===== API CLIENT — DULCE Y JALEO (inlined) =====';
const startIdx = txt.indexOf(startStr);
if (startIdx === -1) {
    console.log("Error: startStr no encontrado.");
    process.exit(1);
}

// Buscar el final de DulceAPI, que debería ser el cierre `    };` después de checkConfig
const endStr = '    };';
const endIdx = txt.indexOf(endStr, startIdx + 100);

if (endIdx === -1) {
    console.log("Error: endStr no encontrado.");
    process.exit(1);
}

const snippetToReplace = txt.substring(startIdx, endIdx + endStr.length);

const authSnippet = `// ===== API CLIENT — DULCE Y JALEO (inlined) =====
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
            const res = await fetch(\`\${API_BASE}/api/records\`, {
                headers: { 'Authorization': \`Bearer \${localStorage.getItem('auth_token')}\` }
            });
            if (!res.ok) throw new Error(\`Error del servidor (\${res.status})\`);
            return res.json();
        },
        async fetchTable(tableName) {
            const res = await fetch(\`\${API_BASE}/api/records/\${tableName}\`, {
                headers: { 'Authorization': \`Bearer \${localStorage.getItem('auth_token')}\` }
            });
            if (!res.ok) throw new Error(\`Error cargando \${tableName}: \${res.status}\`);
            return res.json();
        },
        async createRecord(tableName, fields) {
            const res = await fetch(\`\${API_BASE}/api/records/\${tableName}\`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': \`Bearer \${localStorage.getItem('auth_token')}\`
                },
                body: JSON.stringify({ records: [{ fields }] })
            });
            return res.json();
        },
        async checkConfig() {
            const res = await fetch(\`\${API_BASE}/api/config\`, {
                headers: { 'Authorization': \`Bearer \${localStorage.getItem('auth_token')}\` }
            });
            if (!res.ok) return { baseConfigured: false };
            return res.json();
        }
    };`;

txt = txt.substring(0, startIdx) + authSnippet + txt.substring(endIdx + endStr.length);
fs.writeFileSync('C:\\Users\\ivanr\\Desktop\\IA\\Dulce_Jaleo_Proyecto_Completo\\DULCE_JALEO_BASE_BETA\\index.html', txt, 'utf8');
console.log('REMPLAZO FINAL SATISFACTORIO');
