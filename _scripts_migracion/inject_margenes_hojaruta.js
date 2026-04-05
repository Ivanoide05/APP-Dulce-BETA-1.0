const fs = require('fs');
const targetFile = 'c:\\Users\\ivanr\\Desktop\\IA\\Dulce_Jaleo_Proyecto_Completo\\index.html';
let content = fs.readFileSync(targetFile, 'utf8');

const sBriefcaseStr = '<span style="display:inline-flex; align-items:center; justify-content:center; margin-right:4px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide" ><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg></span>';
const sUp = '<span style="display:inline-flex; align-items:center; justify-content:center; margin-right:4px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide" ><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg></span>';

const margenesJS = `
        /* ============================================================ */
        /* MODULE: MARGENES (Beneficios) & HOJA DE RUTA                 */
        /* ============================================================ */
        
        let ventasSemanales = parseFloat(localStorage.getItem('dulce_jaleo_ventas_semanales')) || 2500;

        function saveVentas() {
            const inputVal = document.getElementById('ventaSemanalInput').value;
            if (inputVal) {
                ventasSemanales = parseFloat(inputVal);
                localStorage.setItem('dulce_jaleo_ventas_semanales', ventasSemanales);
                renderMargenes();
                alert('Ventas estimadas actualizadas');
            }
        }

        const btnSaveVenta = document.getElementById('saveVentaBtn');
        if (btnSaveVenta) {
            btnSaveVenta.addEventListener('click', saveVentas);
        }

        function renderMargenes() {
            const inputVenta = document.getElementById('ventaSemanalInput');
            if (inputVenta) inputVenta.value = ventasSemanales;

            // Gather Expenses
            let docs = [];
            if (typeof getAllDocs === 'function') {
                docs = getAllDocs();
            }
            
            const totalGastos = docs.reduce((acc, d) => acc + d.amount, 0);
            
            // Margen calculations
            const ingresosEst = ventasSemanales * 4.33; // Mensual aproximado
            const margenABS = ingresosEst - totalGastos;
            const margenPct = ingresosEst > 0 ? (margenABS / ingresosEst) * 100 : 0;

            // Update UI
            const mValEl = document.getElementById('margenValor');
            const mSubEl = document.getElementById('margenSub');
            const mBarEl = document.getElementById('margenBar');
            
            if(mValEl) mValEl.textContent = margenPct.toFixed(1) + '%';
            if(mValEl) {
                mValEl.className = 'margin-value'; // reset
                if (margenPct >= 50) mValEl.classList.add('success');
                else if (margenPct >= 25) mValEl.classList.add('warning');
                else mValEl.classList.add('danger');
            }
            
            if(mSubEl) mSubEl.textContent = 'Beneficio est: ' + margenABS.toFixed(2) + ' € / mes';
            if(mBarEl) mBarEl.style.width = Math.min(Math.max(margenPct, 0), 100) + '%';

            // Stats row update
            const mgEl = document.getElementById('mGastos');
            const miEl = document.getElementById('mIngresos');
            const mdEl = document.getElementById('mFacturas');
            
            if(mgEl) mgEl.textContent = totalGastos.toFixed(0) + ' €';
            if(miEl) miEl.textContent = ingresosEst.toFixed(0) + ' €';
            if(mdEl) mdEl.textContent = docs.length;

            // Update Breakdown Breakdown
            const bkEl = document.getElementById('catBreakdownList');
            if(bkEl) {
                const grouped = { 'FACTURA': 0, 'ALBARAN': 0, 'GASTOS_VARIOS': 0, 'TICKET': 0 };
                docs.forEach(d => { if(grouped[d.type] !== undefined) grouped[d.type] += d.amount; });
                
                bkEl.innerHTML = Object.keys(grouped).filter(k => grouped[k] > 0).map(k => {
                    const pct = totalGastos > 0 ? (grouped[k]/totalGastos)*100 : 0;
                    return '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">' +
                                '<div style="font-size:13px; color:var(--text-1);">' + k.replace('_',' ') + '</div>' +
                                '<div style="display:flex; align-items:center; gap:8px;">' +
                                    '<div style="width: 100px; height: 6px; background: rgba(255,255,255,0.05); border-radius:3px; overflow:hidden;">' +
                                        '<div style="width: '+pct+'%; height:100%; background: var(--accent);"></div>' +
                                    '</div>' +
                                    '<div style="font-size:12px; color:var(--text-muted); width: 40px; text-align:right;">'+grouped[k].toFixed(0)+'€</div>' +
                                '</div>' +
                            '</div>';
                }).join('');
            }
            
            renderHojaRuta(margenPct, totalGastos);
        }

        // Hoja de Ruta automatic dynamic alerts injection
        function renderHojaRuta(margenPct, totalGastos) {
            const listEl = document.getElementById('alertasList');
            if(!listEl) return;
            
            let alertHtml = '';
            
            if (margenPct < 30) {
                alertHtml += '<div class="alert-card danger" style="margin-bottom:12px;">' +
                    '<div class="alert-icon">⚠️</div>' +
                    '<div class="alert-body">' +
                        '<div class="alert-title">Alerta Riesgo de Beneficio</div>' +
                        '<div class="alert-desc">El margen está por debajo del 30%. Tus gastos acumulados (' + totalGastos.toFixed(0) + '€) son muy altos respecto a la venta de ' + ventasSemanales + '€ semanales.</div>' +
                        '<span class="alert-badge badge-danger">Revisar Precios</span>' +
                    '</div>' +
                '</div>';
            } else if (margenPct > 60) {
                 alertHtml += '<div class="alert-card success" style="margin-bottom:12px;">' +
                    '<div class="alert-icon">⭐</div>' +
                    '<div class="alert-body">' +
                        '<div class="alert-title">Margen Excelente</div>' +
                        '<div class="alert-desc">Mantienes un beneficio operativo extraordinario (>60%). ¡Sigue así!</div>' +
                        '<span class="alert-badge badge-success">Saludable</span>' +
                    '</div>' +
                '</div>';
            }

            // Mock Data integration for demonstration
            alertHtml += '<div class="alert-card warning" style="margin-bottom:12px;">' +
                    '<div class="alert-icon">'+sUp+'</div>' +
                    '<div class="alert-body">' +
                        '<div class="alert-title">Sube el precio del trigo</div>' +
                        '<div class="alert-desc">La última factura de harina reflejó 1.35€/kg. El mes pasado pagabas 0.98€/kg. Revisa con tu proveedor.</div>' +
                        '<span class="alert-badge badge-warning">↑ +37% vs mes anterior</span>' +
                    '</div>' +
                    '<div class="alert-time">Hoy</div>' +
                '</div>';

            listEl.innerHTML = alertHtml;
        }

`;

content = content.replace("</script>\n</body>", margenesJS + "\n    </script>\n</body>");

fs.writeFileSync(targetFile, content);
console.log("Margenes and Hoja de Ruta JS logic implanted successfully.");
