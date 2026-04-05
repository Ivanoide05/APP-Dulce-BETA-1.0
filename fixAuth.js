const fs = require('fs');
const path = require('path');

// Leer el HTML real del socio (Copia de git show socio/main)
const htmlPath = path.join(__dirname, 'socio_main_index.html');
let txt = fs.readFileSync(htmlPath, 'utf8');

// Regex para encontrar el bloque de la API inyectada (las llamadas dummy de DulceAPI)
const regex = /const API_BASE = 'https:\/\/dulce-y-jaleo-backend\.xm1sa3\.easypanel\.host';[\s\S]*?createRecord[\s\S]*?return res\.json\(\);\s*\}\s*\};/;

const authSnippet = `const getApiBase = () => {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '') return 'http://localhost:3001';
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
    }
};`;

txt = txt.replace(regex, authSnippet);

// Escribir en la carpeta final DULCE_JALEO_BASE_BETA
const outPath = path.join(__dirname, 'DULCE_JALEO_BASE_BETA', 'index.html');
fs.writeFileSync(outPath, txt, 'utf8');
console.log('FUSION COMPLETADA CORRECTAMENTE');
