# 🚀 Guía de Handover: Proyecto "Dulce Jaleo" para Antigravity

Esta guía está diseñada para que un nuevo asistente Antigravity entienda instantáneamente el estado actual del proyecto, la arquitectura y los pasos pendientes.

## 📋 Resumen del Proyecto
- **Nombre:** Dulce Jaleo - Gestión Inteligente
- **Tecnologías:** HTML5, CSS3 (Vanilla), JavaScript, PWA, Airtable API.
- **Objetivo:** Transformar una WebApp de gestión de facturas en una experiencia de App nativa de iOS/Android.

## 🏗️ Arquitectura y Flujo de Datos
- **Frontend:** Single Page Application (SPA) contenida en `index.html`.
- **Base de Datos:** Airtable (Base: `app7VJr4iHt5v1r5c`).
- **Procesamiento:** n8n (Webhook) + IA para OCR y clasificación de documentos.
- **PWA:** Funciona offline-ready con `manifest.json` e iconos en la raíz.

## 🛠️ Estado Actual (Fase Final Completada)
1.  **PWA Nativa:** Splash screen profesional, meta-tags para iOS/Brave/Chrome, y `display: standalone`.
2.  **Branding:** Logo de la espiga unificado (reemplazando todos los emojis `🍞`).
3.  **Sincronización:** Datos centralizados en un `globalStats` que alimenta Dashboard y Márgenes por igual.
4.  **Estabilidad:** Captura de errores global y manejo seguro de links externos para evitar cierres en Brave.

## 📂 Archivos Críticos
- `index.html`: El motor principal de la aplicación.
- `manifest.json`: Configuración PWA y de instalación.
- `icon-192.png` / `icon-512.png`: Branding oficial.

## 💡 Instrucciones para el nuevo Antigravity
> "Hola Antigravity. Estoy colaborando en el proyecto Dulce Jaleo. He recibido esta guía de contexto. Por favor, lee el archivo `index.html` para entender la lógica de sincronización de Airtable y el flujo de la PWA. Estamos en fase de despliegue y mantenimiento."

---
*Generado por Antigravity para soporte multi-usuario.*
