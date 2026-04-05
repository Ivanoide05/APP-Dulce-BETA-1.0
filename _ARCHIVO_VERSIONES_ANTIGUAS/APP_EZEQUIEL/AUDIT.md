# AUDITORÍA DEL PROYECTO — Dulce y Jaleo App
**Fecha**: 2026-03-31
**Objetivo**: Implementar sistema de autenticación con Supabase + JWT

---

## 1. Estructura de Archivos

```
APP EZEQUIEL/
├── index.html                    [289 KB] App principal PWA
├── admin.html                    [16 KB]  Panel admin "Master Control V6"
├── master_control.html           [16 KB]  Copia del panel admin
├── dulce-jaleo-app.html          [114 KB] Versión legacy
├── agenda.js                     [2 KB]   Módulo contactos
├── manifest.json                 PWA manifest
├── icon-192.png / icon-512.png   Iconos PWA
├── public/
│   ├── index.html                Copia de la app
│   ├── manifest.json             PWA manifest
│   ├── agenda.js                 Módulo contactos
│   └── js/
│       └── api.js                [88 líneas] Cliente API frontend
├── backend/
│   ├── server.js                 Servidor Express principal
│   ├── server.prod.js            Variante producción
│   ├── package.json              Dependencias (cors, dotenv, express)
│   ├── deploy_easypanel.js       Script despliegue Easypanel
│   └── routes/
│       ├── api.js                [117 líneas] Proxy seguro Airtable
│       └── webhooks.js           [244 líneas] Gemini OCR + WhatsApp
└── stage/
    └── index.html                Versión staging
```

## 2. Panel Admin Existente

**Archivo**: `admin.html` (y copia en `master_control.html`)
- Nombre: "Master Control V6 - Flota SaaS"
- Tema: Cyberpunk (neon verde sobre negro)
- **Credenciales hardcodeadas**: usuario `ezequiel`, contraseña `1`
- Conecta DIRECTAMENTE a Airtable desde el frontend con PAT en localStorage
- Lee tabla "Empresarios" de Airtable base `appS76pMhbe366y5P`
- Dos vistas: "Flota de Clientes" y "Métricas SaaS"
- **Riesgo de seguridad**: PAT de Airtable expuesto en cliente

## 3. Backend (Express en Easypanel)

**Servidor**: `backend/server.js` — Express en puerto 3001
**Despliegue**: `dulce-y-jaleo-backend.xm1sa3.easypanel.host`
**NO es Vercel Serverless Functions** — es Express clásico

### Rutas existentes:
| Ruta | Método | Función |
|------|--------|---------|
| `/api/records` | GET | Todos los registros (3 tablas) |
| `/api/records/:table` | GET | Registros de una tabla |
| `/api/records/:table` | POST | Crear registro |
| `/api/config` | GET | Config pública |
| `/webhook/scan-invoice` | POST | OCR con Gemini |
| `/webhook/whatsapp-order` | POST | Pedidos WhatsApp |
| `/webhook/lovable-webhook` | POST | Compat n8n |
| `/health` | GET | Health check |

### Dependencias actuales:
- cors ^2.8.5
- dotenv ^16.4.7
- express ^4.21.2

## 4. Airtable Base IDs Hardcodeados

| Ubicación | Valor | Tipo |
|-----------|-------|------|
| `admin.html:187` | `appS76pMhbe366y5P` | DEFAULT_BASE constante |
| `backend/routes/api.js:9` | env var `AIRTABLE_BASE_ID` | Variable de entorno |
| `backend/routes/api.js:13-15` | `tblLC7oMOUQtRWkn7`, `tblX9EQUmwItNJCZI`, `tblHzVIPEde7zWnUv` | Table IDs fallback |
| `backend/routes/webhooks.js:9` | env var `AIRTABLE_BASE_ID` | Variable de entorno |
| `backend/deploy_easypanel.js` | `tbl2mXyo6cpCQpLL9`, `tbl0T9iOA6l4sbwvQ`, `tbloFQDdyjTX5d5PQ` | Table IDs diferentes |

**Nota**: Hay DOS sets diferentes de Table IDs (los de api.js vs los de deploy_easypanel.js).

## 5. Sistema Dark/Light Mode

- CSS variables en `:root` (claro) y `body.dark-theme` (oscuro)
- Toggle con `document.body.classList.toggle('dark-theme')`
- Persistido en `localStorage.dulce_jaleo_theme`
- Paleta claro: `--bg-page: #f8f9fb`, `--bg-card: #ffffff`
- Paleta oscuro: `--bg-page: #0a0a0a`, `--bg-card: #151515`

## 6. Librerías Externas

- **Google Fonts**: Manrope, Outfit, Inter
- **Lucide Icons**: unpkg.com/lucide@latest
- **NO hay SweetAlert2** — necesario añadir CDN
- **NO hay Toastify** — necesario añadir CDN

## 7. Frontend API Client

**Archivo**: `public/js/api.js`
- Endpoint: `https://dulce-y-jaleo-backend.xm1sa3.easypanel.host`
- **No envía headers de autenticación** actualmente
- Objeto global `DulceAPI` con métodos fetch

## 8. Hallazgos de Seguridad

1. ❌ admin.html conecta directamente a Airtable con PAT en localStorage
2. ❌ Credenciales admin hardcodeadas (ezequiel/1)
3. ❌ No hay autenticación en las rutas del backend
4. ❌ Cualquiera puede llamar a /api/records sin token
5. ✅ API keys de Airtable y Gemini en .env del servidor
6. ✅ Frontend no tiene acceso a tokens de Airtable (excepto admin.html)

---

## Decisión Arquitectónica Clave

El proyecto usa **Express en Easypanel**, no Vercel Serverless Functions.
Toda la implementación de auth se hará como **rutas Express y middleware**,
adaptando el diseño original del prompt a la arquitectura real del proyecto.
