function openSanidad() {
    const overlay = document.getElementById('sanidadOverlay');
    if (overlay) {
        overlay.classList.add('open');
        verificarEstatusSanidad();
    }
}

function closeSanidad() {
    const overlay = document.getElementById('sanidadOverlay');
    if (overlay) {
        overlay.classList.remove('open');
    }
}

function obtenerFechaHoy() {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function registrarLimpieza() {
    const hoy = obtenerFechaHoy();
    let registros = JSON.parse(localStorage.getItem('sanidad_limpieza') || '{}');
    registros[hoy] = { completado: true, hora: new Date().toLocaleTimeString(), firma: 'G.A.' };
    localStorage.setItem('sanidad_limpieza', JSON.stringify(registros));
    
    verificarEstatusSanidad();
    if (typeof mostrarToastConexion === 'function') {
        mostrarToastConexion('Limpieza diaria registrada');
    }
}

function registrarTemperaturas() {
    const hoy = obtenerFechaHoy();
    let registros = JSON.parse(localStorage.getItem('sanidad_temperaturas') || '{}');
    registros[hoy] = { 
        mesaFria: 4, 
        congelador: -18, 
        arcon: -18, 
        obrador: 15,
        hora: new Date().toLocaleTimeString(),
        incidencia: false,
        firma: 'G.A.'
    };
    localStorage.setItem('sanidad_temperaturas', JSON.stringify(registros));
    
    verificarEstatusSanidad();
    if (typeof mostrarToastConexion === 'function') {
        mostrarToastConexion('Temperaturas correctas registradas');
    }
}

function registrarProduccion() {
    const hoy = obtenerFechaHoy();
    let registros = JSON.parse(localStorage.getItem('sanidad_produccion') || '{}');
    registros[hoy] = { 
        productos: 'Varios Obrador',
        cantidad: 'Lote Base',
        lote: hoy.replace(/-/g, ''), 
        hora: new Date().toLocaleTimeString(),
        firma: 'G.A.'
    };
    localStorage.setItem('sanidad_produccion', JSON.stringify(registros));
    
    verificarEstatusSanidad();
    if (typeof mostrarToastConexion === 'function') {
        mostrarToastConexion('Producción base registrada');
    }
}

function mostrarIncidenciaTemp() {
    mostrarToastConexion('Funcionalidad para reportar avería de neveras en desarrollo.');
}

function generarPDFSanidad() {
    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
        mostrarToastConexion("Las librerías PDF todavía no han cargado. Intenta de nuevo en unos segundos.");
        return;
    }
    
    if (typeof mostrarToastConexion === 'function') {
        mostrarToastConexion('Generando Informe Oficial APPCC... 📄');
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4'); // points, A4 size: 595 x 842

    const hoy = new Date();
    const currentYear = hoy.getFullYear();
    const currentMonth = hoy.getMonth() + 1;
    const numDays = new Date(currentYear, currentMonth, 0).getDate();
    const mesStr = currentMonth.toString().padStart(2, '0');
    
    const limpiezaData = JSON.parse(localStorage.getItem('sanidad_limpieza') || '{}');
    const tempsData = JSON.parse(localStorage.getItem('sanidad_temperaturas') || '{}');
    const prodData = JSON.parse(localStorage.getItem('sanidad_produccion') || '{}');

    const commonLineColor = 50;
    const commonLineWidth = 0.5;

    // ==========================================
    // HOJA 01: LIMPIEZA
    // ==========================================
    dibujarCabecera(doc, "01", "REGISTRO DE LIMPIEZA Y DESINFECCIÓN. INSTALACIONES Y EQUIPOS", mesStr, currentYear);
    
    let bodyDiario = [];
    for (let i = 1; i <= 31; i++) {
        let diaStr = i.toString().padStart(2, '0');
        let dateKey = `${currentYear}-${mesStr}-${diaStr}`;
        let col2 = "", col3 = "", col4 = "";
        
        if (i <= numDays && limpiezaData[dateKey]) {
            col2 = "X"; col3 = "X"; col4 = "X"; // Simulación marca check
        } else if (i > numDays) {
            col2 = "-"; col3 = "-"; col4 = "-";
        }
        bodyDiario.push([i, col2, col3, col4]);
    }

    doc.autoTable({
        startY: 120,
        margin: { left: 40, right: 300 }, // Ocupa mitad izquierda
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2, lineColor: commonLineColor, lineWidth: commonLineWidth, textColor: 0 },
        headStyles: { fillColor: [240, 240, 240], halign: 'center', textColor: 0 },
        bodyStyles: { halign: 'center' },
        head: [
            [{ content: 'DIARIO', colSpan: 4, styles: { halign: 'center', fontStyle: 'bold' } }],
            ['DIA', 'Chocolatera, cazo eléctrico...', 'Útiles de trabajo...', 'Suelos de obrador...']
        ],
        body: bodyDiario
    });

    // Sub-tablas derecha Limpieza (Semanal, Mensual, etc)
    const rightMargin = { left: 310, right: 40 };
    doc.autoTable({
        startY: 120, margin: rightMargin, theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2, lineColor: commonLineColor, lineWidth: commonLineWidth, textColor: 0 },
        headStyles: { fillColor: [240, 240, 240], halign: 'center', textColor: 0 },
        head: [[{ content: 'SEMANAL', colSpan: 4 }],[ 'DÍA', 'Mesa fría, armario...', 'Depósitos de residuos', 'Suelo de patio' ]],
        body: [[ '','','','' ],[ '','','','' ],[ '','','','' ],[ '','','','' ]]
    });
    
    let lastY = doc.lastAutoTable.finalY + 10;
    doc.autoTable({
        startY: lastY, margin: rightMargin, theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2, lineColor: commonLineColor, lineWidth: commonLineWidth, textColor: 0 },
        headStyles: { fillColor: [240, 240, 240], halign: 'center', textColor: 0 },
        head: [[{ content: 'MENSUAL', colSpan: 3 }],[ 'DÍA', 'Paredes de oficina', 'Arcón congelador' ]],
        body: [[ '','','' ]]
    });

    // ==========================================
    // HOJA 02: TEMPERATURAS
    // ==========================================
    doc.addPage();
    dibujarCabecera(doc, "02", "REGISTRO DE TEMPERATURAS DE EQUIPOS DE FRÍO, CONTROL SEMANAL CLORO", mesStr, currentYear);

    let bodyTemps = [];
    let bodyCloro = [];
    for (let i = 1; i <= 31; i++) {
        let diaStr = i.toString().padStart(2, '0');
        let dateKey = `${currentYear}-${mesStr}-${diaStr}`;
        let t = tempsData[dateKey];
        
        if (i <= numDays && t) {
            bodyTemps.push([i, t.mesaFria, t.congelador, t.arcon, t.obrador, t.incidencia?'SI':'', t.firma]);
            bodyCloro.push([i, '', '', '', '']); // Cloro vacio para rellenar a mano semanal
        } else {
            let mk = i > numDays ? '-' : '';
            bodyTemps.push([i, mk, mk, mk, mk, mk, mk]);
            bodyCloro.push([i, mk, mk, mk, mk]);
        }
    }

    doc.autoTable({
        startY: 120,
        margin: { left: 40, right: 260 },
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 2, lineColor: commonLineColor, lineWidth: commonLineWidth, textColor: 0 },
        headStyles: { fillColor: [240, 240, 240], halign: 'center', textColor: 0 },
        bodyStyles: { halign: 'center' },
        head: [['FECHA', 'MESA FRÍA', 'ARMARIO CONG.', 'ARCÓN CONG.', 'OBRADOR', 'P.I.', 'FIRMA']],
        body: bodyTemps
    });

    doc.autoTable({
        startY: 120,
        margin: { left: 345, right: 40 },
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 2, lineColor: commonLineColor, lineWidth: commonLineWidth, textColor: 0 },
        headStyles: { fillColor: [240, 240, 240], halign: 'center', textColor: 0 },
        bodyStyles: { halign: 'center' },
        head: [['FECHA', 'CLORO RESIDUAL', 'CARACT. ORGANOLÉPTICAS', 'P.I.', 'FIRMA']],
        body: bodyCloro
    });

    // ==========================================
    // HOJA 03: PRODUCCIÓN
    // ==========================================
    doc.addPage();
    dibujarCabecera(doc, "03", "REGISTRO DE PRODUCCIÓN", mesStr, currentYear);

    let bodyProd = [];
    for (let i = 1; i <= 15; i++) {
        let diaStr = i.toString().padStart(2, '0');
        let dateKey = `${currentYear}-${mesStr}-${diaStr}`;
        let p = prodData[dateKey];
        if (p) {
            bodyProd.push([dateKey, p.productos, p.cantidad, p.lote, '', p.firma]);
        } else {
            bodyProd.push(['', '', '', '', '', '']);
        }
    }

    doc.autoTable({
        startY: 120,
        margin: { left: 40, right: 40 },
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 5, lineColor: commonLineColor, lineWidth: commonLineWidth, textColor: 0 },
        headStyles: { fillColor: [240, 240, 240], halign: 'center', textColor: 0 },
        bodyStyles: { halign: 'center' },
        head: [['Fecha', 'Productos', 'Cantidad', 'Lote:', 'P.I.', 'Firma:']],
        body: bodyProd
    });

    // Guardar
    doc.save(`APPCC_DULCEJALEO_${currentYear}_${mesStr}.pdf`);
}

function dibujarCabecera(doc, num, titulo, mesStr, anio) {
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setLineWidth(1);
    doc.rect(40, 40, 515, 60); // Caja principal header
    doc.line(150, 40, 150, 80); // Separador DULCE JALEO
    doc.line(450, 40, 450, 80); // Separador Revision
    doc.line(40, 80, 555, 80); // Linea Título

    doc.setFont(undefined, 'bold');
    doc.text("DULCE Y JALEO", 65, 60);
    doc.text("REGISTROS", 270, 60);
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text("Revisión 0.", 480, 55);
    doc.text("Marzo 2024", 480, 65);

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(num, 70, 92);
    doc.line(100, 80, 100, 100);
    doc.text(titulo, 180, 92);

    doc.setFont(undefined, 'normal');
    doc.text(`Mes: ${mesStr} / ${anio}`, 470, 92);
}

function calcularProgresoMensual() {
    const hoy = new Date();
    const currentYear = hoy.getFullYear();
    const currentMonth = hoy.getMonth() + 1;
    const numDays = new Date(currentYear, currentMonth, 0).getDate();
    const mesStr = currentMonth.toString().padStart(2, '0');

    const limpiezaData = JSON.parse(localStorage.getItem('sanidad_limpieza') || '{}');
    const tempsData = JSON.parse(localStorage.getItem('sanidad_temperaturas') || '{}');
    const prodData = JSON.parse(localStorage.getItem('sanidad_produccion') || '{}');

    let countL = 0, countT = 0, countP = 0;
    
    for (let i = 1; i <= numDays; i++) {
        let diaStr = i.toString().padStart(2, '0');
        let dateKey = `${currentYear}-${mesStr}-${diaStr}`;
        if (limpiezaData[dateKey]) countL++;
        if (tempsData[dateKey]) countT++;
        if (prodData[dateKey]) countP++;
    }

    const minRegs = Math.min(countL, countT, countP);
    return { completados: minRegs, total: numDays, porcentaje: (minRegs/numDays)*100 };
}

function verificarEstatusSanidad() {
    const hoy = obtenerFechaHoy();
    
    const limpieza = JSON.parse(localStorage.getItem('sanidad_limpieza') || '{}');
    if (limpieza[hoy]) {
        document.getElementById('limpiezaStatus').innerHTML = `✅ Registrado hoy a las ${limpieza[hoy].hora}`;
    } else {
        document.getElementById('limpiezaStatus').innerHTML = '⚠️ Pendiente de registro hoy';
    }
    
    const temps = JSON.parse(localStorage.getItem('sanidad_temperaturas') || '{}');
    if (temps[hoy]) {
        document.getElementById('temperaturasStatus').innerHTML = `✅ Registrado hoy a las ${temps[hoy].hora}`;
    } else {
        document.getElementById('temperaturasStatus').innerHTML = '⚠️ Pendiente de registro hoy';
    }
    
    const prod = JSON.parse(localStorage.getItem('sanidad_produccion') || '{}');
    if (prod[hoy]) {
        document.getElementById('produccionStatus').innerHTML = `✅ Registrado hoy a las ${prod[hoy].hora}`;
    } else {
        document.getElementById('produccionStatus').innerHTML = '⚠️ Pendiente de registro hoy';
    }

    // Comprobar si el mes está completo y actualizar UI de Alerta
    const progreso = calcularProgresoMensual();
    const alertBanner = document.getElementById('sanidadMesAlert');
    if (alertBanner) {
        if (progreso.completados >= progreso.total) {
            alertBanner.innerHTML = `<div style="background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; color: #10b981; padding: 12px; border-radius: 12px; font-weight: bold; font-size: 14px; text-align: center; margin-bottom: 20px;">
                ✅ MES COMPLETADO: ¡Descarga tu PDF Obligatorio y Archívalo!
            </div>`;
        } else {
            alertBanner.innerHTML = `<div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: #a1a1aa; padding: 8px; border-radius: 12px; font-size: 13px; text-align: center; margin-bottom: 20px;">
                Progreso del Mes: ${progreso.completados}/${progreso.total} días registrados.
            </div>`;
        }
    }
}


// === NUEVO MVP TOUCH & GO ===
const SANIDAD_CACHE_KEY = (window.DulceOS_CONFIG ? window.DulceOS_CONFIG.storagePrefix : 'dulce_jaleo_') + 'sanidad_logs';

function getSanidadLogs() {
    try {
        const data = localStorage.getItem(SANIDAD_CACHE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

function saveSanidadLogs(logs) {
    localStorage.setItem(SANIDAD_CACHE_KEY, JSON.stringify(logs));
}

function renderSanidadLogs() {
    const list = document.getElementById('sanidad-log-list');
    if (!list) return;

    const logs = getSanidadLogs();
    
    // Solo mostrar los de hoy (MVP) 
    const todayStr = new Date().toLocaleDateString('sv'); // yyyy-mm-dd local
    
    // Alternativa estable a ISO local
    const tzoffset = (new Date()).getTimezoneOffset() * 60000; 
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
    
    const todayLogs = logs.filter(l => l.timestamp.startsWith(localISOTime) || l.timestamp.startsWith(new Date().toISOString().split('T')[0]));

    if (todayLogs.length === 0) {
        list.innerHTML = `<div style="text-align:center; font-size:12px; color:var(--text-muted); padding: 20px;">Aún no hay registros hoy.</div>`;
        return;
    }

    // Ordenar de más reciente a más antiguo
    todayLogs.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

    list.innerHTML = todayLogs.map(log => {
        const time = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isTemp = log.type === 'temperature';
        const icon = isTemp ? 'thermometer-snowflake' : 'spray-can';
        const color = isTemp ? 'var(--gold)' : '#333';
        const extra = isTemp ? `<strong>${log.value} ºC</strong>` : `<span style="color:green; font-weight:bold;">Completado</span>`;
        return `
            <div class="glass-panel" style="padding: 12px; display:flex; align-items:center; gap: 12px; border-radius:12px; margin-bottom:8px;">
                <div style="background: rgba(0,0,0,0.05); padding:8px; border-radius:50%;">
                    <i data-lucide="${icon}" style="width:16px; height:16px; color:${color};"></i>
                </div>
                <div style="flex:1;">
                    <div style="font-size: 13px; font-weight:700;">${log.zone}</div>
                    <div style="font-size: 11px; color:var(--text-muted);">${time}</div>
                </div>
                <div style="font-size: 14px;">
                    ${extra}
                </div>
            </div>
        `;
    }).join('');

    if (typeof lucide !== 'undefined') {
        lucide.createIcons({ root: list });
    }
}

window.logTemperature = function() {
    const zone = document.getElementById('sanidad-camara').value;
    const tempInput = document.getElementById('sanidad-temp');
    const tempValue = parseFloat(tempInput.value);

    if (isNaN(tempValue)) {
        alert("Por favor, introduce una temperatura válida.");
        return;
    }

    const logs = getSanidadLogs();
    logs.push({
        id: 'san-' + Date.now(),
        type: 'temperature',
        zone: zone,
        value: tempValue,
        timestamp: new Date().toISOString()
    });

    saveSanidadLogs(logs);
    tempInput.value = '';
    renderSanidadLogs();
    
    if(window.mostrarToastConexion) window.mostrarToastConexion(`Temp. guardada: ${tempValue}ºC en ${zone}`);
};

window.logCleaning = function() {
    const zone = document.getElementById('sanidad-limpieza').value;

    const logs = getSanidadLogs();
    logs.push({
        id: 'san-' + Date.now(),
        type: 'cleaning',
        zone: zone,
        value: true,
        timestamp: new Date().toISOString()
    });

    saveSanidadLogs(logs);
    renderSanidadLogs();

    if(window.mostrarToastConexion) window.mostrarToastConexion(`Limpieza registrada para ${zone}.`);
};

window.generateInspectorReport = function() {
    const logs = getSanidadLogs();
    const bgName = window.DulceOS_CONFIG ? window.DulceOS_CONFIG.tenantName : 'Dulce Jaleo';
    
    let html = `
        <html>
        <head>
            <title>Registro APPCC - ${bgName}</title>
            <style>
                body { font-family: sans-serif; padding: 30px; color: #333; }
                .header { border-bottom: 2px solid #ddd; padding-bottom: 20px; margin-bottom: 30px; }
                .header h1 { margin: 0; color: #1a1a1a; }
                .header p { color: #666; margin: 4px 0 0 0; font-size: 14px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
                th, td { border: 1px solid #e0e0e0; padding: 12px; text-align: left; }
                th { background-color: #f8f9fb; color: #1a1a1a; font-weight: 600; }
                tr:nth-child(even) { background-color: #fafbfc; }
                .firma { margin-top: 60px; text-align: right; }
                .firma p { margin: 0 0 40px 0; color: #666; }
                .firma-linea { border-bottom: 1px solid #1a1a1a; width: 250px; display: inline-block; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Registro Oficial APPCC</h1>
                <p>Establecimiento: <strong>${bgName}</strong></p>
                <p>Fecha de emisión: ${new Date().toLocaleString()}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Fecha y Hora</th>
                        <th>Tipo de Control</th>
                        <th>Zona / Equipo</th>
                        <th>Resultado / Medición</th>
                    </tr>
                </thead>
                <tbody>
    `;

    const sortedLogs = logs.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (sortedLogs.length === 0) {
        html += `<tr><td colspan="4" style="text-align:center;">No hay registros disponibles en el sistema.</td></tr>`;
    } else {
        sortedLogs.forEach(l => {
            const time = new Date(l.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
            const typeStr = l.type === 'temperature' ? 'Control Temperaturas' : 'Limpieza y Desinfección';
            const valStr = l.type === 'temperature' ? `<strong>${l.value} ºC</strong>` : '<span style="color:green;">Completado</span>';
            html += `
                <tr>
                    <td>${time}</td>
                    <td>${typeStr}</td>
                    <td>${l.zone}</td>
                    <td>${valStr}</td>
                </tr>
            `;
        });
    }

    html += `
                </tbody>
            </table>
            <div class="firma">
                <p>Validado por Responsable / Gerencia:</p>
                <div class="firma-linea"></div>
            </div>
            <script>
                window.onload = function() { 
                    setTimeout(() => window.print(), 500); 
                }
            </script>
        </body>
        </html>
    `;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderSanidadLogs, 300);
});
