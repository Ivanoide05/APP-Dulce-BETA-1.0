const fs = require('fs');
const path = require('path');

const targetFile = 'c:\\Users\\ivanr\\Desktop\\IA\\Dulce_Jaleo_Proyecto_Completo\\index.html';
let content = fs.readFileSync(targetFile, 'utf8');

// A. FIX JAVASCRIPT CONTEXT FOR SVGs
// 1. textContent -> innerHTML where emojis are injected
content = content.replace(/if \(btn\) btn\.textContent = theme === 'dark' \? '🌙' : '☀️';/g, "if (btn) btn.innerHTML = theme === 'dark' ? '🌙' : '☀️';");
content = content.replace(/btn\.textContent = '✅ ¡Guardado!';/g, "btn.innerHTML = '✅ ¡Guardado!';");
content = content.replace(/setTimeout\(\(\) => \{ btn\.textContent = '💾 Guardar'; \}, 2000\);/g, "setTimeout(() => { btn.innerHTML = '💾 Guardar'; }, 2000);");
content = content.replace(/el\.textContent = '⚠️ ' \+ msg;/g, "el.innerHTML = '⚠️ ' + msg;");
content = content.replace(/document\.getElementById\('margenSub'\)\.textContent = '⚠️ Configura tu token de Airtable \(⚙️\)';/g, "document.getElementById('margenSub').innerHTML = '⚠️ Configura tu token de Airtable (⚙️)';");
content = content.replace(/document\.getElementById\('margenSub'\)\.textContent = '❌ Error al cargar datos: ' \+ err\.message;/g, "document.getElementById('margenSub').innerHTML = '❌ Error al cargar datos: ' + err.message;");

// 2. Remove emojis from native dialogs or Toastify objects that don't render HTML well by default
content = content.replace(/'📝 Escribe una nota para '/g, "'Escribe una nota para '");
content = content.replace(/"⚠️ Este contacto no tiene/g, '"Este contacto no tiene');
content = content.replace(/"📝 Nota guardada/g, '"Nota guardada');


// B. COLORS: DARK MODE & LIGHT MODE to Champagne Gold
content = content.replace(/--accent:\s*#F59E0B;/, '--accent:      #D4AF37;');
content = content.replace(/--accent-dim:\s*rgba\(245,158,11,0\.12\);/, '--accent-dim:  rgba(212, 175, 55, 0.15);');
content = content.replace(/--accent-dark:\s*#D97706;/, '--accent-dark: #C5A059;');
content = content.replace(/--accent:\s*#F59E0B;/, '--accent:      #D4AF37;');
content = content.replace(/--accent-dim:\s*rgba\(245,158,11,0\.15\);/, '--accent-dim:  rgba(212, 175, 55, 0.15);');
content = content.replace(/--accent-dark:\s*#D97706;/, '--accent-dark: #C5A059;');

content = content.replace(/background: rgba\(245, 158, 11, 0\.25\); \/\* Amber Accent \*\//, 'background: rgba(212, 175, 55, 0.45); /* Champagne Gold Accent */');
content = content.replace(/background: rgba\(59, 130, 246, 0\.2\); \/\* Blue Accent \*\//, 'background: rgba(197, 160, 89, 0.35); /* Darker Gold Accent */');
content = content.replace(/background: rgba\(245, 158, 11, 0\.15\);/, 'background: rgba(212, 175, 55, 0.35); /* Champagne Amber */');
content = content.replace(/background: rgba\(59, 130, 246, 0\.1\);/, 'background: rgba(197, 160, 89, 0.25); /* Champagne Peach */');

content = content.replaceAll('rgba(245,158,11', 'rgba(212,175,55');
content = content.replaceAll('rgba(245, 158, 11', 'rgba(212, 175, 55');


// C. NAV BTN HOME CSS
const oldNavCss = `        .nav-btn-home {
            position: relative;
            transform: scale(1.15);
            margin-left: 8px;
            color: var(--accent);
        }
        .nav-btn-home.active {
            color: var(--accent);
            transform: scale(1.2);
            filter: drop-shadow(0 4px 6px rgba(245,158,11,0.25));
        }`;

const newNavCss = `        .nav-btn-home {
            position: relative;
            color: var(--text-muted);
        }
        .nav-btn-home.active {
            color: var(--accent);
            filter: drop-shadow(0 4px 6px rgba(212, 175, 55, 0.25));
        }`;
content = content.replaceAll(oldNavCss, newNavCss);

// D. NAV ORDER (Move Home to Left)
const navRegex = /(<nav(?:.*|\n)*?bottom-nav-inner[^>]*>)\s*([\s\S]*?)<\/nav>/i;
content = content.replace(navRegex, (match, openTags, innerContent) => {
    const newInner = `
            <!-- Inicio -->
            <button class="nav-btn nav-btn-home active" data-tab="dashboard">
                <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" class="lucide lucide-house" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></span>
                <span class="nav-label">Inicio</span>
            </button>

            <!-- Facturas -->
            <button class="nav-btn" data-tab="facturas">
                <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" class="lucide lucide-file-text" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg></span>
                <span class="nav-label">Facturas</span>
            </button>

            <!-- Márgenes -->
            <button class="nav-btn" data-tab="margenes">
                <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" class="lucide lucide-chart-column" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg></span>
                <span class="nav-label">Márgenes</span>
            </button>

            <!-- Agenda -->
            <button class="nav-btn" data-tab="agenda">
                <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" class="lucide lucide-book-user" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><circle cx="12" cy="8" r="2"/><path d="M15 13a3 3 0 1 0-6 0"/></svg></span>
                <span class="nav-label">Agenda</span>
            </button>

            <!-- Hoja de Ruta -->
            <button class="nav-btn" data-tab="hojaruta">
                <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" class="lucide lucide-route" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg></span>
                <span class="nav-label">Ruta</span>
            </button>
        </div>
</nav>`;
    return openTags + newInner;
});

// E. EMOJI -> SVG REPLACEMENT
const rSvg = (d, cls='lucide', props='') => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${cls}" ${props}>${d}</svg>`;

const emojiMap = {
    '⚙️': rSvg('<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>'),
    '🌙': rSvg('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'),
    '☀️': rSvg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>'),
    '📅': rSvg('<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>'),
    '📄': rSvg('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>'),
    '📦': rSvg('<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>'),
    '🏢': rSvg('<rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>'),
    '📭': rSvg('<rect width="16" height="12" x="4" y="8" rx="2"/><path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/><path d="M4 12V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M4 10l8 4 8-4"/><path d="M8.5 4V3a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1"/>'),
    '🔑': rSvg('<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/>'),
    '⚠️': rSvg('<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'),
    '🏭': rSvg('<path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/>'),
    '🛒': rSvg('<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>'),
    '📒': rSvg('<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>'),
    '➕': rSvg('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'),
    '✚': rSvg('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'),
    '✏️': rSvg('<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>'),
    '🗑️': rSvg('<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>'),
    '📞': rSvg('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>'),
    '💬': rSvg('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>'),
    '📊': rSvg('<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>'),
    '👁️': rSvg('<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'),
    '🔥': rSvg('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>'),
    '❌': rSvg('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
    '✅': rSvg('<polyline points="20 6 9 17 4 12"/>'),
    '🚀': rSvg('<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>'),
    '📷': rSvg('<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>'),
    '🖼️': rSvg('<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>'),
    '💰': rSvg('<circle cx="12" cy="12" r="8"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M15 9h-4L9 11l2 2h2l2 2-2 2H9"/>'),
    '📋': rSvg('<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>'),
    '🔄': rSvg('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>'),
    '🔍': rSvg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'),
    '🏗️': rSvg('<path d="M14 14.76V3.5a1.5 1.5 0 0 0-3 0v11.26l-3.5-3.5a1.5 1.5 0 0 0-2.12 2.12l6 6a1.5 1.5 0 0 0 2.12 0l6-6a1.5 1.5 0 0 0-2.12-2.12z"/>'),
    '⏱️': rSvg('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
    '🟠': rSvg('<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>', 'lucide', 'stroke="#F59E0B"'),
    '🔴': rSvg('<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>', 'lucide', 'stroke="#EF4444"'),
    '📈': rSvg('<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>'),
    '💡': rSvg('<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.2 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>'),
    '📍': rSvg('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'),
    '🔗': rSvg('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'),
    '💾': rSvg('<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>'),
    '📝': rSvg('<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>'),
    '💶': rSvg('<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>'),
    '⭐': rSvg('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'),
    '🍞': rSvg('<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>', 'lucide', 'stroke="currentColor"'),
    '✓': rSvg('<polyline points="20 6 9 17 4 12"/>'),
    '✕': rSvg('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
    '⏳': rSvg('<path d="M17.6 15c-1.3-1.6-1.5-2-1.5-3s.2-1.4 1.5-3C18.9 7 19 6 19 5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2c0 1 .1 2 1.4 4 1.3 1.6 1.5 2 1.5 3s-.2 1.4-1.5 3C5.1 17 5 18 5 19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2c0-1-.1-2-1.4-4z"/>')
};

for (const [emoji, svg] of Object.entries(emojiMap)) {
    content = content.split(emoji).join(`<span style="display:inline-flex; align-items:center; justify-content:center; margin-right:4px;">${svg}</span>`);
}

fs.writeFileSync(targetFile, content);
console.log('Fixed and injected SVGs successfully, respecting JS logic!');
