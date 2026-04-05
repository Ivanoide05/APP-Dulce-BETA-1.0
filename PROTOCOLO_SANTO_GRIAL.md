# 🏆 PROTOCOLO: EL SANTO GRIAL

Este documento es la ley sagrada de sincronización para el proyecto **Dulce y Jaleo**. Se debe seguir estrictamente para evitar pérdida de archivos o conflictos de código.

---

## 🚩 AL EMPEZAR (El "Refresco")
Antes de cambiar ni una sola coma, hay que traer lo que se haya hecho mientras no estabas.

1. Abre la terminal en la carpeta raíz.
2. Escribe:
   ```bash
   git pull origin main
   ```
*   **¿Qué hace esto?** Descarga todas las actualizaciones y las fusiona con los archivos locales.
*   **Resultado:** Estás 100% al día con la versión más reciente del proyecto.

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
   git push origin main
   ```
   *   **¿Qué hace esto?** Envía tus cambios a GitHub.
   *   **Resultado:** Vercel se actualiza y el equipo puede hacer su `git pull` para ver lo que has hecho.

---

## ⚠️ REGLA DE ORO
**Siempre haz PUSH al final de tu sesión de trabajo.** 
Si no haces PUSH, los demás seguirán trabajando sobre una versión vieja y, al intentar subirlo más tarde, habrá un conflicto porque los códigos habrán "chocado".

---
*Instaurado el 05/04/2026*
