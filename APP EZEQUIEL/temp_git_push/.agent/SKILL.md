---
name: Dulce-Jaleo-PWA-Guide
description: Manual de estilo y arquitectura para Antigravity (IA) en el proyecto Dulce Jaleo.
---

# 🥐 Dulce Jaleo: Guía de Ingeniería Visual (Antigravity)

Este repositorio contiene la **PWA Premium** de Dulce Jaleo. Cualquier intervención de IA debe seguir estas **Reglas de Oro** para mantener la integridad del proyecto.

## 🎨 ADN Visual (Qantas/Apple Style)
- **Tema Base:** Light Mode default (Fondo: `#f8f9fb`).
- **Modo Oscuro:** Activado vía clase `body.dark-theme` (Glassmorphism nocturno).
- **Tipografía:** `Manrope` (800) para títulos, `Inter` para cuerpo.
- **Componentes:** 
    - Radios de 32px a 50px (estilo Píldora).
    - Sombras ambientales suaves (`rgba(0,0,0,0.05)`).
    - **Safe Area:** Los headers fijos deben usar `env(safe-area-inset-top)` para evitar el notch.

## 🛠️ Stack Técnico e Integración
- **Core:** Vanilla HTML/CSS/JS (Inyectado modularmente).
- **Datos:** Airtable API (Utiliza `PERSONAL_ACCESS_TOKEN`).
- **Lógica:** Preservar IDs de elementos para no romper los selectores JS de Airtable.
- **Stitch Protocol:** Stitch es el "diseñador", Antigravity es el "ingeniero". No copies código de Stitch a ciegas; integra el CSS y HTML respetando la lógica funcional previa.

## 🚀 Cómo proceder
1. **Verificación:** Antes de cada cambio visual, verifica la respuesta en móviles (simular Safe Area).
2. **Histórico:** Los archivos antiguos están en `_ARCHIVO_HISTORICO` (fuera de este repo v2).
3. **Commit:** Usa mensajes descriptivos indicando si el cambio es Visual (Fix UI) o Funcional (Logic).

---
*Documento generado por Antigravity para la alineación del equipo técnico.*
