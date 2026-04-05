# 🏢 HERRAMIENTA VINTED REVENTA ÉLITE (SaaS Interno)

*Fecha de inicio:* 22 de Marzo de 2026
*Objetivo:* Automatizar el 90% del tiempo de publicación en Vinted/Wallapop sin riesgo de baneos y a coste $0.00.

## 📐 ARQUITECTURA DEL SISTEMA

### FASE 1: PROCESAMIENTO MÁGICO (n8n + Telegram + IAs Gratuitas)
1. **Entrada (Telegram):** El usuario envía 1 sola foto (la de portada) + el texto crudo.
2. **Recepción (n8n):** Un webhook o nodo de Telegram capta la imagen y el texto.
3. **Visión y Copy (Google Gemini Flash 1.5):** Analiza la imagen y redacta un copy de alta conversión.
4. **Estudio (Rembg / ClipDrop):** Elimina el fondo de la portada y le pone fondo blanco/studio.
5. **Base de Datos / Cola:** n8n guarda los resultados (Título, Copy, Imagen procesada) listos para ser consumidos.

### FASE 2: AUTO-PUBLICACIÓN (Extensión Chrome "Ghost")
1. **Extensión Local:** Un botón en el navegador del usuario.
2. **Acción:** Al hacer clic estando en Vinted, la extensión extrae los datos de la última prenda procesada y rellena el DOM (HTML) de Vinted.
3. **Seguridad:** 100% indetectable por Datadome porque ocurre en una sesión real con físicas de ratón/teclado reales (o inyección directa en el navegador del usuario).

---
*Nota: Este proyecto es estrictamente independiente de Dulce Jaleo.*
