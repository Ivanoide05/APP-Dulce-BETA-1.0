# DECISIONS.md — Decisiones Autónomas

## D1: Express en lugar de Vercel Serverless Functions
**Decisión**: Implementar auth como rutas Express y middleware, no como Serverless Functions.
**Justificación**: El proyecto usa Express en Easypanel, no Vercel. Adaptar a la arquitectura real.

## D2: Estructura de archivos backend
**Decisión**: Crear `backend/lib/` para módulos compartidos y nuevas rutas en `backend/routes/`.
```
backend/
├── lib/
│   ├── supabaseClient.js    → Cliente Supabase reutilizable
│   └── authMiddleware.js    → Middleware JWT reutilizable
├── routes/
│   ├── auth.js              → POST /api/auth/login
│   ├── admin.js             → CRUD /api/admin/*
│   ├── api.js               → (modificado con auth)
│   └── webhooks.js          → (modificado con auth)
```

## D3: Airtable multi-tenant
**Decisión**: El `airtable_base_id` viene del JWT del usuario autenticado.
Las rutas de api.js y webhooks.js extraen el base_id de `req.user.airtable_base_id`.
Se mantiene `process.env.AIRTABLE_BASE_ID` como fallback para compatibilidad durante migración.

## D4: Table IDs por entorno
**Decisión**: Los Table IDs (FACTURAS, ALBARANES, GASTOS_VARIOS) siguen viniendo de env vars.
Son iguales para todos los clientes — solo cambia el base_id por cliente.

## D5: Login unificado
**Decisión**: Un solo endpoint `/api/auth/login` busca primero en `admins`, luego en `clients`.
El JWT incluye `role` ("admin" o "client") para determinar acceso.

## D6: Protección gradual del frontend
**Decisión**: Se protegen index.html y admin.html con script de auth al inicio del body.
El contenido se oculta hasta validar el token (evitar flash de contenido).

## D7: admin.html — Reconstruir sobre existente
**Decisión**: Se hace backup de admin.html como admin.html.backup.
Se reconstruye con diseño Clean Minimal Apple manteniendo funcionalidad existente
(flota + SaaS metrics) y añadiendo gestión de clientes/admins.

## D8: CDN para SweetAlert2 y Toastify
**Decisión**: Cargar ambas librerías desde CDN ya que no están en el proyecto.
- SweetAlert2: cdn.jsdelivr.net/npm/sweetalert2@11
- Toastify: cdn.jsdelivr.net/npm/toastify-js

## D9: Webhook scan-invoice con auth condicional
**Decisión**: El endpoint `/webhook/scan-invoice` acepta auth JWT Y también
permite llamadas sin auth cuando vienen del endpoint interno `/webhook/lovable-webhook`.
Esto mantiene compatibilidad con integraciones externas existentes.
Se documenta como paso manual: proteger webhooks con API key en el futuro.

## D10: Frontend API client actualizado
**Decisión**: `public/js/api.js` se modifica para incluir el header Authorization
en todas las peticiones usando el token de localStorage.
