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
    // Mes actual en formato YYYY-MM
    const mesStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

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
        }
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

    const result = { trend: trendCube, activity: activityCube, distribution, distRaw, topProveedores, dayLabels };
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
    const topVals = analytics.topProveedores.length > 0
        ? analytics.topProveedores.map(p => p.valor)
        : [0, 0, 0, 0, 0];

    // Actualizar Gráficas Bento
    renderMiniChart('miniChartTrend',        analytics.trend,        '#D4AF37', '€', 'line', { labels: analytics.dayLabels });
    renderMiniChart('miniChartActivity',     analytics.activity,     '#10b981', 'u', 'bar',  { labels: analytics.dayLabels });
    renderMiniChart('miniChartDistribution', analytics.distribution, '#3b82f6', '%', 'bar',  { labels: ['F','A','G'] });
    renderMiniChart('miniChartBalance',      topVals,                '#D4AF37', '€', 'bar',  { labels: analytics.topProveedores.map(p=>p.nombre) });
}
