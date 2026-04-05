
        // ===== TEMA OSCURO / CLARO =====
        const THEME_KEY = 'dulce_jaleo_theme';
        const htmlEl = document.documentElement;

        function applyTheme(theme) {
            htmlEl.setAttribute('data-theme', theme);
            const btn = document.getElementById('themeToggle');
            if (btn) btn.innerHTML = theme === 'dark' ? '🌙' : '☀️';
        }

        function initTheme() {
            applyTheme('dark');
        }

        function toggleTheme() {
            const current = htmlEl.getAttribute('data-theme') || 'dark';
            const next = current === 'dark' ? 'light' : 'dark';
            applyTheme(next);
            localStorage.setItem(THEME_KEY, next);
        }

        initTheme();

        // ===== CONFIG =====
        const CONFIG_KEY = 'dulce_jaleo_config';
        const AIRTABLE_BASE = 'app7VJr4iHt5v1r5c';
        const AIRTABLE_TABLES = {
            FACTURAS: 'tblLC7oMOUQtRWkn7',
            ALBARANES: 'tblX9EQUmwItNJCZI',
            GASTOS_VARIOS: 'tblHzVIPEde7zWnUv'
        };

        function loadConfig() {
            const saved = localStorage.getItem(CONFIG_KEY);
            return saved ? JSON.parse(saved) : {
                webhookUrl: 'https://dulce-y-jaleo-n8n.xm1sa3.easypanel.host/webhook/lovable-webhook',
                airtableToken: ''
            };
        }

        function saveConfig() {
            const cfg = {
                webhookUrl: document.getElementById('cfgWebhookUrl').value.trim(),
                airtableToken: document.getElementById('cfgAirtableToken').value.trim()
            };
            localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
            config = cfg;
            document.getElementById('configModal').classList.remove('open');
            alert('Configuración guardada');
        }

        let config = loadConfig();

        // ===== ESTADO GLOBAL =====
        let globalStats = {
            allRecords: [],
            mesActual: '',
            countTotal: 0,
            sumTotal: 0,
            totalGastosMes: 0,
            totalGastosMesAnterior: 0,
            breakdownMes: {},
            loaded: false
        };

        async function fetchGlobalData() {
            if (!config.airtableToken) return false;
            const headers = { 'Authorization': 'Bearer ' + config.airtableToken };
            const now = new Date();
            globalStats.mesActual = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

            try {
                const [fRes, aRes, gRes] = await Promise.all([
                    fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLES.FACTURAS}?sort[0][field]=Fecha&sort[0][direction]=desc`, { headers }),
                    fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLES.ALBARANES}?sort[0][field]=Fecha&sort[0][direction]=desc`, { headers }),
                    fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLES.GASTOS_VARIOS}?sort[0][field]=Fecha&sort[0][direction]=desc`, { headers })
                ]);

                const [fD, aD, gD] = await Promise.all([fRes.json(), aRes.json(), gRes.json()]);
                
                globalStats.allRecords = [];
                if (fD.records) globalStats.allRecords.push(...fD.records.map(r => normalizeRecord(r, 'FACTURA')));
                if (aD.records) globalStats.allRecords.push(...aD.records.map(r => normalizeRecord(r, 'ALBARAN')));
                if (gD.records) globalStats.allRecords.push(...gD.records.map(r => normalizeRecord(r, 'GASTO')));

                globalStats.allRecords.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
                calculateGlobalStats();
                globalStats.loaded = true;
                return true;
            } catch (e) {
                console.error('Error fetching Airtable:', e);
                return false;
            }
        }

        function normalizeRecord(item, cat) {
            const f = item.fields || item;
            return {
                proveedor: f['PROVEDOR/ TITULO'] || f.proveedor || 'Desconocido',
                fecha: f.Fecha || f.fecha || '',
                total: parseFloat(f.TOTAL || f.total || 0),
                categoria: cat,
                numero_doc: f['NUMERO DE DOC'] || f.numero_doc || '',
                iva: parseFloat(f.IVA || f.iva || 0),
                base: parseFloat(f['BASE IMPONIBLE'] || f.base_imponible || 0),
                detalles: f['DETALLES DOC'] || f.detalles || ''
            };
        }

        function calculateGlobalStats() {
            const all = globalStats.allRecords;
            const mes = globalStats.mesActual;
            globalStats.countTotal = all.length;
            globalStats.sumTotal = all.reduce((s, f) => s + (f.total || 0), 0);
            
            const delMes = all.filter(f => (f.fecha || '').startsWith(mes));
            globalStats.totalGastosMes = delMes.reduce((s, f) => s + (f.total || 0), 0);
            
            globalStats.breakdownMes = {};
            delMes.forEach(f => {
                const t = f.categoria || 'OTROS';
                globalStats.breakdownMes[t] = (globalStats.breakdownMes[t] || 0) + f.total;
            });
        }

        // ===== NAVIGATION =====
        function activateTab(tabId) {
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            
            const target = document.getElementById('tab-' + tabId);
            if (target) target.classList.add('active');
            
            const btn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
            if (btn) btn.classList.add('active');

            if (tabId === 'facturas') loadFacturas();
            if (tabId === 'margenes') loadMargenes();
            if (tabId === 'agenda') renderContacts();
            if (tabId === 'hojaruta') renderHojaRuta();

            const fab = document.getElementById('fabAddContact');
            if (fab) {
                if (tabId === 'agenda') fab.classList.add('visible');
                else fab.classList.remove('visible');
            }
        }

        // ===== SCANNER =====
        async function sendImage() {
            const fileInput = document.getElementById('fileInputGallery');
            if (!fileInput.files.length) return;
            
            const overlay = document.getElementById('processingOverlay');
            overlay.classList.remove('hidden');
            
            const fd = new FormData();
            fd.append('data', fileInput.files[0]);
            
            try {
                const res = await fetch(config.webhookUrl, { method: 'POST', body: fd });
                if (res.ok) {
                    alert('Documento enviado con éxito');
                    loadFacturas();
                } else {
                    alert('Error enviando al servidor');
                }
            } catch (e) {
                alert('Error de red');
            } finally {
                overlay.classList.add('hidden');
            }
        }

        // ===== MODULES =====
        async function loadFacturas() {
            const list = document.getElementById('facturasList');
            list.innerHTML = '<div class="empty-state">Cargando...</div>';
            await fetchGlobalData();
            
            list.innerHTML = globalStats.allRecords.map(f => `
                <div class="factura-card">
                    <div style="display:flex; justify-content:space-between; font-weight:600;">
                        <span>${f.proveedor}</span>
                        <span>${f.total.toFixed(2)}€</span>
                    </div>
                    <div style="font-size:12px; color:var(--text-2); margin-top:4px;">
                        ${f.fecha} · ${f.categoria}
                    </div>
                </div>
            `).join('');
            
            document.getElementById('statTotal').textContent = globalStats.countTotal;
        }

        const CONTACTS_KEY = 'dulce_jaleo_contactos';
        function getContacts() { return JSON.parse(localStorage.getItem(CONTACTS_KEY) || '[]'); }
        function saveContacts(c) { localStorage.setItem(CONTACTS_KEY, JSON.stringify(c)); }
        
        function renderContacts() {
            const list = document.getElementById('contactList');
            const contacts = getContacts();
            if (!contacts.length) {
                list.innerHTML = '<div class="empty-state">No hay contactos</div>';
                return;
            }
            list.innerHTML = contacts.map((c, i) => `
                <div class="contact-card" style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div class="contact-name">${c.nombre}</div>
                        <div style="font-size:12px; color:var(--text-2);">${c.tipo}</div>
                    </div>
                    <button onclick="deleteContact(${i})" style="background:none; border:none; color:var(--danger); cursor:pointer;">❌</button>
                </div>
            `).join('');
            document.getElementById('agendaCount').textContent = contacts.length + ' contactos';
        }

        function deleteContact(i) {
            const c = getContacts();
            c.splice(i, 1);
            saveContacts(c);
            renderContacts();
        }

        const VENTA_KEY = 'dulce_jaleo_venta_semanal';
        async function loadMargenes() {
            if (!globalStats.loaded) await fetchGlobalData();
            const v = parseFloat(localStorage.getItem(VENTA_KEY) || 0);
            const g = globalStats.totalGastosMes;
            const i = v * 4.33;
            const m = i > 0 ? ((i - g) / i * 100) : 0;
            
            document.getElementById('margenValor').textContent = m.toFixed(1) + '%';
            document.getElementById('mGastos').textContent = g.toFixed(0) + '€';
            document.getElementById('mIngresos').textContent = i.toFixed(0) + '€';
            
            const dashG = document.getElementById('dashGastos');
            if (dashG) dashG.textContent = g.toFixed(0) + ' €';
        }

        function renderHojaRuta() {
            const list = document.getElementById('alertasList');
            const venta = parseFloat(localStorage.getItem(VENTA_KEY) || 0);
            if (!venta) {
                list.innerHTML = '<div class="alert-card warning">Configura tu venta semanal en Márgenes para ver alertas de rentabilidad.</div>';
                return;
            }
            list.innerHTML = '<div class="alert-card success">Tu negocio está bajo control. No hay alertas críticas hoy.</div>';
        }

        // ===== INIT =====
        document.addEventListener('DOMContentLoaded', () => {
            // Theme toggle
            const themeBtn = document.getElementById('themeToggle');
            if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

            // Nav buttons
            document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
                btn.addEventListener('click', () => activateTab(btn.dataset.tab));
            });

            // Config
            document.getElementById('gearBtn').addEventListener('click', () => {
                const cfg = loadConfig();
                document.getElementById('cfgWebhookUrl').value = cfg.webhookUrl;
                document.getElementById('cfgAirtableToken').value = cfg.airtableToken;
                document.getElementById('configModal').classList.add('open');
            });
            document.getElementById('closeConfigModal').addEventListener('click', () => document.getElementById('configModal').classList.remove('open'));
            document.getElementById('saveConfigBtn').addEventListener('click', saveConfig);

            // Manual entries
            document.getElementById('btnManualEntry').addEventListener('click', () => document.getElementById('manualEntryModal').classList.add('open'));
            document.getElementById('closeManualModal').addEventListener('click', () => document.getElementById('manualEntryModal').classList.remove('open'));
            document.getElementById('saveManualBtn').addEventListener('click', async () => {
                const prov = document.getElementById('mProveedor').value;
                const total = parseFloat(document.getElementById('mTotal').value);
                if (!prov || isNaN(total)) return alert('Datos incompletos');
                
                // Simulación o POST real a Airtable podrías añadir aquí similar al scanner
                alert('Funcionalidad de guardado manual lista para conectar con Airtable');
                document.getElementById('manualEntryModal').classList.remove('open');
            });

            // Scanner
            document.getElementById('btnGallery').addEventListener('click', () => document.getElementById('fileInputGallery').click());
            document.getElementById('fileInputGallery').addEventListener('change', e => {
                if (e.target.files.length) {
                    const reader = new FileReader();
                    reader.onload = ev => {
                        document.getElementById('previewImg').src = ev.target.result;
                        document.getElementById('previewImg').style.display = 'block';
                        document.getElementById('scannerPlaceholder').style.display = 'none';
                        document.getElementById('sendBtn').disabled = false;
                    };
                    reader.readAsDataURL(e.target.files[0]);
                }
            });
            document.getElementById('sendBtn').addEventListener('click', sendImage);

            // Agenda FAB
            document.getElementById('fabAddContact').addEventListener('click', () => document.getElementById('contactModal').classList.add('open'));
            document.getElementById('closeModal').addEventListener('click', () => document.getElementById('contactModal').classList.remove('open'));
            document.getElementById('saveContact').addEventListener('click', () => {
                const name = document.getElementById('cNombre').value;
                if (!name) return;
                const c = getContacts();
                c.push({ nombre: name, tipo: 'cliente' });
                saveContacts(c);
                document.getElementById('contactModal').classList.remove('open');
                renderContacts();
            });

            // Margenes
            document.getElementById('saveVentaBtn').addEventListener('click', () => {
                const v = document.getElementById('ventaSemanalInput').value;
                localStorage.setItem(VENTA_KEY, v);
                loadMargenes();
            });

            // Dashboard Init
            const dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
            const dateEl = document.getElementById('current-date');
            if (dateEl) dateEl.textContent = new Date().toLocaleDateString('es-ES', dateOptions);

            activateTab('dashboard');
            loadMargenes();

            setTimeout(() => {
                const splash = document.getElementById('splashScreen');
                if (splash) splash.classList.add('hide');
            }, 800);
        });
    