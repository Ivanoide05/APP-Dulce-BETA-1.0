document.addEventListener('DOMContentLoaded', () => {
    const steps = document.querySelectorAll('.step');
    const progressBar = document.getElementById('progressBar');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    
    let currentStep = 1;
    const totalSteps = steps.length;

    // --- Navigation ---

    const updateUI = () => {
        steps.forEach(step => {
            step.classList.remove('active');
            if (parseInt(step.dataset.step) === currentStep) {
                step.classList.add('active');
            }
        });

        const progress = (currentStep / totalSteps) * 100;
        progressBar.style.width = `${progress}%`;

        prevBtn.disabled = currentStep === 1;

        if (currentStep === totalSteps) {
            nextBtn.style.display = 'none';
            downloadBtn.style.display = 'block';
        } else {
            nextBtn.style.display = 'block';
            downloadBtn.style.display = 'none';
        }
    };

    nextBtn.addEventListener('click', () => {
        if (currentStep < totalSteps) {
            currentStep++;
            updateUI();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateUI();
        }
    });

    // --- Conditional Inputs ---

    const incluirTextoCheck = document.getElementById('incluirTexto');
    const detalleTextoGroup = document.getElementById('detalleTextoGroup');

    incluirTextoCheck.addEventListener('change', (e) => {
        detalleTextoGroup.style.display = e.target.checked ? 'block' : 'none';
    });

    // --- Markdown Generation ---

    const generateMarkdown = () => {
        const semana = document.getElementById('semana').value || "_____";
        const fecha = document.getElementById('fecha').value || "_____________";
        const nombreVal = document.getElementById('productoNombre').value || "_______________________________________________";
        const descVal = document.getElementById('productoDesc').value || "_______________________________________________";
        const precioVal = document.getElementById('productoPrecio').value || "_______________________________________________";

        // Objective logic
        let objetivo = document.querySelector('input[name="objetivo"]:checked')?.value || "No especificado";
        if (objetivo === "Otro") {
            objetivo = document.getElementById('objetivoOtroText').value || "Otro";
        }

        const gancho = document.getElementById('gancho').value || "_______________________________________________";
        const cuerpo = document.getElementById('cuerpo').value || "_______________________________________________";

        // CTA logic
        let cta = document.querySelector('input[name="cta"]:checked')?.value || "No especificado";
        if (cta === "Otro") {
            cta = document.getElementById('ctaOtroText').value || "Otro";
        }

        const mood = document.querySelector('input[name="mood"]:checked')?.value || "No especificado";
        const musica = document.getElementById('musica').value || "_______________________________________________";
        const formato = document.querySelector('input[name="formato"]:checked')?.value || "___________";
        const logo = document.getElementById('incluirLogo').checked ? "[x] Sí" : "[ ] No";
        const textoPantalla = document.getElementById('incluirTexto').checked ? "[x] Sí" : "[ ] No";
        const detalleTexto = document.getElementById('detalleTexto').value || "_______________";

        // Checklist logic
        const checkProducto = document.getElementById('checkProducto').checked ? "[x]" : "[ ]";
        const checkPlanos = document.getElementById('checkPlanos').checked ? "[x]" : "[ ]";
        const checkMood = document.getElementById('checkMood').checked ? "[x]" : "[ ]";
        const checkDeuda = document.getElementById('checkDeuda').checked ? "[x]" : "[ ]";

        return `# 📋 BRIEFING SEMANAL — Post Pastelería
> Rellena esto y mándaselo a tu madre ANTES de grabar. Tiempo estimado de relleno: 5 minutos.

---

## 📅 SEMANA Nº: ${semana} · FECHA DE PUBLICACIÓN PREVISTA: ${fecha}

---

## 🎂 PRODUCTO PROTAGONISTA

**Nombre del producto:**
> ${nombreVal}

**Descripción en 1-2 frases (lo que dirías al cliente):**
> ${descVal}

**Precio aproximado o si es por encargo:**
> ${precioVal}

---

## 🎯 OBJETIVO DEL POST

- ${objetivo}

---

## 📸 PLANOS A GRABAR

> Graba en **vertical (9:16)**, buena luz natural si es posible, sin música de fondo.

| Nº | Plano | Descripción | Duración aprox. |
|----|-------|-------------|-----------------|
| 1  | **Primer plano** | El producto terminado, girando lentamente sobre la mesa | 5-8 seg |
| 2  | **Detalle textura** | Acercamiento a la decoración, cobertura o corte | 3-5 seg |
| 3  | **Proceso** | Manos decorando, vertiendo, espolvoreando… | 5-8 seg |
| 4  | **Contexto** | El producto en el obrador o en la caja de entrega | 3-5 seg |
| 5  | **Reacción / entrega** | (Opcional) Cliente recogiendo, caras, reacciones | 3-5 seg |

---

## ✍️ TEXTO DEL POST

**Gancho (primera línea — la más importante):**
> ${gancho}

**Cuerpo del texto (2-3 frases):**
> ${cuerpo}

**Call to action:**
- ${cta}

**Hashtags sugeridos:**
\`\`\`
#pasteleria #pastelartesanal #pastelerialorca #tartalorca #encargospersonalizados #sweetdesign #cakedesign #pasteleriaespaña
\`\`\`

---

## 🎵 MÚSICA / ESTÉTICA

**Mood visual:** ${mood}
**Canción o tipo de música:** ${musica}

---

## ⚙️ INFORMACIÓN TÉCNICA PARA EDICIÓN

- Formato final: **${formato}**
- ¿Incluir logo/marca de agua? → ${logo}
- ¿Incluir texto en pantalla? → ${textoPantalla} · Texto: ${detalleTexto}

---

## ✅ CHECKLIST ANTES DE MANDAR

- ${checkProducto} He rellenado el producto y su descripción
- ${checkPlanos} Sé qué planos voy a grabar
- ${checkMood} He elegido el mood visual
- ${checkDeuda} Este post equivale a **-30€** de mi deuda mensual

---
*Generado automáticamente por Dulce Jaleo Briefing Tool.*`;
    };

    downloadBtn.addEventListener('click', () => {
        const markdown = generateMarkdown();
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        const fechaHoy = new Date().toISOString().split('T')[0];
        const filename = `Briefing_Post_${fechaHoy}.md`;
        
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    updateUI();
});
