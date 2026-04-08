// -----------------------------------------------------
// CONFIGURACIÓN CENTRALIZADA Y PANEL DE AJUSTES
// -----------------------------------------------------

// Mostrar/Ocultar Overlay
function openSettings() {
    const overlay = document.getElementById('settingsOverlay');
    if(overlay) {
        overlay.style.display = 'flex';
        // Animaciones opcionales o carga de datos base
        const airtableBase = localStorage.getItem('dj_airtable_base') || '';
        const airtableKey = localStorage.getItem('dj_airtable_key') || '';
        const baseInput = document.getElementById('settingAirtableBase');
        const keyInput = document.getElementById('settingAirtableKey');
        if(baseInput) baseInput.value = airtableBase;
        if(keyInput) keyInput.value = airtableKey;
        
        // Renderizar Tablas HR Native
        if(typeof renderHRUI === 'function') renderHRUI();
    }
}

function closeSettings() {
    const overlay = document.getElementById('settingsOverlay');
    if(overlay) overlay.style.display = 'none';
}

// Navegación de Tabs Laterales
function activateSettingsTab(tabId, element) {
    // Quitar active a todos
    document.querySelectorAll('.settings-tab').forEach(el => {
        el.classList.remove('active');
        el.style.borderLeft = '3px solid transparent';
        el.style.background = 'transparent';
    });
    // Poner active al elegido
    element.classList.add('active');
    element.style.borderLeft = '3px solid var(--brand-color)';
    element.style.background = 'rgba(0,0,0,0.05)';

    // Ocultar todos los tabs
    document.querySelectorAll('.settings-tab-content').forEach(cont => {
        cont.style.display = 'none';
    });
    // Mostrar el correspondiente
    const activeTab = document.getElementById('settingsTab-' + tabId);
    if(activeTab) activeTab.style.display = 'block';
}

// Guardar Airtable Mocks
function saveAirtableSettings() {
    const base = document.getElementById('settingAirtableBase').value;
    const key = document.getElementById('settingAirtableKey').value;
    localStorage.setItem('dj_airtable_base', base);
    localStorage.setItem('dj_airtable_key', key);
    
    // Feedback visual
    const btn = event.currentTarget;
    const oldText = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="check"></i> Guardado Exitosamente';
    btn.style.background = '#059669';
    if(window.lucide) window.lucide.createIcons();
    
    setTimeout(() => {
        btn.innerHTML = oldText;
        btn.style.background = '#10b981';
    }, 2000);
}

// -----------------------------------------------------
// MODALES LEGALES (RGPD, LSSI, T&C)
// -----------------------------------------------------

function openLegalModal(type) {
    const overlay = document.getElementById('legalTextOverlay');
    const content = document.getElementById('legalModalContent');
    const title = document.getElementById('legalModalTitle');
    
    let html = '';
    
    if(type === 'aviso') {
        title.innerText = "Aviso Legal y LSSI-CE";
        html = `
            <div class="legal-content-prose">
                <h3>1. Identificación del Titular</h3>
                <p>En cumplimiento de Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa que esta Plataforma Informática Privada es propiedad exclusiva del Proveedor del Software (en adelante, "La Plataforma").</p>
                <h3>2. Finalidad del Software</h3>
                <p>Esta aplicación está diseñada como un ERP/Gestor interno B2E (Business to Employee). Su uso está estrictamente restringido al personal autorizado bajo contrato o colaboración activa. La extracción de métricas o ingeniería inversa conllevará responsabilidades penales.</p>
                <h3>3. Propiedad Intelectual e Industrial</h3>
                <p>Todos los derechos sobre el código, bases de datos vinculadas, diseños, interfaz (incluido el modo Inspector PDF), logos y textos, están protegidos por las leyes de propiedad moral y patrimonial de La Plataforma.</p>
            </div>
        `;
    } 
    else if(type === 'privacidad') {
        title.innerText = "Política de Privacidad Integral (Empleados)";
        html = `
            <div class="legal-content-prose">
                <h3>Tratamiento de Datos por Relación Laboral (Art. 13 RGPD)</h3>
                <p>Estimado empleado/a: Al utilizar esta plataforma de gestión laboral, registro horario y control APPCC (Sanidad), <strong>la empresa contratante (tu empleador)</strong> será el Responsable del Tratamiento de los datos de carácter personal que viertas aquí.</p>
                
                <h3>1. ¿Qué datos procesamos y por qué?</h3>
                <ul>
                    <li><strong>Datos de Identificación:</strong> Tu Nombre, Apellidos y Correo.</li>
                    <li><strong>Registros de Jornada y Turnos:</strong> Para el estricto cumplimiento del Real Decreto-ley 8/2019 (Registro Horario).</li>
                    <li><strong>Firmas en APPCC:</strong> Obligatorio por sanidad.</li>
                </ul>

                <h3>2. Legitimación del Tratamiento</h3>
                <p>El procesamiento es obligatorio para la ejecución del Contrato de Trabajo o la prestación del servicio que nos vincula y el cumplimiento de nuestras obligaciones legales como empresa. <strong>No procesamos tus datos para fines publicitarios ni ventas a terceros.</strong></p>

                <h3>3. Seguridad y Archivo en la Nube</h3>
                <p>Los datos son aislados de forma segura mediante protocolos de bases de datos relacionales. La Información estará alojada en servidores bajo escudos de privacidad legal, actuando La Plataforma únicamente como Encargado del Tratamiento.</p>

                <h3>4. Ejercicio de los Derechos ARCO</h3>
                <p>En cualquier momento puedes dirigirte a tu encargado o enviar una solicitud formal por escrito a la gerencia de tu empresa para ejercer tu derecho de Acceso, Rectificación, Cancelación u Oposición respecto de tu información en el portal.</p>
            </div>
        `;
    }
    else if(type === 'terminos') {
        title.innerText = "Términos Internos de Uso (Confidencialidad)";
        html = `
            <div class="legal-content-prose">
                <h3>Obligación Contractual de Uso</h3>
                <p>Este portal es la herramienta oficial de trabajo de tu empresa. Al utilizarlo, aceptas tácitamente las siguientes reglas estrictas:</p>
                
                <h3>1. Infranqueable Confidencialidad (NDA)</h3>
                <p>Cualquier receta, lista de ingredientes, procedimiento de Sanidad, panel de objetivos económicos, facturas, clientes (Base de Datos) y cuadrantes internos son **SECRETO PROFESIONAL**. Queda totalmente prohibido tomar capturas de pantalla con el smartphone personal, o reproducir esta información ante competidores.</p>

                <h3>2. Seguridad de Acceso</h3>
                <p>Tu cuenta o PIN de la app es personal e intransferible. Compartir tus credenciales con otro empleado para falsificar un alta/baja de horario o registrar una actividad sanitaria constituirá falta grave o muy grave.</p>

                <h3>3. Obligación del Protocolo de Sanidad</h3>
                <p>Es responsabilidad del operario certificar usando su nombre y botón interactivo la Veracidad de las métricas (Temperatura, Cloro, Limpieza). Falsificar una hoja legal arriesga la licencia del establecimiento.</p>
            </div>
        `;
    }

    content.innerHTML = html;
    if(overlay) overlay.style.display = 'flex';
}

function closeLegalModal() {
    const overlay = document.getElementById('legalTextOverlay');
    if(overlay) overlay.style.display = 'none';
}

// -----------------------------------------------------
// LÓGICA HR NATIVA (EMPLEADOS, TURNOS, FESTIVOS)
// -----------------------------------------------------

let hrData = JSON.parse(localStorage.getItem('dj_hr_data')) || [
    { id: 1, nombre: "Paco Ramírez", turnos: ["08:00 - 15:00", "08:00 - 15:00", "08:00 - 15:00", "08:00 - 15:00", "LIBRE", "08:00 - 15:00", "LIBRE"], festivos: "Vacaciones del 10 al 15 de Agosto" },
    { id: 2, nombre: "María Dolores", turnos: ["15:00 - 22:00", "15:00 - 22:00", "LIBRE", "15:00 - 22:00", "15:00 - 22:00", "15:00 - 22:00", "LIBRE"], festivos: "San Juan Libre" },
    { id: 3, nombre: "Javier V.", turnos: ["LIBRE", "08:00 - 12:00", "15:00 - 22:00", "LIBRE", "08:00 - 15:00", "12:00 - 18:00", "08:00 - 15:00"], festivos: "Ninguno" }
];

function saveHRData() {
    localStorage.setItem('dj_hr_data', JSON.stringify(hrData));
    renderHRUI();
}

function showHRTab(tabName) {
    document.querySelectorAll('.hr-section').forEach(el => el.style.display = 'none');
    const target = document.getElementById('hr-' + tabName);
    if(target) target.style.display = 'block';
    renderHRUI();
}

function renderHRUI() {
    const listCont = document.getElementById('hrEmpListContainer');
    const turnosCont = document.getElementById('hrTurnosContainer');
    const festivosCont = document.getElementById('hrFestivosContainer');
    
    if(!listCont || !turnosCont || !festivosCont) return;
    
    listCont.innerHTML = '';
    turnosCont.innerHTML = '';
    festivosCont.innerHTML = '';
    
    hrData.forEach((emp, i) => {
        // Tab Lista
        listCont.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.2); padding:12px; border-radius:8px; border:1px solid var(--border-color);">
                <span style="font-weight:600; color:var(--text-color);">${emp.nombre}</span>
                <button onclick="deleteEmployeeUI(${emp.id})" style="background:rgba(239, 68, 68, 0.1); color:#ef4444; border:none; border-radius:4px; padding:6px 10px; cursor:pointer;">
                    Eliminar
                </button>
            </div>
        `;
        
        // Tab Turnos
        let turnosHtml = '';
        const dayNames = ['L','M','X','J','V','S','D'];
        emp.turnos.forEach((t, j) => {
            let col = t.toUpperCase() === 'LIBRE' ? 'var(--text-muted)' : 'var(--text-color)';
            turnosHtml += `<input type="text" value="${t}" onchange="updateTurnoUI(${emp.id}, ${j}, this.value)" style="width:100%; border:1px solid var(--border-color); border-radius:4px; padding:6px; font-size:11px; text-align:center; background:rgba(0,0,0,0.1); color:${col};" placeholder="LIBRE">`;
        });
        
        turnosCont.innerHTML += `
            <div style="background:rgba(0,0,0,0.2); padding:12px; border-radius:8px; border:1px solid var(--border-color);">
                <div style="font-weight:600; margin-bottom:8px; color:var(--text-color);">${emp.nombre}</div>
                <div style="display:grid; grid-template-columns:repeat(7, 1fr); gap:4px; text-align:center; font-size:10px; font-weight:700; color:var(--text-muted); margin-bottom:4px;">
                    ${dayNames.map(d => `<span>${d}</span>`).join('')}
                </div>
                <div style="display:grid; grid-template-columns:repeat(7, 1fr); gap:4px;">
                    ${turnosHtml}
                </div>
            </div>
        `;
        
        // Tab Festivos
        festivosCont.innerHTML += `
            <div style="background:rgba(0,0,0,0.2); padding:12px; border-radius:8px; border:1px solid var(--border-color);">
                <div style="font-weight:600; margin-bottom:8px; color:var(--text-color);">${emp.nombre}</div>
                <textarea onchange="updateFestivoUI(${emp.id}, this.value)" style="width:100%; background:rgba(0,0,0,0.1); border:1px solid var(--border-color); border-radius:4px; padding:8px; color:var(--text-color); min-height:40px; font-size:12px; resize:vertical;" placeholder="Detalles de festivos, bajas, etc.">${emp.festivos}</textarea>
            </div>
        `;
    });
}

function addEmployeeUI() {
    const input = document.getElementById('newEmpName');
    const name = input.value.trim();
    if(name) {
        hrData.push({
            id: Date.now(),
            nombre: name,
            turnos: ["LIBRE", "LIBRE", "LIBRE", "LIBRE", "LIBRE", "LIBRE", "LIBRE"],
            festivos: ""
        });
        input.value = '';
        saveHRData();
    }
}

function deleteEmployeeUI(id) {
    if(confirm("¿Estás seguro de eliminar a este empleado?")) {
        hrData = hrData.filter(e => e.id !== id);
        saveHRData();
    }
}

function updateTurnoUI(id, dayIndex, val) {
    const emp = hrData.find(e => e.id === id);
    if(emp) {
        emp.turnos[dayIndex] = val;
        saveHRData();
    }
}

function updateFestivoUI(id, val) {
    const emp = hrData.find(e => e.id === id);
    if(emp) {
        emp.festivos = val;
        saveHRData();
    }
}

// -----------------------------------------------------
// GENERADOR DE CUADRANTE SEMANAL (PDF)
// -----------------------------------------------------

function generarCuadrantePDF() {
    const { jsPDF } = window.jspdf;
    if(!jsPDF) {
        alert("Error: Librería jsPDF no encontrada.");
        return;
    }
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    // Colores y Fuentes Base
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    
    // Título Central
    doc.text("CUADRANTE Y TURNOS SEMANALES", 148.5, 25, { align: "center" });

    // Subtítulo (Local / Info)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    const businessName = localStorage.getItem('dj_client_name') || "Tu Empresa";
    doc.text("Establecimiento: " + businessName.toUpperCase(), 15, 35);
    
    // Fecha y semana al vuelo
    const date = new Date();
    doc.text(`Doc. Generado Automáticamente: ${date.toLocaleDateString()}`, 280, 35, { align: "right" });

    // Dibujar Tabla Maestra Vectorial
    const xBase = 15;
    let currY = 45;
    const rowHeight = 14;
    
    // Anchos de columnas
    // Totales = 267mm (A4 landscape is 297mm - margins)
    const cwName = 45;
    const cwDay = Math.floor((297 - 30 - cwName) / 7); // ~ 31mm per day

    // Headers
    doc.setFillColor(245, 158, 11); // Naranja corporativo oscuro
    doc.rect(xBase, currY, cwName + (cwDay*7), rowHeight, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    
    const days = ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO", "DOMINGO"];
    
    // Header Nombres
    doc.text("EMPLEADO", xBase + (cwName/2), currY + 9, { align: "center" });
    doc.line(xBase + cwName, currY, xBase + cwName, currY + rowHeight); // divisor
    
    // Header Días
    for(let i=0; i<7; i++){
        doc.text(days[i], xBase + cwName + (cwDay * i) + (cwDay/2), currY + 9, { align: "center" });
    }

    currY += rowHeight;

    // ----- CARGAR DATOS REALES DEL CRUD NATIVO ----- //
    const safeHRData = JSON.parse(localStorage.getItem('dj_hr_data')) || hrData || [];

    doc.setTextColor(40, 40, 40);
    
    safeHRData.forEach((emp) => {
        // Celda nombre
        doc.setDrawColor(200, 200, 200);
        doc.rect(xBase, currY, cwName, rowHeight, 'S');
        doc.setFont("helvetica", "bold");
        doc.text(emp.nombre || 'Empleado Indef.', xBase + (cwName/2), currY + 9, { align: "center" });
        
        // Celdas Días
        const shiftData = emp.turnos || ["LIBRE", "LIBRE", "LIBRE", "LIBRE", "LIBRE", "LIBRE", "LIBRE"];
        
        for(let j=0; j<7; j++){
            const cellX = xBase + cwName + (cwDay * j);
            doc.rect(cellX, currY, cwDay, rowHeight, 'S');
            
            const turno = (shiftData[j] || "LIBRE").toUpperCase();
            if(turno === "LIBRE") {
                doc.setFont("helvetica", "normal");
                doc.setTextColor(200, 50, 50); // Rojo
                doc.text(turno, cellX + (cwDay/2), currY + 9, { align: "center" });
            } else {
                doc.setFont("helvetica", "bold");
                doc.setTextColor(30, 100, 30); // Verde oscuro
                doc.text(turno, cellX + (cwDay/2), currY + 9, { align: "center" });
            }
        }
        
        currY += rowHeight;
    });

    // Marco exterior gruesor
    doc.setLineWidth(0.5);
    doc.setDrawColor(0,0,0);
    doc.rect(xBase, 45, cwName + (cwDay*7), currY - 45, 'S');

    // Pie
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("Este cuadrante está supeditado a cambios operacionales por necesidades de producción.", 148.5, 180, { align: "center" });
    doc.text("En caso de indisponibilidad, notifíquelo a gerencia con 48h de antelación.", 148.5, 185, { align: "center" });

    // Descargar en vivo
    doc.save(`Cuadrante_Semanal_${businessName.replace(/\s+/g, '_')}_${date.toISOString().split('T')[0]}.pdf`);
}
