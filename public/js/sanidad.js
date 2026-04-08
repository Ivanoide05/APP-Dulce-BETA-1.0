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
    alert('Funcionalidad para reportar avería de neveras en desarrollo.');
}

function generarPDFSanidad() {
    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
        alert("Las librerías PDF todavía no han cargado. Intenta de nuevo en unos segundos.");
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
