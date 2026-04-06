# 🏆 PROTOCOLO: EL SANTO GRIAL

Este documento es la ley sagrada de sincronización para el proyecto **Dulce y Jaleo**. Se debe seguir estrictamente para evitar pérdida de archivos o conflictos de código.

---

## 🚩 AL EMPEZAR (El "Refresco")
Antes de cambiar ni una sola coma, hay que traer lo que se haya hecho mientras no estabas.

1. Abre la terminal en la carpeta raíz (`LA REAL ORIGINAL`).
2. Escribe:
   ```bash
   git pull origin master
   ```
*   **¿Qué hace esto?** Descarga las actualizaciones de Ivan.
*   **Resultado:** Estás 100% al día en la rama maestra.

## 🖥️ ARRANQUE (Backend)
Antes de abrir la web, el "motor" debe estar encendido.

1. Abre otra terminal en `backend`.
2. Escribe: `npm start`.
3. Abre tu navegador en: **http://localhost:3001**.

---

## 🛠️ DURANTE EL TRABAJO
Puedes verificar qué archivos estás tocando en cualquier momento:
```bash
git status
```
*(Los archivos modificados saldrán en rojo).*

---

## 🏁 AL TERMINAR (El "Envío")
Cuando hayas terminado tus modificaciones y quieras que los demás (y el servidor) las reciban.

1. **Preparar archivos:**
   ```bash
   git add .
   ```
   *(Esto le dice a Git: "Prepara todos estos archivos que he cambiado").*

2. **Etiquetar el envío (Commit):**
   ```bash
   git commit -m "Descripción de lo que has hecho"
   ```
   *(Poner una etiqueta al paquete explicando qué envías).*

3. **Enviar al servidor (Push):**
   ```bash
   git push origin master
   ```
   *   **¿Qué hace esto?** Envía tus cambios a GitHub (y Vercel).
   *   **Resultado:** Ivan podrá ver tu trabajo al hacer su `pull`.

---

## ⚠️ REGLA DE ORO
**1. Siempre haz PUSH al final de tu sesión.**
**2. TRABAJA SIEMPRE en `LA REAL ORIGINAL`.** Olvida cualquier otra carpeta.
**3. NO MEZCLES RAMAS.** Todo a `master`.

---
*Actualizado el 05/04/2026 — Antigravity & Dulce Team*
