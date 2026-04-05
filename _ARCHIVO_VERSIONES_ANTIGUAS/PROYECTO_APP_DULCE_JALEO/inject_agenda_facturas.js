const fs = require('fs');
const targetFile = 'c:\\Users\\ivanr\\Desktop\\IA\\Dulce_Jaleo_Proyecto_Completo\\index.html';
let content = fs.readFileSync(targetFile, 'utf8');

const sTrash = '<span style="display:inline-flex; align-items:center; justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="lucide lucide-trash-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></span>';
const sUser = '<span style="display:inline-flex; align-items:center; justify-content:center; margin-right:4px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide" ><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>';
const sBriefcase = '<span style="display:inline-flex; align-items:center; justify-content:center; margin-right:4px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide" ><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg></span>';

const additionalJS = `

        /* ============================================================ */
        /* MODULE: AGENDA (Contactos y Proveedores)                     */
        /* ============================================================ */
        const AGENDA_KEY = 'dulce_jaleo_agenda';
        let agendaFilter = 'all'; 

        const sTrashStr = '${sTrash}';
        const sUserStr = '${sUser}';
        const sBriefcaseStr = '${sBriefcase}';

        function loadAgenda() {
            const saved = localStorage.getItem(AGENDA_KEY);
            if (saved) return JSON.parse(saved);
            return [
                { id: Date.now().toString(), type: 'proveedor', name: 'Harinas Gómez', phone: '+34 600 111 222' },
                { id: (Date.now() + 1).toString(), type: 'cliente', name: 'Hotel Las Cúpulas', phone: '+34 611 222 333' }
            ];
        }

        let agendaContacts = loadAgenda();

        function saveAgenda() {
            localStorage.setItem(AGENDA_KEY, JSON.stringify(agendaContacts));
            renderAgenda();
        }

        function renderAgenda() {
            const listEl = document.getElementById('contactList');
            const countEl = document.getElementById('agendaCount');
            if(!listEl) return;

            let filtered = agendaContacts;
            if (agendaFilter !== 'all') {
                filtered = agendaContacts.filter(c => c.type === agendaFilter);
            }

            const term = (document.getElementById('agendaSearch')?.value || '').toLowerCase();
            if (term) {
                filtered = filtered.filter(c => c.name.toLowerCase().includes(term) || c.phone.includes(term));
            }

            if(countEl) countEl.textContent = filtered.length + ' contactos';

            if (filtered.length === 0) {
                listEl.innerHTML = '<div style="text-align:center; padding: 32px; color: var(--text-muted); font-size: 14px;">No hay contactos encontrados.</div>';
                return;
            }

            listEl.innerHTML = filtered.map(c => {
                const icon = c.type === 'cliente' ? sUserStr : sBriefcaseStr;
                const typeColor = c.type === 'cliente' ? 'var(--info)' : 'var(--accent)';
                
                return '<div class="glass-card" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px; padding: 16px;">' +
                        '<div style="display:flex; align-items:center; gap: 12px;">' +
                            '<div style="width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; color: '+typeColor+';">' +
                                icon +
                            '</div>' +
                            '<div>' +
                                '<div style="font-weight: 600; font-size: 15px; color: var(--text-1);">' + c.name + '</div>' +
                                '<div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">' + c.phone + '</div>' +
                            '</div>' +
                        '</div>' +
                        '<button onclick="deleteContact(\\'' + c.id + '\\')" style="background:none; border:none; color: var(--danger); cursor:pointer; padding: 8px;">' + sTrashStr + '</button>' +
                    '</div>';
            }).join('');
        }

        window.deleteContact = function(id) {
            if(confirm('¿Eliminar contacto definitivamente?')) {
                agendaContacts = agendaContacts.filter(c => c.id !== id);
                saveAgenda();
            }
        };

        const tabAgenda = document.getElementById('tab-agenda');
        if (tabAgenda && !document.getElementById('btnAddContact')) {
            const addBtn = document.createElement('button');
            addBtn.id = 'btnAddContact';
            addBtn.className = 'nav-fab';
            addBtn.style.position = 'fixed';
            addBtn.style.bottom = '90px';
            addBtn.style.right = '24px';
            addBtn.style.zIndex = '100';
            addBtn.style.background = 'var(--accent)';
            addBtn.style.color = '#000';
            addBtn.style.width = '56px';
            addBtn.style.height = '56px';
            addBtn.style.borderRadius = '50%';
            addBtn.style.border = 'none';
            addBtn.style.boxShadow = '0 8px 24px rgba(212, 175, 55, 0.4)';
            addBtn.innerHTML = '<span style="font-size:28px; line-height:1; font-weight:300;">+</span>';
            addBtn.onclick = function() {
                const name = prompt('Nombre del Contacto:');
                if(!name) return;
                const phone = prompt('Teléfono:');
                if(!phone) return;
                const isClient = confirm('¿Es un Cliente? (Aceptar = Cliente, Cancelar = Proveedor)');
                const type = isClient ? 'cliente' : 'proveedor';
                agendaContacts.push({ id: Date.now().toString(), type, name, phone });
                saveAgenda();
            };
            tabAgenda.appendChild(addBtn);
        }

        document.querySelectorAll('.agenda-sub-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.agenda-sub-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                agendaFilter = btn.getAttribute('data-agenda');
                renderAgenda();
            });
        });

        const aSearch = document.getElementById('agendaSearch');
        if (aSearch) {
            aSearch.addEventListener('keyup', renderAgenda);
        }

        /* ============================================================ */
        /* MODULE: FACTURAS & GASTOS MANUALES                           */
        /* ============================================================ */
        const GASTOS_KEY = 'dulce_jaleo_gastos_manuales';
        let facturasFilter = 'all';

        function loadGastosManuales() {
            const saved = localStorage.getItem(GASTOS_KEY);
            return saved ? JSON.parse(saved) : [];
        }

        let gastosManuales = loadGastosManuales();

        function saveGastosManuales() {
            localStorage.setItem(GASTOS_KEY, JSON.stringify(gastosManuales));
            if(typeof renderFacturasYMargen === 'function') renderFacturasYMargen();
            else { renderFacturas(); if(typeof renderMargenes === 'function') renderMargenes(); }
        }

        let mockFacturasExternas = [
            { id: 'f1', type: 'FACTURA', title: 'Harinas Gómez S.L.', amount: 450.20, date: new Date().toISOString().split('T')[0] },
            { id: 'f2', type: 'TICKET', title: 'Leroy Merlin (Material)', amount: 45.00, date: new Date(Date.now() - 86400000).toISOString().split('T')[0] },
            { id: 'f3', type: 'ALBARAN', title: 'Levaduras Industriales', amount: 0, date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0] }
        ];

        function getAllDocs() {
            const manualMapped = gastosManuales.map(g => ({
                id: g.id,
                type: 'GASTOS_VARIOS',
                title: g.proveedor || g.detalles || 'Gasto Manual',
                amount: parseFloat(g.total) || 0,
                date: g.fecha
            }));
            return [...mockFacturasExternas, ...manualMapped].sort((a,b) => new Date(b.date) - new Date(a.date));
        }

        function renderFacturasYMargen() {
            renderFacturas();
            if(typeof renderMargenes === 'function') {
                renderMargenes();
            }
        }

        function renderFacturas() {
            const listEl = document.getElementById('facturasList');
            if(!listEl) return;

            let docs = getAllDocs();
            
            const total = docs.reduce((acc, d) => acc + d.amount, 0);
            const numFacturas = docs.filter(d => d.type === 'FACTURA').length;
            const numAlbaranes = docs.filter(d => d.type === 'ALBARAN').length;
            const numGastos = docs.filter(d => d.type === 'GASTOS_VARIOS' || d.type === 'TICKET').length;

            const stTot = document.getElementById('statTotal');
            const stFac = document.getElementById('statFacturas');
            const stAlb = document.getElementById('statAlbaranes');
            const stGas = document.getElementById('statGastos');
            const totalBanner = document.getElementById('totalPeriodoBanner');

            if(stTot) stTot.textContent = total.toFixed(2) + ' €';
            if(stFac) stFac.textContent = numFacturas;
            if(stAlb) stAlb.textContent = numAlbaranes;
            if(stGas) stGas.textContent = numGastos;
            if(totalBanner) totalBanner.textContent = total.toFixed(2) + ' €';

            if (facturasFilter !== 'all') {
                if (facturasFilter === 'GASTOS_VARIOS') {
                    docs = docs.filter(d => d.type === 'GASTOS_VARIOS' || d.type === 'TICKET');
                } else {
                    docs = docs.filter(d => d.type === facturasFilter);
                }
            }

            if (docs.length === 0) {
                listEl.innerHTML = '<div style="text-align:center; padding: 32px; color: var(--text-muted); font-size: 14px;">No hay documentos.</div>';
                return;
            }

            const iconMap = {
                'FACTURA': '<span style="color:var(--info)">'+sBriefcaseStr+'</span>',
                'ALBARAN': '<span style="color:var(--accent)">'+sBriefcaseStr+'</span>',
                'TICKET': '<span style="color:var(--text-1)">'+sBriefcaseStr+'</span>',
                'GASTOS_VARIOS': '<span style="color:var(--danger)">'+sTrashStr.replace('lucide-trash-2','lucide-receipt')+'</span>' // placeholder icon
            };

            listEl.innerHTML = docs.map(d => {
                const isGasto = (d.type === 'GASTOS_VARIOS' || d.type === 'TICKET');
                const borderColor = isGasto ? 'var(--danger)' : d.type === 'FACTURA' ? 'var(--info)' : 'var(--accent)';
                return '<div class="glass-card" style="margin-bottom: 12px; padding: 16px; border-left: 4px solid ' + borderColor + ';">' +
                    '<div style="display:flex; justify-content:space-between; align-items:center;">' +
                        '<div>' +
                            '<div style="font-weight: 600; font-size: 15px; color: var(--text-1); margin-bottom:4px;">' + d.title + '</div>' +
                            '<div style="font-size: 12px; color: var(--text-muted);">' + d.date + ' • ' + d.type.replace('_',' ') + '</div>' +
                        '</div>' +
                        '<div style="text-align:right;">' +
                            '<div style="font-weight: 700; font-size: 16px; color: var(--text-1);">' + (d.amount > 0 ? '-' + d.amount.toFixed(2) : '0.00') + ' €</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            }).join('');
        }

        document.querySelectorAll('.sub-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                facturasFilter = btn.getAttribute('data-filter');
                renderFacturas();
            });
        });

        const btnManual = document.getElementById('btnManualEntry');
        const manualModal = document.getElementById('manualModal');
        const closeManualBtn = document.getElementById('closeManualModal');
        const saveManualBtn = document.getElementById('saveManualBtn');

        if(btnManual && manualModal && closeManualBtn && saveManualBtn) {
            btnManual.addEventListener('click', () => manualModal.classList.add('active'));
            closeManualBtn.addEventListener('click', () => manualModal.classList.remove('active'));
            saveManualBtn.addEventListener('click', () => {
                const prov = document.getElementById('mProveedor').value;
                const total = document.getElementById('mTotal').value;
                const fecha = document.getElementById('mFecha').value || new Date().toISOString().split('T')[0];
                const det = document.getElementById('mDetalles').value;

                if (!total) { alert('El total es obligatorio'); return; }

                gastosManuales.push({
                    id: 'm_' + Date.now(),
                    proveedor: prov,
                    total: parseFloat(total),
                    fecha: fecha,
                    detalles: det
                });

                saveGastosManuales();
                manualModal.classList.remove('active');
                
                document.getElementById('mProveedor').value = '';
                document.getElementById('mTotal').value = '';
                document.getElementById('mDetalles').value = '';
                document.getElementById('mFecha').value = '';
                
                alert('Gasto manual añadido correctamente');
            });
        }

        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                renderAgenda();
                renderFacturasYMargen(); 
            }, 300);
        });
`;

// Inject before closing script tag safely
content = content.replace("</script>\r\n</body>", additionalJS + "\n    </script>\n</body>");
content = content.replace("</script>\n</body>", additionalJS + "\n    </script>\n</body>");

fs.writeFileSync(targetFile, content);
console.log("Agenda and Factura modules logical functions injected successfully.");
