---
name: premium-ux-toolchain
description: Implementa el toolchain premium de 6 pasos para Dulce y Jaleo. Incluye GSAP, SweetAlert2, Toastify, ApexCharts, Fuse.js, LocalForage, Image Compression, Shimmer Skeletons y micro-interacciones. Transforma la app en una experiencia nativa iOS de lujo.
---

# Premium UX Toolchain – Dulce y Jaleo

Skill que define las herramientas, CDNs, patrones de uso y orden de implementación para transformar la WebApp en una experiencia premium nivel Apple.

## CDN Dependencies (Todas via script tag, sin npm)

```html
<!-- PASO 2: GSAP (Animaciones fluidas) -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>

<!-- PASO 4: SweetAlert2 (Alertas bonitas) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"></script>

<!-- PASO 4: Toastify (Notificaciones toast) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">
<script src="https://cdn.jsdelivr.net/npm/toastify-js"></script>

<!-- PASO 4: Browser Image Compression (Compresión de fotos) -->
<script src="https://cdn.jsdelivr.net/npm/browser-image-compression@2/dist/browser-image-compression.js"></script>

<!-- PASO 5: ApexCharts (Gráficas interactivas) -->
<script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>

<!-- PASO 5: Fuse.js (Búsqueda fuzzy) -->
<script src="https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.min.js"></script>

<!-- PASO 5: LocalForage (Almacenamiento offline IndexedDB) -->
<script src="https://cdn.jsdelivr.net/npm/localforage@1.10.0/dist/localforage.min.js"></script>
```

---

## PASO 1: ADN Visual – CSS Purismo

### Qué hacer
- Rediseñar las CSS Variables `:root` para el Design System "Caramel Glaze"
- Sombras por capas (3 niveles de profundidad)
- Border-radius uniformes: `24px` tarjetas, `16px` inputs, `50px` pills
- Tipografía: Inter (UI) + Playfair Display (logo) + Outfit (números)
- Modo Claro `#FBFBFD` / Modo Oscuro `#1C1C1E` perfectos

### Patrón de sombras por capas
```css
/* Nivel 1: Sutil (tarjetas) */
--shadow-sm: 0 2px 8px rgba(0,0,0,0.04);
/* Nivel 2: Medio (cards activas, hovers) */
--shadow-md: 0 8px 30px rgba(0,0,0,0.06);
/* Nivel 3: Elevado (modales, dropdowns) */
--shadow-lg: 0 16px 48px rgba(0,0,0,0.1);
```

---

## PASO 2: GSAP – Alma del Movimiento

### Entradas en cascada (stagger)
```javascript
// Animar tarjetas al entrar en una pestaña
gsap.from('.factura-card', {
    y: 30, opacity: 0, duration: 0.4,
    stagger: 0.08, ease: 'power2.out'
});
```

### Transiciones entre pestañas
```javascript
function switchTab(oldTab, newTab, direction) {
    // Sale la pestaña actual
    gsap.to(oldTab, {
        x: direction === 'left' ? -60 : 60,
        opacity: 0, duration: 0.25, ease: 'power2.in',
        onComplete: () => {
            oldTab.classList.remove('active');
            newTab.classList.add('active');
            // Entra la nueva
            gsap.fromTo(newTab,
                { x: direction === 'left' ? 60 : -60, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }
            );
        }
    });
}
```

### Hover / Active bounce en botones
```javascript
// Registrar en todos los botones interactivos
document.querySelectorAll('.btn, .nav-btn, .factura-card').forEach(el => {
    el.addEventListener('pointerdown', () => {
        gsap.to(el, { scale: 0.96, duration: 0.12, ease: 'power2.out' });
    });
    el.addEventListener('pointerup', () => {
        gsap.to(el, { scale: 1, duration: 0.3, ease: 'elastic.out(1, 0.4)' });
    });
});
```

---

## PASO 3: Shimmer Skeletons (CSS Puro)

### CSS del Skeleton
```css
.skeleton {
    background: linear-gradient(90deg,
        var(--surface) 25%,
        rgba(255,255,255,0.3) 50%,
        var(--surface) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
    border-radius: 12px;
}
.skeleton-text { height: 14px; margin-bottom: 8px; width: 70%; }
.skeleton-title { height: 20px; margin-bottom: 12px; width: 50%; }
.skeleton-card { height: 80px; margin-bottom: 10px; }

@keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
```

### Uso
Mostrar skeleton inmediatamente al cambiar de pestaña, reemplazar con datos reales cuando `fetchGlobalData()` resuelve.

---

## PASO 4: UX Profesional

### SweetAlert2 – Reemplazar alert()
```javascript
// Éxito al procesar factura
Swal.fire({
    icon: 'success',
    title: '¡Documento Procesado!',
    text: 'Factura guardada en Airtable',
    confirmButtonColor: '#E78A22',
    timer: 2500,
    showConfirmButton: false
});

// Error
Swal.fire({
    icon: 'error',
    title: 'Error de conexión',
    text: err.message,
    confirmButtonColor: '#E78A22'
});

// Confirmación de eliminación
const result = await Swal.fire({
    title: '¿Eliminar contacto?',
    text: 'Esta acción no se puede deshacer',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#EF4444',
    cancelButtonColor: '#888',
    confirmButtonText: 'Sí, eliminar'
});
```

### Toastify – Notificaciones no intrusivas
```javascript
Toastify({
    text: "✅ Configuración guardada",
    duration: 3000,
    gravity: "top",
    position: "center",
    style: {
        background: "linear-gradient(to right, #E78A22, #D97706)",
        borderRadius: "12px",
        fontFamily: "'Inter', sans-serif",
        fontWeight: "600",
        fontSize: "14px"
    }
}).showToast();
```

### Browser Image Compression
```javascript
async function compressBeforeUpload(file) {
    const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/jpeg'
    };
    try {
        return await imageCompression(file, options);
    } catch (e) {
        console.warn('Compression failed, using original:', e);
        return file;
    }
}
```

---

## PASO 5: Cerebro Financiero

### ApexCharts – Gráfica de Márgenes
```javascript
const chartOptions = {
    chart: {
        type: 'area', height: 220,
        toolbar: { show: false },
        fontFamily: 'Inter, sans-serif',
        animations: { enabled: true, easing: 'easeinout', speed: 800 }
    },
    colors: ['#E78A22', '#10B981'],
    fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 }
    },
    stroke: { curve: 'smooth', width: 2.5 },
    series: [
        { name: 'Gastos', data: [/* mensual */] },
        { name: 'Ingresos', data: [/* mensual */] }
    ],
    xaxis: { categories: ['Ene','Feb','Mar','Abr','May','Jun'] },
    tooltip: { theme: 'light' }
};
const chart = new ApexCharts(document.querySelector("#marginChart"), chartOptions);
chart.render();
```

### Fuse.js – Búsqueda Fuzzy en Agenda
```javascript
const fuse = new Fuse(contactos, {
    keys: ['nombre', 'telefono', 'email', 'categoria'],
    threshold: 0.3,
    distance: 100
});
// Al escribir en el buscador
const results = fuse.search(query);
renderContacts(results.map(r => r.item));
```

### LocalForage – Almacenamiento offline
```javascript
// Guardar datos de Airtable en caché local
await localforage.setItem('dulce_stats', globalStats);
await localforage.setItem('dulce_contacts', contactos);

// Cargar desde caché (para inicio offline)
const cached = await localforage.getItem('dulce_stats');
if (cached) { globalStats = cached; renderDashboard(); }
```

---

## PASO 6: Pulido de Diamante

### Glass Shine Effect (CSS)
```css
.btn-primary::after {
    content: '';
    position: absolute;
    top: -50%; left: -50%;
    width: 200%; height: 200%;
    background: linear-gradient(
        45deg, transparent 30%,
        rgba(255,255,255,0.15) 50%,
        transparent 70%
    );
    transform: translateX(-100%);
    transition: transform 0.6s ease;
    pointer-events: none;
}
.btn-primary:hover::after,
.btn-primary:active::after {
    transform: translateX(100%);
}
```

### Haptic Feedback (con fallback)
```javascript
function haptic(style = 'light') {
    // Android / Chrome: navigator.vibrate
    if ('vibrate' in navigator) {
        const patterns = { light: 10, medium: 25, heavy: 50 };
        navigator.vibrate(patterns[style] || 10);
    }
    // iOS: CSS visual feedback (scale bounce via GSAP) como alternativa
}
```

> **Nota**: `navigator.vibrate` NO funciona en iOS Safari. Se usa como fallback visual los efectos scale de GSAP para simular la sensación táctil en Apple.

---

## Orden de implementación recomendado

1. **Paso 1** (CSS) → Base visual, sin dependencias
2. **Paso 3** (Skeletons) → CSS puro, mejora percepción inmediata
3. **Paso 2** (GSAP) → CDN, anima todo lo existente
4. **Paso 4** (SweetAlert2 + Toastify + Compression) → CDN, reemplazar alerts
5. **Paso 5** (ApexCharts + Fuse + LocalForage) → CDN, inteligencia
6. **Paso 6** (Glass shine + Haptics) → Micro-detalles finales
