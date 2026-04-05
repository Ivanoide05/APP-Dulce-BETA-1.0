const fs = require('fs');
const targetFile = 'c:\\Users\\ivanr\\Desktop\\IA\\Dulce_Jaleo_Proyecto_Completo\\index.html';
let content = fs.readFileSync(targetFile, 'utf8');
let changes = 0;

// ============================================================
// 1. REPLACE BOTTOM NAV HTML (lines ~1964-2001)
// ============================================================
const oldNavStart = '<!-- BOTTOM NAVIGATION -->';
const oldNavEnd = '</nav>';
const navStartIdx = content.indexOf(oldNavStart);
const navEndIdx = content.indexOf(oldNavEnd, navStartIdx);

if (navStartIdx === -1 || navEndIdx === -1) {
    console.error('Could not find BOTTOM NAVIGATION markers');
    process.exit(1);
}

const newNav = `<!-- BOTTOM NAVIGATION -->
    <nav class="bottom-nav">
        <div class="bottom-nav-inner">
            <!-- 1. Inicio (izquierda, icono grande) -->
            <button class="nav-btn nav-btn-home active" data-tab="dashboard">
                <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></span>
                <span class="nav-label">Inicio</span>
            </button>

            <!-- 2. Facturas -->
            <button class="nav-btn" data-tab="facturas">
                <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></span>
                <span class="nav-label">Facturas</span>
            </button>

            <!-- 3. Márgenes -->
            <button class="nav-btn" data-tab="margenes">
                <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg></span>
                <span class="nav-label">Márgenes</span>
            </button>

            <!-- 4. Agenda -->
            <button class="nav-btn" data-tab="agenda">
                <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
                <span class="nav-label">Agenda</span>
            </button>

            <!-- 5. Hoja de Ruta -->
            <button class="nav-btn" data-tab="hojaruta">
                <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg></span>
                <span class="nav-label">Ruta</span>
            </button>
        </div>
    </nav>`;

content = content.substring(0, navStartIdx) + newNav + content.substring(navEndIdx + oldNavEnd.length);
changes++;
console.log('✅ 1. Bottom nav HTML replaced');

// ============================================================
// 2. RENAME tab-alertas → tab-hojaruta
// ============================================================
content = content.replace('id="tab-alertas"', 'id="tab-hojaruta"');
changes++;
console.log('✅ 2. tab-alertas → tab-hojaruta');

// Update the section titles inside the hojaruta tab
content = content.replace(
    '<div class="section-title">Alertas</div>\r\n            <div class="section-subtitle">Avisos inteligentes de tu negocio</div>',
    '<div class="section-title">Hoja de Ruta</div>\r\n            <div class="section-subtitle">Alertas y seguimiento de tu negocio</div>'
);
changes++;
console.log('✅ 3. Section titles updated');

// ============================================================
// 3. ADD .nav-btn-home CSS (after existing .nav-btn.active rules)
// ============================================================
const navBtnHomeCss = `
        /* Home button: slightly larger icon */
        .nav-btn-home .nav-icon svg {
            width: 28px;
            height: 28px;
        }
        .nav-btn-home {
            position: relative;
            color: var(--text-muted);
        }
        .nav-btn-home.active {
            color: var(--accent);
        }
        .nav-btn-home.active .nav-icon {
            filter: drop-shadow(0 2px 6px rgba(212, 175, 55, 0.3));
        }
`;

const insertAfter = '.nav-btn.active .nav-icon  { transform:scale(1.1); }';
content = content.replace(insertAfter, insertAfter + navBtnHomeCss);
changes++;
console.log('✅ 4. .nav-btn-home CSS added');

// ============================================================
// 4. REMOVE FAB CSS (nav-fab-wrapper, nav-fab, nav-btn-fab etc.)
// ============================================================
// Remove the .nav-btn-fab block
const fabCssStart = '        .nav-btn-fab {';
const fabCssEnd = "        .nav-fab-label {\n            font-size: 10px;\n            font-weight: 700;\n            color: var(--accent);\n            letter-spacing: 0.2px;\n        }";

// Use a regex to remove all fab-related CSS blocks
content = content.replace(/\s*\/\* ===== ELEVATED FAB SCANNER ===== \*\/[\s\S]*?\.nav-fab:active\s*\{[^}]*\}/g, '');
changes++;
console.log('✅ 5. FAB scanner CSS removed');

// ============================================================
// 5. UPDATE JS routing: remove nav-btn-fab references
// ============================================================
content = content.replace(
    "document.querySelectorAll('.nav-btn-fab').forEach(b => b.classList.remove('active'));",
    "// FAB removed"
);
content = content.replace(
    "const activeFab = document.querySelector('.nav-btn-fab[data-tab=\"' + tabId + '\"]');",
    "// FAB removed"
);
content = content.replace(
    "if (activeFab) activeFab.classList.add('active');",
    "// FAB removed"
);
changes++;
console.log('✅ 6. JS FAB references removed');

// Fix the fabBtn listener — keep it but handle gracefully
content = content.replace(
    "document.getElementById('fabBtn').addEventListener('click', () => activateTab('scanner'));",
    "// fabBtn removed from nav, scanner accessible from dashboard"
);
changes++;
console.log('✅ 7. fabBtn listener neutralized');

// ============================================================
// 6. Make sure activateTab handles 'hojaruta' properly
//    (it already works generically via data-tab matching)
// ============================================================

// ============================================================
// 7. Set default tab to dashboard on load
// ============================================================
// Already: activateTab('dashboard'); — no change needed

// ============================================================
// WRITE
// ============================================================
fs.writeFileSync(targetFile, content);
console.log(`\n🎉 Done! Applied ${changes} change groups successfully.`);
