/**
 * dashboard.js - El motor de analítica premium para Dulce y Jaleo
 * Recuperado de la APP MAESTRA (v3.0) para restaurar gráficas y métricas.
 */

function getDetailedAnalytics() {
    const CACHE_KEY = 'dulce_jaleo_analytics';
    const all = (globalStats && globalStats.allRecords) ? globalStats.allRecords : [];

    if (all.length === 0) {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) return JSON.parse(cached);
        } catch(e) {}
        return { trend: [0,0,0,0,0,0,0], activity: [0,0,0,0,0,0,0], distribution: [0,0,0], topProveedores: [], dayLabels: [] };
    }

    const now    = new Date();
    const mesStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

    const mes1Date = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const mes2Date = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const mes1Str  = mes1Date.getFullYear() + '-' + String(mes1Date.getMonth() + 1).padStart(2, '0');
    const mes2Str  = mes2Date.getFullYear() + '-' + String(mes2Date.getMonth() + 1).padStart(2, '0');

    const diasEnMes    = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyCurrent = new Array(diasEnMes).fill(0);
    let prevMonthTotal = 0, prev2MonthTotal = 0;

    const trendCube    = [0, 0, 0, 0, 0, 0, 0];
    const activityCube = [0, 0, 0, 0, 0, 0, 0];
    const distMap      = { FACTURA: 0, ALBARAN: 0, GASTOS_VARIOS: 0 };
    const provMap      = {};

    // Etiquetas de día para el eje X (L M X J V S D)
    const DIAS = ['D','L','M','X','J','V','S'];
    const dayLabels = [];
    for (let d = 6; d >= 0; d--) {
        const dd = new Date(now); dd.setDate(dd.getDate() - d);
        dayLabels.push(d === 0 ? 'Hoy' : DIAS[dd.getDay()]);
    }

    for (let i = 0; i < all.length; i++) {
        const rec = all[i];
        const scanDate = rec.createdAt || '';
        if (!scanDate) continue;

        const recDate = new Date(scanDate);
        if (isNaN(recDate.getTime())) continue;

        const diffDays = Math.floor((now - recDate) / 86400000);
        if (diffDays >= 0 && diffDays <= 6) {
            const idx = 6 - diffDays;
            trendCube[idx]    += (rec.total || 0);
            activityCube[idx] += 1;
        }

        if (scanDate.startsWith(mesStr)) {
            const origenNorm = (rec.origen || '').toUpperCase();
            if (origenNorm === 'FACTURA' || origenNorm === 'FACTURAS')         distMap.FACTURA       += (rec.total || 0);
            else if (origenNorm === 'ALBARAN' || origenNorm === 'ALBARANES')   distMap.ALBARAN       += (rec.total || 0);
            else if (origenNorm.includes('GASTO'))                             distMap.GASTOS_VARIOS += (rec.total || 0);
            const prov = rec.proveedor || 'Sin nombre';
            if (prov !== 'Desconocido') {
                provMap[prov] = (provMap[prov] || 0) + (rec.total || 0);
            }
            const dayIdx = recDate.getDate() - 1;
            if (dayIdx >= 0 && dayIdx < diasEnMes) dailyCurrent[dayIdx] += (rec.total || 0);
        }
        if (scanDate.startsWith(mes1Str)) prevMonthTotal  += (rec.total || 0);
        if (scanDate.startsWith(mes2Str)) prev2MonthTotal += (rec.total || 0);
    }

    const distTotal = distMap.FACTURA + distMap.ALBARAN + distMap.GASTOS_VARIOS || 1;
    const distribution = [
        Math.round((distMap.FACTURA      / distTotal) * 100),
        Math.round((distMap.ALBARAN       / distTotal) * 100),
        Math.round((distMap.GASTOS_VARIOS / distTotal) * 100)
    ];
    const distRaw = [distMap.FACTURA, distMap.ALBARAN, distMap.GASTOS_VARIOS];

    const topProveedores = Object.entries(provMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([nombre, valor]) => ({
            nombre: nombre.length > 11 ? nombre.substring(0, 9) + '…' : nombre,
            valor: Math.round(valor)
        }));

    const mesActualTotal = distMap.FACTURA + distMap.ALBARAN + distMap.GASTOS_VARIOS;
    const result = { trend: trendCube, activity: activityCube, distribution, distRaw, topProveedores, dayLabels, dailyCurrent, prevMonthTotal, prev2MonthTotal, mesActualTotal, diasEnMes };
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(result)); } catch(e) {}
    return result;
}

/**
 * renderMiniChart - Generador de gráficas SVG de alto rendimiento
 */
function renderMiniChart(elementId, data, color = '#D4AF37', unit = '€', type = 'line', options = {}) {
    const container = document.getElementById(elementId);
    if (!container) return;

    const width = container.offsetWidth || 200;
    let height = container.offsetHeight || 88;
    const padding = 12;
    const chartHeight = height - 15;
    
    if (!data || data.length < 2) data = [0, 0, 0, 0, 0, 0, 0];
    const days = options.labels || ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

    const max = Math.max(...data) || 1;
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    const avgY = chartHeight - ((avg - min) / range * (chartHeight - padding * 2) + padding);

    let pathData = '';
    let labelsSVG = '';
    let barsSVG = '';

    data.forEach((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = chartHeight - ((val - min) / range * (chartHeight - padding * 2) + padding);
        
        if (type === 'line') {
            if (i === 0) pathData = `M 0 ${y}`;
            else pathData += ` L ${x} ${y}`;
        } else if (type === 'bar') {
            const barW = (width / data.length) * 0.7;
            const barX = x - barW/2;
            barsSVG += `<rect x="${barX}" y="${y}" width="${barW}" height="${chartHeight - y}" fill="${color}" rx="4" style="opacity:0.8" />`;
        }
        
        if (days[i] && i % (isMobile ? 2 : 1) === 0) {
            labelsSVG += `<text x="${x}" y="${height - 2}" font-size="9" fill="var(--text-muted)" text-anchor="middle" font-weight="600">${days[i]}</text>`;
        }
    });

    const svg = `
        <svg width="100%" height="${height}" preserveAspectRatio="none" style="overflow: visible;">
            <defs>
                <linearGradient id="grad-${elementId}" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:${color};stop-opacity:0.3" />
                    <stop offset="100%" style="stop-color:${color};stop-opacity:0" />
                </linearGradient>
            </defs>
            <line x1="0" y1="${avgY}" x2="${width}" y2="${avgY}" stroke="${color}" stroke-opacity="0.2" stroke-dasharray="2,2" />
            ${type === 'line' ? `
                <path d="${pathData} L ${width} ${chartHeight} L 0 ${chartHeight} Z" fill="url(#grad-${elementId})" />
                <path d="${pathData}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" />
            ` : barsSVG}
            ${labelsSVG}
        </svg>
    `;
    
    container.innerHTML = svg;
}

function updateDashboardPremium() {
    if (!globalStats.loaded) return;

    const analytics = getDetailedAnalytics();

    // Badge dinámico vs mes anterior
    const badgeEl = document.querySelector('.bento-trend');
    if (badgeEl) {
        if (analytics.mesActualTotal > 0 && analytics.prevMonthTotal > 0) {
            const deltaPct = ((analytics.mesActualTotal - analytics.prevMonthTotal) / analytics.prevMonthTotal * 100).toFixed(1);
            const isUp = deltaPct >= 0;
            badgeEl.className = 'bento-trend ' + (isUp ? 'trend-up' : 'trend-down');
            badgeEl.style.display = '';
            badgeEl.innerHTML = `<i data-lucide="${isUp ? 'arrow-up-right' : 'arrow-down-right'}" style="width:12px;"></i><span>${isUp ? '+' : ''}${deltaPct}% vs mes anterior</span>`;
        } else if (analytics.mesActualTotal > 0) {
            badgeEl.className = 'bento-trend';
            badgeEl.style.display = '';
            badgeEl.innerHTML = `<span>Mes nuevo</span>`;
        } else {
            badgeEl.style.display = 'none';
        }
        if (window.lucide) lucide.createIcons();
    }

    // Render 4 tarjetas KPI del carrusel (definidas en index.html inline)
    if (typeof renderCarousel1Proyeccion === 'function') renderCarousel1Proyeccion(analytics);
    if (typeof renderCarousel2TopProveedores === 'function') renderCarousel2TopProveedores(analytics);
    if (typeof renderCarousel3ProveedorTop === 'function') renderCarousel3ProveedorTop(analytics);
    if (typeof renderCarousel4Comparativa === 'function') renderCarousel4Comparativa(analytics);

    if (typeof initCarouselDots === 'function') initCarouselDots();
}

/**
 * GEMA AI: Auditoría de Gastos y Mermas
 */
async function ejecutarAuditoriaGema() {
    const btn = document.getElementById('btn-gema-audit');
    const badge = document.getElementById('margenHealthBadge');
    const resultsContainer = document.getElementById('gema-results-container');
    const insightsGrid = document.getElementById('gema-insights-grid');

    if (!btn || !globalStats.loaded) {
        alert("Faltan datos de Airtable. Espera a que carguen.");
        return;
    }

    // UI Loading State
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader" class="spin" style="width: 18px;"></i> Analizando proveedores...`;
    if (window.lucide) lucide.createIcons();

    // 1. Recopilar Gastos del mes actual
    const analytics = getDetailedAnalytics(); // uses allRecords up to 6 days for trends, but we need expenses of current month
    // So let's manually filter the current month's expenses and mermas
    const now = new Date();
    const mesStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    const all = (globalStats && globalStats.allRecords) ? globalStats.allRecords : [];
    
    // Obtenemos solo facturas y gastos
    const expenses = all.filter(r => {
        if (!r.createdAt || !r.createdAt.startsWith(mesStr)) return false;
        const cat = (r.categoria || '').toUpperCase();
        return cat.includes('FACTURA') || cat.includes('GASTO');
    }).map(r => ({
        proveedor: r.proveedor,
        fecha: r.createdAt,
        total: r.total,
        detalles: r.detalles || ''
    }));

    // Recopilar Mermas del month actual
    let mermas = [];
    try {
        const storedMermas = JSON.parse(localStorage.getItem('dulce_mermas') || '[]');
        mermas = storedMermas.filter(m => m.fecha && m.fecha.startsWith(mesStr));
    } catch(e) {}

    try {
        // Enviar a la API de Gema
        const response = await fetch(`${window.DulceAPI.API_BASE}/api/ai/analyze-expenses`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ expenses, mermas })
        });

        if (!response.ok) throw new Error("Fallo en Gema API");
        const data = await response.json();

        if (!data.success || !data.insights) throw new Error("Respuesta inválida de Gema");

        const insights = data.insights;

        // Limpiar contenedor
        insightsGrid.innerHTML = '';
        
        // Fuga principal Card
        insightsGrid.innerHTML += `
            <div style="background: rgba(228,0,0,0.05); border: 1px solid rgba(228,0,0,0.2); border-radius: 12px; padding: 16px;">
                <div style="font-size: 11px; color: #ef4444; font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">Punto Crítico Detectado</div>
                <div style="font-size: 16px; font-weight: 700; color: var(--text-primary);"><i data-lucide="alert-triangle" style="width: 14px; display: inline-block; margin-right: 4px; color: #ef4444;"></i>${insights.fugaPrincipal || 'Sin definir'}</div>
            </div>
        `;

        // Recomendaciones Cards
        if (insights.recomendaciones && insights.recomendaciones.length > 0) {
            insights.recomendaciones.forEach((rec, idx) => {
                insightsGrid.innerHTML += `
                    <div style="background: var(--bg-card); border: 1px solid var(--border); border-left: 3px solid var(--gold); border-radius: 12px; padding: 16px; box-shadow: var(--shadow-sm); transition: transform 0.2s;">
                        <div style="font-size: 11px; color: var(--gold); font-weight: 800; margin-bottom: 6px;">CONSEJO #${idx+1}</div>
                        <div style="font-size: 14px; font-weight: 500; color: var(--text-primary); line-height: 1.4;">${rec}</div>
                    </div>
                `;
            });
        }

        // Mostrar UI
        resultsContainer.style.display = 'block';
        
        // Update Badge
        if (badge) {
            badge.className = "margen-health-indicator";
            badge.style.background = "rgba(16, 185, 129, 0.1)";
            badge.style.borderColor = "rgba(16, 185, 129, 0.3)";
            badge.style.color = "#10b981";
            badge.innerHTML = `<div class="margen-health-dot" style="background:#10b981"></div><span>Auditoría Completada</span>`;
        }

        // Replace Button text
        btn.innerHTML = `<i data-lucide="check" style="width: 18px;"></i> Auditoría Exitosa`;
        btn.style.background = "linear-gradient(135deg, #10b981, #059669)";
        
        if (window.lucide) lucide.createIcons();

    } catch (err) {
        console.error("Gema Audit Error", err);
        btn.innerHTML = `<i data-lucide="alert-circle" style="width: 18px;"></i> Reintentar Auditoría`;
        btn.disabled = false;
        alert("Gema no pudo completarlo ahora: " + err.message);
    }
}
