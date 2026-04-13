# 🍞 DulceOS — Historial de Implementaciones

> Documento vivo de todos los avances del proyecto. Actualizado cronológicamente.
> Mantenido por: Antigravity AI + Iván

---

## 📅 Sesión: 13–14 Abril 2026

### 🎯 Objetivo de la sesión
- Estabilizar el módulo Sanidad para auditorías reales
- Resolver errores de autenticación con Airtable y Gemini
- Subir el trabajo a la rama `development` de GitHub

---

### ✅ Implementado

#### 1. Módulo Sanidad — Registros Editables
- Los registros de **Temperatura**, **Limpieza diaria** y **Producción diaria** ahora se pueden editar *a posteriori*
- Se añadió botón de edición (lápiz) por registro que abre un modal de edición inline
- Los cambios se guardan vía `PATCH` a Airtable
- El formulario respeta el tipo de dato por campo (número, texto, selector, fecha)
- **Archivos afectados:** `index.html` (módulo Sanidad), `backend/routes/api.js`

#### 2. Backend — Proxy Airtable Hardening
- Se añadió soporte **multi-tenant** real: el `airtable_base_id` puede venir del JWT del usuario o de las cabeceras HTTP `x-airtable-base-id` y `x-airtable-token`
- El `authMiddleware` hace **bypass en localhost** (sin necesidad de login en desarrollo)
- Rate limiting: 20 req/min en scanner, 500 req/10min general
- **Archivos afectados:** `backend/server.js`, `backend/lib/authMiddleware.js`, `backend/routes/api.js`

#### 3. Gema AI — Auditora de Gastos
- Nuevo endpoint `POST /api/ai/analyze-expenses`
- Recibe datos de gastos y mermas del mes y devuelve análisis estructurado en JSON
- Sistema de **fallback de modelos Gemini**: prueba `gemini-flash-latest` → `flash-lite` → `gemini-2.0-flash-001` etc.
- La IA devuelve: `fugaPrincipal` + 3 `recomendaciones` prácticas
- **Archivos afectados:** `backend/routes/api.js`

#### 4. Scanner de Facturas — Multi-model Fallback
- El escáner también tiene fallback automático entre modelos de Gemini si uno falla (quota, model not found, etc.)
- Logs detallados en terminal de qué modelo está intentando y cuál tuvo éxito
- **Archivos afectados:** `backend/routes/webhooks.js`

#### 5. Service Worker — Network First
- Reescrito a estrategia **Network First** correcta
- Los archivos `.html` nunca se cachean (siempre sirve la versión más nueva)
- Solo se cachean assets estáticos: `manifest.json`, iconos PNG
- **Archivos afectados:** `sw.js`, `public/sw.js`

#### 6. API Client Frontend — Dual Mode
- `public/js/api.js` tiene modo dual: intenta el proxy backend primero, con fallback directo a Airtable si el servidor no está
- Cabeceras automáticas de autenticación: JWT + token de Airtable desde localStorage
- **Archivos afectados:** `public/js/api.js`

---

### 🐛 Bugs Detectados y Resueltos

| Bug | Causa | Solución |
|-----|-------|---------|
| Error 403 en `/api/records` | API Key de Airtable incorrecta en `.env` (se había pegado una key de Google) | Regenerar PAT de Airtable en airtable.com/create/tokens |
| "Claves no configuradas" en browser | LocalStorage vacío + server no respondía | Arreglar key del servidor; el fallback directo necesita claves en localStorage |
| "requested model was not found" | Se usaba `gemini-3-flash-preview` (no disponible en esa key) | Sistema de fallback multi-modelo |
| Service Worker cacheaba HTML viejo | Cache-first strategy incorrecta | Reescribir SW a Network-First |

---

### 📦 Estado del Repositorio

| Rama | Estado |
|------|--------|
| `master` | Producción estable (Vercel) |
| `development` | ✅ Actualizado con esta sesión |
| `feature/entrega-final-eze` | Rama de trabajo activa de Iván |
| `backend-seguro` | Rama antigua de experimentos backend |

**Commit de esta sesión:**
```
feat(dulceos): Backend hardening, Sanidad editable logs, Gema AI expense auditor,
multi-model Gemini fallback, CORS fix, API proxy improvements
```

---

### 🔑 Variables de Entorno Requeridas (backend/.env)

```env
AIRTABLE_API_KEY=pat...   ← Personal Access Token de Airtable (sin puntos)
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
GEMINI_API_KEY=AIzaSy...
PORT=3001
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
JWT_SECRET=...cadena larga aleatoria...
```

---

### 📝 Lecciones Aprendidas

1. **Las PAT de Airtable nunca llevan puntos.** Si ves un punto en la key, es de otro servicio.
2. **Siempre verificar los nombres de modelos de Gemini.** Cambian frecuentemente; usar siempre un array de fallback.
3. **El Service Worker puede envenenar el caché.** Ante cualquier duda de "la app no actualiza", revisar el SW primero.
4. **El authMiddleware de localhost es un bypass intencional.** No es un bug, es una feature de desarrollo.
5. **No mezclar API Keys entre servicios.** Crearlas y etiquetarlas claramente en el gestor de secretos.

---

## 📅 Sesiones Anteriores (Resumen)

### Marzo–Abril 2026: Fase de Fundación
- Creación del backend Express con proxy seguro a Airtable
- Sistema de autenticación JWT + Supabase
- Módulos: Dashboard, Facturas, Albaranes, Gastos, Agenda, Pedidos
- Scanner de documentos con Gemini Vision
- PWA completa con manifest y Service Worker
- Despliegue en Vercel con serverless functions
- Módulo RRHH (Recursos Humanos)
- Módulo Sanidad APPCC (primera versión: solo creación de registros)
- Rebrand a DulceOS para arquitectura multi-tenant SaaS

---

*Actualizado: 14/04/2026 — Antigravity AI*
