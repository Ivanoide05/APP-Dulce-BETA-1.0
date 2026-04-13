# 👋 Hola Ezequiel — Todo lo que necesitas saber para trabajar en DulceOS

> Documento preparado por Iván + Antigravity AI — Actualizado: 14/04/2026
> Este doc te pone al día de todo lo que hemos montado y cómo arrancar limpio.

---

## 🗺️ ¿Qué es este proyecto?

**DulceOS** es una plataforma SaaS B2B para panaderías y pastelerías. Actualmente está en BETA operando para **Dulce y Jaleo** como cliente piloto, pero la arquitectura ya está preparada para ser multi-tenant (varios negocios usando la misma plataforma).

La app es una **PWA (Progressive Web App)** que funciona en móvil y escritorio, con backend en Node.js que hace de intermediario seguro entre el frontend y las APIs externas (Airtable como base de datos, Gemini como IA).

---

## 🏗️ Estructura del Proyecto

```
Dulce_Jaleo_Proyecto_Completo/
├── index.html              ← App principal completa (frontend monolítico, ~8000 líneas)
├── login.html              ← Pantalla de inicio de sesión
├── admin.html              ← Panel de administración de clientes
├── sw.js                   ← Service Worker (PWA)
├── manifest.json           ← Configuración PWA (iconos, nombre, etc.)
│
├── backend/                ← Servidor Node.js (Express)
│   ├── server.js           ← Punto de entrada del servidor
│   ├── .env                ← Credenciales (NO está en Git, te lo pasa Iván)
│   ├── routes/
│   │   ├── api.js          ← Proxy a Airtable + endpoint de IA (Gema)
│   │   ├── auth.js         ← Login, generación de JWT
│   │   ├── admin.js        ← Gestión de clientes (crear, editar, eliminar)
│   │   └── webhooks.js     ← Scanner de facturas con Gemini Vision
│   └── lib/
│       └── authMiddleware.js ← Validación de tokens JWT
│
├── public/                 ← Versión alternativa servida estáticamente
│   ├── index.html
│   ├── js/
│   │   ├── api.js          ← Cliente API del frontend (dual mode: proxy / directo)
│   │   └── dashboard.js    ← Lógica del dashboard
│   └── sw.js
│
└── PROTOCOLO_SANTO_GRIAL.md ← Protocolo de git (léelo)
```

---

## ⚙️ Cómo arrancar el proyecto en local

### Paso 1: Clona la rama de desarrollo

```bash
git clone https://github.com/Ivanoide05/APP-Dulce-BETA-1.0.git
cd APP-Dulce-BETA-1.0
git checkout development
git pull origin development
```

### Paso 2: Instala dependencias del backend

```bash
cd backend
npm install
```

### Paso 3: Crea tu archivo `.env`

La carpeta `backend/` necesita un archivo llamado `.env` con este contenido exacto
(pídele a Iván los valores reales, él los tiene):

```env
# Airtable — Base de datos
AIRTABLE_API_KEY=pat...       ← Personal Access Token (empieza por "pat", SIN PUNTOS)
AIRTABLE_BASE_ID=appXXXXXXXX  ← ID de la base de Airtable

# Google Gemini — IA
GEMINI_API_KEY=AIzaSy...

# Servidor
PORT=3001

# Supabase — Autenticación de usuarios
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...

# JWT — Firma de sesiones
JWT_SECRET=...cadena larga aleatoria...
```

> ⚠️ **IMPORTANTE:** El archivo `.env` está en el `.gitignore`. NUNCA lo subas a Git.
> Si lo subes por error, las claves quedan expuestas públicamente y hay que regenerarlas todas.

### Paso 4: Arranca el servidor

```bash
# Desde la carpeta backend/
node server.js

# O si tienes nodemon instalado (recomendado para desarrollo):
npx nodemon server.js
```

Verás este output si todo va bien:
```
  🍞 Dulce y Jaleo Backend
  ✅ Servidor corriendo en: http://localhost:3001
  🔐 Auth:     http://localhost:3001/api/auth
  👤 Admin:    http://localhost:3001/api/admin
  📡 API:      http://localhost:3001/api
  🔗 Webhooks: http://localhost:3001/webhook
  💻 Frontend: http://localhost:3001/index.html
```

### Paso 5: Abre la app

```
http://localhost:3001
```

> **Nota:** En localhost el backend hace bypass de autenticación automáticamente.
> No necesitas contraseña para probar en local.

---

## 🔌 Arquitectura Técnica

```
[Navegador]
    │
    ├─ GET http://localhost:3001/      → Sirve index.html (frontend)
    │
    └─ Llamadas API:
         ├─ /api/records              → Proxy a Airtable (GET datos)
         ├─ /api/records/:tabla/:id   → Proxy PATCH (editar registro)
         ├─ /api/auth/login           → Autenticación con JWT
         ├─ /api/admin                → Gestión de clientes
         ├─ /api/ai/analyze-expenses  → Análisis IA con Gemini (Gema)
         └─ /webhook/scan-invoice     → Scanner de facturas con Gemini Vision

[Servidor Express (backend/server.js)]
    │
    ├─── Airtable API  → Base de datos real del negocio
    ├─── Google Gemini → IA para scanner y auditoría de gastos
    └─── Supabase      → Gestión de usuarios y sesiones
```

---

## 📱 Módulos de la App

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| **Dashboard** | ✅ Estable | Métricas clave, gráficas de ingresos/gastos, carrusel de KPIs |
| **Facturas** | ✅ Estable | Lista, filtros, creación manual |
| **Albaranes** | ✅ Estable | Gestión de albaranes de proveedor |
| **Gastos** | ✅ Estable | Registro de gastos varios |
| **Agenda** | ✅ Estable | Directorio de proveedores y clientes |
| **Pedidos** | ✅ Estable | Gestión de pedidos de clientes |
| **Márgenes** | ✅ Estable | Análisis de rentabilidad por producto |
| **Scanner** | ✅ Estable | OCR con Gemini Vision para facturas |
| **Gema AI** | ✅ Nuevo | Auditora IA de gastos y mermas |
| **RRHH** | ✅ Estable | Gestión de empleados, turnos, nóminas |
| **Sanidad** | 🔧 En mejora | Registros APPCC: temperatura, limpieza, producción — ahora editables |
| **Admin Panel** | ✅ Estable | Gestión multi-cliente (solo admin.html) |

---

## 🌿 Flujo de Ramas Git

```
master          ← Producción (Vercel). Solo se toca para releases.
   └── development  ← Integración. Aquí llegan todos los cambios antes de producción.
          └── feature/entrega-final-eze  ← Rama de trabajo de Iván
          └── (tu-nombre/feature-que-trabajes)  ← Tu rama de trabajo
```

### Tu flujo de trabajo:

```bash
# 1. Siempre parte de development actualizado
git checkout development
git pull origin development

# 2. Crea tu rama para lo que vas a trabajar
git checkout -b ezequiel/nombre-de-lo-que-haces

# 3. Trabaja, haz commits frecuentes
git add .
git commit -m "feat: descripción de lo que hiciste"

# 4. Cuando termines, sube tu rama
git push origin ezequiel/nombre-de-lo-que-haces

# 5. Avisa a Iván para hacer el merge a development
```

> ⚠️ **NUNCA hagas push directo a `master`.** Esa rama la controla Iván para los releases.

---

## 🛠️ Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|---------|
| `403 Forbidden` en `/api/records` | La `AIRTABLE_API_KEY` del `.env` es incorrecta | Regenerar PAT en [airtable.com/create/tokens](https://airtable.com/create/tokens) |
| `"Claves no configuradas"` en browser | LocalStorage vacío y el server no responde | Verificar que el servidor está corriendo en puerto 3001 |
| `"requested model was not found"` | Modelo de Gemini no disponible para esa API key | Ya está resuelto con el sistema de fallback multi-modelo |
| La app muestra datos viejos | Service Worker cacheó una versión antigua | Abre DevTools → Application → Service Workers → "Update on reload" o "Skip waiting" |
| `Cannot find module './routes/auth'` | No instalaste dependencias | Ejecuta `npm install` en la carpeta `backend/` |

---

## 🔑 Permisos que necesitas en Airtable

Cuando crees tu PAT en [airtable.com/create/tokens](https://airtable.com/create/tokens), asegúrate de añadir estos scopes:

- ✅ `data.records:read`
- ✅ `data.records:write`
- ✅ `schema.bases:read`
- ✅ `schema.bases:write`

Y acceso a la base: **Dulce y Jaleo** (o "All current and future bases").

---

## 📞 Contacto y Recursos

- **Repo GitHub:** https://github.com/Ivanoide05/APP-Dulce-BETA-1.0
- **App en Vercel (producción):** consultar con Iván
- **Airtable Dashboard:** consultar con Iván (te compartirá la base)
- **Iván (dueño del proyecto):** por WhatsApp o Discord

---

*Documento generado por Antigravity AI — 14/04/2026*
*Si algo no te cuadra o está desactualizado, díselo a Iván para que lo corrija aquí.*
