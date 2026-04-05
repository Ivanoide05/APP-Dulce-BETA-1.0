const fs = require('fs');
const targetFile = 'c:\\Users\\ivanr\\Desktop\\IA\\Dulce_Jaleo_Proyecto_Completo\\index.html';
let content = fs.readFileSync(targetFile, 'utf8');

const sAlert = `<span style="display:inline-flex; align-items:center; justify-content:center; margin-right:4px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide" ><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>`;
const sCamera = `<span style="display:inline-flex; align-items:center; justify-content:center; margin-right:4px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide" ><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg></span>`;
const sArrow = `<span style="display:inline-flex; align-items:center; justify-content:center; margin-right:4px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide" ><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>`;
const sRefresh = `<span style="display:inline-flex; align-items:center; justify-content:center; margin-right:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide" ><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg></span>`;
const sClock = `<span style="display:inline-flex; align-items:center; justify-content:center; margin-right:4px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide" ><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>`;
const sDown = `<span style="display:inline-flex; align-items:center; justify-content:center; margin-left:4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide" ><path d="m6 9 6 6 6-6"/></svg></span>`;

const newDashboardStr = `
            <div class="dash-welcome">
                <h2 id="greeting">Hola, Ezequiel</h2>
                <p id="current-date">Cargando fecha...</p>
            </div>

            <!-- Interactivity: Flip 3D Cards -->
            <style>
            .dash-grid {
                perspective: 1000px;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
                margin-bottom: 24px;
            }
            .flip-card {
                background-color: transparent;
                perspective: 1000px;
                cursor: pointer;
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
            }
            .flip-card-inner {
                position: relative;
                width: 100%;
                height: 100%;
                text-align: center;
                transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                transform-style: preserve-3d;
            }
            .flip-card.flipped .flip-card-inner {
                transform: rotateY(180deg);
            }
            .flip-card-front, .flip-card-back {
                position: absolute;
                width: 100%;
                height: 100%;
                -webkit-backface-visibility: hidden;
                backface-visibility: hidden;
                border-radius: 20px;
                background: var(--surface);
                border: 1px solid rgba(255, 255, 255, 0.05);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
                padding: 16px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }
            .flip-card-back {
                transform: rotateY(180deg);
                background: linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(0,0,0,0.5));
            }
            .flip-hint {
                font-size: 10px;
                color: var(--text-muted);
                margin-top: 8px;
                opacity: 0.7;
                display: flex;
                align-items: center;
                gap: 4px;
            }
            </style>

            <div class="dash-grid">
                <div class="dash-card flip-card" style="height: 120px;" onclick="this.classList.toggle('flipped')">
                    <div class="flip-card-inner">
                        <div class="flip-card-front">
                            <div class="dash-card-title">Margen Mes <span class="dash-trend">+5%</span></div>
                            <div class="dash-card-value" id="dashMargen">68.5%</div>
                            <div class="flip-hint">Toca para ver gráfico ${sRefresh}</div>
                        </div>
                        <div class="flip-card-back">
                            <div style="font-size:12px; color:var(--accent); font-weight:600;">Tendencia Alcista</div>
                            <div style="font-size:10px; color:var(--text-muted); margin-top:4px;">Últimos 30 días</div>
                            <div id="chartMargenMini"></div>
                        </div>
                    </div>
                </div>
                <div class="dash-card flip-card" style="height: 120px;" onclick="this.classList.toggle('flipped')">
                    <div class="flip-card-inner">
                        <div class="flip-card-front">
                            <div class="dash-card-title">Gastos Fijos</div>
                            <div class="dash-card-value" id="dashGastos">Cargando...</div>
                            <div class="flip-hint">Toca para detalle ${sRefresh}</div>
                        </div>
                        <div class="flip-card-back">
                            <div style="font-size:12px; color:var(--text-1); font-weight:600;">Mayor partida:</div>
                            <div style="font-size:13px; color:var(--accent); margin-top:8px;">Harinas y Manteca</div>
                        </div>
                    </div>
                </div>
                <div class="dash-card flip-card" style="height: 120px;" onclick="this.classList.toggle('flipped')">
                    <div class="flip-card-inner">
                        <div class="flip-card-front">
                            <div class="dash-card-title">
                                Pendientes
                                <div style="width:8px;height:8px;background:var(--danger);border-radius:50%;display:inline-block;margin-left:4px;"></div>
                            </div>
                            <div class="dash-card-value" id="dashPendientes">-</div>
                            <div class="flip-hint">Escanear ${sRefresh}</div>
                        </div>
                        <div class="flip-card-back" onclick="event.stopPropagation(); activateTab('scanner');" style="background: rgba(239, 68, 68, 0.1);">
                            <div style="font-size:13px; color:var(--danger); font-weight:600; display:flex; align-items:center;">${sCamera} Escanear</div>
                        </div>
                    </div>
                </div>
                <div class="dash-card flip-card" style="height: 120px;" onclick="this.classList.toggle('flipped')">
                    <div class="flip-card-inner">
                        <div class="flip-card-front">
                            <div class="dash-card-title">Tickets Hoy</div>
                            <div class="dash-card-value" id="dashTickets">-</div>
                            <div class="flip-hint">Ver listado ${sRefresh}</div>
                        </div>
                        <div class="flip-card-back" onclick="event.stopPropagation(); activateTab('facturas');">
                            <div style="font-size:13px; color:var(--text-1); display:flex; align-items:center;">Facturas ${sArrow}</div>
                        </div>
                    </div>
                </div>
            </div>

            <style>
            .accordion {
                background-color: var(--surface);
                color: var(--text-1);
                cursor: pointer;
                padding: 16px;
                width: 100%;
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 16px;
                text-align: left;
                outline: none;
                font-size: 16px;
                font-weight: 600;
                transition: 0.4s;
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }
            .accordion.active, .accordion:hover {
                background-color: rgba(255,255,255,0.05);
            }
            .panel {
                padding: 0 16px;
                background-color: transparent;
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.4s ease-out;
            }
            .horario-card {
                background: linear-gradient(145deg, rgba(20,20,25,0.8), rgba(30,30,35,0.8));
                border-radius: 16px;
                border: 1px solid rgba(255,255,255,0.05);
                padding: 16px;
                margin-top: 16px;
                margin-bottom: 32px;
            }
            .horario-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 0;
                border-bottom: 1px solid rgba(255,255,255,0.05);
            }
            .horario-row:last-child {
                border-bottom: none;
            }
            </style>

            <h3 class="section-title" style="font-size:20px;margin-bottom:12px;">Alertas Recientes</h3>
            <button class="accordion" onclick="this.classList.toggle('active'); var panel = this.nextElementSibling; if (panel.style.maxHeight) { panel.style.maxHeight = null; } else { panel.style.maxHeight = panel.scrollHeight + 'px'; }">
                <span style="display:flex; align-items:center;">${sAlert} 1 Alerta de Precios</span>
                <span style="font-size:12px; color:var(--text-muted); display:flex; align-items:center;">Expandir ${sDown}</span>
            </button>
            <div class="panel">
                <div class="alert-card" style="margin-top:8px;">
                    <div class="alert-icon">${sAlert}</div>
                    <div class="alert-content">
                        <p>Subida de precio en "Harina de Trigo Especial"</p>
                        <span>Detectado hace 2 horas en factura de Harinas Gómez</span>
                    </div>
                </div>
            </div>

            <h3 class="section-title" style="font-size:20px;margin-top:24px;margin-bottom:12px; display:flex; align-items:center;">${sClock} Control de Horario</h3>
            <div class="horario-card">
                <div class="horario-row">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <div style="width:32px;height:32px;border-radius:50%;background:rgba(212,175,55,0.2);color:var(--accent);display:flex;align-items:center;justify-content:center;font-weight:bold;">LC</div>
                        <div>
                            <div style="font-weight:600;font-size:15px;color:var(--text-1);">Laura C.</div>
                            <div style="font-size:12px;color:var(--text-muted);">Apertura - 06:15</div>
                        </div>
                    </div>
                    <div class="alert-badge badge-success">Puntual</div>
                </div>
                <div class="horario-row">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <div style="width:32px;height:32px;border-radius:50%;background:rgba(239,68,68,0.2);color:var(--danger);display:flex;align-items:center;justify-content:center;font-weight:bold;">MP</div>
                        <div>
                            <div style="font-weight:600;font-size:15px;color:var(--text-1);">Mario P.</div>
                            <div style="font-size:12px;color:var(--text-muted);">Turno Tarde - 15:00</div>
                        </div>
                    </div>
                    <div class="alert-badge badge-warning">Retraso 15m</div>
                </div>
                <div style="text-align:center;margin-top:16px;">
                    <button class="btn btn-secondary" style="font-size:13px;padding:8px 16px;">Ver Registro Completo</button>
                </div>
            </div>
`;

// Replace from <div class="dash-welcome"> up to <!-- ===== TAB: ESCÁNER ===== -->
const startIndex = content.indexOf('<div class="dash-welcome">');
const endIndex = content.indexOf('<!-- ===== TAB: ESCÁNER ===== -->');

if (startIndex > -1 && endIndex > -1) {
    content = content.substring(0, startIndex) + newDashboardStr + '\n        ' + content.substring(endIndex);
    fs.writeFileSync(targetFile, content);
    console.log("Dashboard restored successfully.");
} else {
    console.log("Could not find insertion points.");
}
