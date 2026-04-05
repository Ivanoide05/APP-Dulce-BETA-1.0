
        // ===== PUNTO ÚNICO DE INICIALIZACIÓN =====
        // Todo se ejecuta AQUÍ, cuando el DOM ya existe al 100%
        document.addEventListener('DOMContentLoaded', () => {
            // 1. Restaurar el tema guardado ANTES de renderizar iconos
            const savedTheme = localStorage.getItem('dulce_jaleo_theme');
            const isDark = savedTheme === 'dark';
            if (isDark) {
                document.body.classList.add('dark-theme');
            } else {
                document.body.classList.remove('dark-theme');
            }

            // 2. Actualizar el icono del botón de tema al correcto (sol o luna)
            const themeBtn = document.getElementById('btn-theme-toggle');
            if (themeBtn) {
                themeBtn.innerHTML = '<i data-lucide="' + (isDark ? 'sun' : 'moon') + '"></i>';
            }

            // 3. UNA SOLA llamada a Lucide para renderizar TODOS los iconos de la página
            if (typeof lucide !== 'undefined') {
                lucide.createIcons({ attrs: { 'stroke-width': 1.8, 'stroke': 'currentColor' } });
            }

            // 4. Ocultar splash screen
            setTimeout(() => {
                const s = document.querySelector('.splash-screen');
                if (s) s.classList.add('hide');
            }, 500);

            // 5. Activar tab inicial
            try {
                activateTab('inicio');
            } catch(e) {
                console.error('Error durante la activación inicial de pestañas:', e);
            }

            // 6. Pre-fetch de datos en background — cuando termina, pinta Facturas si está activa
            if (!globalStats.loaded) {
                fetchGlobalData()
                    .then(() => {
                        const facturasTab = document.getElementById('tab-facturas');
                        if (facturasTab && facturasTab.classList.contains('active')) {
                            _renderFacturasFromMemory();
                        }
                        try { updateDashboardPremium(); } catch(e) {}
                    })
                    .catch(() => {});
            }
        });
    