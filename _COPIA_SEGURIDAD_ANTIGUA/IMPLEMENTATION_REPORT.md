# IMPLEMENTATION REPORT — Sistema de Autenticación Dulce y Jaleo
**Fecha**: 2026-03-31
**Estado**: Implementación completa — pendiente configuración Supabase + Vercel

---

## Resumen Ejecutivo

Se ha implementado un sistema completo de autenticación con Supabase (PostgreSQL) como base de datos de usuarios, JWT para sesiones, y un panel de administración para gestionar clientes. El sistema soporta multi-tenant: cada cliente tiene su propio `airtable_base_id`.

---

## FASE 0 — Setup Supabase (PASOS MANUALES)

### 1. Crear proyecto en Supabase
1. Ir a https://supabase.com → **New Project**
2. Nombre: `app-users`
3. Elegir región cercana (EU West si estás en España)
4. Guardar la contraseña de la base de datos

### 2. Crear tablas en SQL Editor
Ir a **SQL Editor** en el panel de Supabase y ejecutar:

```sql
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  airtable_base_id TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_login TIMESTAMPTZ
);

CREATE TABLE admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_admins_email ON admins(email);
```

### 3. Obtener credenciales
- Ir a **Settings → API** en Supabase
- Copiar: **Project URL** (ej: `https://xxxxx.supabase.co`)
- Copiar: **Service Role Key** (la key `service_role`, NO la `anon`)

### 4. Generar JWT Secret
En terminal:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 5. Configurar variables de entorno
Añadir en el `.env` del backend (y en Easypanel/Vercel si aplica):
```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=tu-service-role-key
JWT_SECRET=el-hash-generado-en-paso-4
```

### 6. Crear el primer admin
Ejecutar este script en la raíz del backend:
```bash
cd backend
node -e "
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

(async () => {
    const hash = await bcrypt.hash('TU_PASSWORD_AQUI', 12);
    const { data, error } = await supabase.from('admins').insert({
        admin_id: 'ADM-001',
        name: 'Ezequiel',
        email: 'tu-email@ejemplo.com',
        password_hash: hash,
        role: 'admin'
    }).select();
    if (error) console.error('Error:', error.message);
    else console.log('Admin creado:', data[0].email);
})();
"
```

---

## FASE 1 — Backend Auth (AGENTE 1)

### Archivos creados:
| Archivo | Descripción |
|---------|-------------|
| `backend/lib/supabaseClient.js` | Cliente Supabase reutilizable |
| `backend/lib/authMiddleware.js` | Middleware JWT (valida Bearer token, 401 en español) |
| `backend/routes/auth.js` | POST /api/auth/login (busca admins → clients, bcrypt, JWT 8h) |
| `backend/routes/admin.js` | CRUD completo de clientes + listado admins |

### Archivos modificados:
| Archivo | Cambios |
|---------|---------|
| `backend/server.js` | Montaje de /api/auth y /api/admin |
| `backend/routes/api.js` | Auth middleware + airtable_base_id del JWT |
| `backend/routes/webhooks.js` | Auth middleware + propagación de Authorization |
| `backend/package.json` | Nuevas deps: @supabase/supabase-js, bcryptjs, jsonwebtoken |

### Endpoints nuevos:
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/login` | No | Login para admins y clientes |
| GET | `/api/admin/clients` | Admin | Listar clientes (sin password) |
| POST | `/api/admin/clients` | Admin | Crear cliente |
| PUT | `/api/admin/clients/:id` | Admin | Editar cliente |
| DELETE | `/api/admin/clients/:id` | Admin | Eliminar cliente |
| PUT | `/api/admin/clients/:id/toggle` | Admin | Activar/desactivar |
| GET | `/api/admin/admins` | Admin | Listar administradores |

### Dependencias instaladas:
- `@supabase/supabase-js` ^2.101.0
- `bcryptjs` ^3.0.3
- `jsonwebtoken` ^9.0.3

---

## FASE 2 — Pantalla de Login (AGENTE 2)

### Archivos creados:
| Archivo | Descripción |
|---------|-------------|
| `login.html` | Página de login Clean Minimal Apple |
| `public/js/auth.js` | Módulo auth: checkAuth, logout, getAuthHeader, getUserInfo, isAdmin |

### Características de login.html:
- Diseño coherente con la app (Apple clean)
- Soporte dark/light mode (lee `dulce_jaleo_theme` de localStorage)
- Shimmer skeleton durante la petición
- Redirección automática si ya hay JWT válido
- Mensajes de error del servidor en rojo suave
- Mobile-first, standalone (CSS+JS inline)

### Archivos modificados:
| Archivo | Cambios |
|---------|---------|
| `public/js/api.js` | Authorization header en todos los fetch + manejo 401 |
| `index.html` | Script auth en body + botón cerrar sesión |
| `public/index.html` | Script auth en body + botón cerrar sesión |

---

## FASE 3 — Protección del Frontend (AGENTE 2)

- `public/js/auth.js` cargado en todas las páginas protegidas
- `DulceAuth.checkAuth()` al inicio del body (antes de contenido visible)
- Fallback si auth.js no carga: redirect directo con vanilla JS
- Botón "Cerrar sesión" en la barra de navegación de ambos index.html
- `public/js/api.js` envía Bearer token en cada petición
- Si el servidor devuelve 401 → logout automático y redirect a login

---

## FASE 4 — Panel Admin (AGENTE 3)

### Archivo reescrito:
| Archivo | Descripción |
|---------|-------------|
| `admin.html` | Panel admin completo con diseño Clean Minimal Apple |

### Características:
- Auth check al cargar (requiere JWT con role "admin")
- Header con nombre del admin, botón cerrar sesión, toggle dark/light
- Navegación por tabs: Clientes | Administradores
- **Sección Clientes**:
  - Tabla: Nombre, Email, Estado (badge verde/rojo), Base ID, Última conexión, Acciones
  - Shimmer skeleton mientras carga
  - Acciones: Toggle estado, Editar, Eliminar
  - SweetAlert2 para confirmaciones destructivas
  - Modal crear/editar con validación frontend
  - Toastify para feedback exitoso
- **Sección Administradores**:
  - Tabla read-only: Nombre, Email, Fecha creación
- Responsive: scroll horizontal en tablas en móvil
- 401 → logout automático

---

## FASE 5 — Endpoints Admin (AGENTE 1)

Implementados como parte de `backend/routes/admin.js` (ver Fase 1).

---

## Archivos con Backup

| Original | Backup |
|----------|--------|
| `backend/server.js` | `backend/server.js.backup` |
| `backend/routes/api.js` | `backend/routes/api.js.backup` |
| `backend/routes/webhooks.js` | `backend/routes/webhooks.js.backup` |
| `backend/package.json` | `backend/package.json.backup` |
| `public/js/api.js` | `public/js/api.js.backup` |
| `admin.html` | `admin.html.backup` |

---

## Cómo Probar que Todo Funciona

### 1. Configurar entorno
```bash
cd backend
cp .env.example .env
# Editar .env con SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET
```

### 2. Instalar dependencias
```bash
cd backend
npm install
```

### 3. Crear primer admin (ver Fase 0, paso 6)

### 4. Arrancar servidor
```bash
cd backend
npm start
```

### 5. Probar login
- Abrir `http://localhost:3001/login.html`
- Introducir email y password del admin creado
- Debería redirigir a `/admin.html`

### 6. Probar panel admin
- Crear un cliente desde el panel
- Verificar que aparece en la tabla
- Toggle activar/desactivar
- Editar nombre y email
- Eliminar cliente (confirmación SweetAlert2)

### 7. Probar acceso de cliente
- Crear un cliente con un airtable_base_id válido
- Cerrar sesión
- Login con las credenciales del cliente
- Debería redirigir a `/index.html`
- Verificar que carga los datos de Airtable del base_id del cliente

### 8. Probar protección
- Cerrar sesión
- Intentar acceder a `http://localhost:3001/index.html` directamente
- Debería redirigir a `/login.html`
- Intentar acceder a `http://localhost:3001/admin.html` con token de cliente
- Debería redirigir a `/login.html` (no es admin)

---

## Arquitectura Final

```
                    ┌─────────────┐
                    │   Supabase  │
                    │ (PostgreSQL)│
                    │  admins     │
                    │  clients    │
                    └──────┬──────┘
                           │
┌──────────┐    JWT    ┌───┴────────────┐    Bearer    ┌──────────┐
│  login   │ ────────► │   Express      │ ──────────► │ Airtable │
│  .html   │ ◄──────── │   Backend      │ ◄────────── │   API    │
└──────────┘  token    │                │              └──────────┘
                       │  /api/auth     │
┌──────────┐  fetch +  │  /api/admin    │
│  index   │  Bearer ► │  /api/records  │
│  .html   │ ◄──────── │  /webhook/*    │
└──────────┘           └───┬────────────┘
                           │
┌──────────┐  fetch +      │
│  admin   │  Bearer ► ────┘
│  .html   │
└──────────┘
```

---

## Notas Importantes

1. **Airtable sigue para datos de negocio**, Supabase solo para usuarios/auth
2. **El airtable_base_id** viene siempre del JWT validado en servidor
3. **Los webhooks** (scan-invoice, whatsapp-order) ahora requieren auth
4. **El endpoint /api/config** sigue siendo público (no requiere auth)
5. **El health check** sigue siendo público
6. **Los table IDs** (FACTURAS, ALBARANES, GASTOS_VARIOS) son los mismos para todos los clientes — solo cambia el base_id

---

Conceived by Romuald Członkowski - [www.aiadvisors.pl/en](https://www.aiadvisors.pl/en)
