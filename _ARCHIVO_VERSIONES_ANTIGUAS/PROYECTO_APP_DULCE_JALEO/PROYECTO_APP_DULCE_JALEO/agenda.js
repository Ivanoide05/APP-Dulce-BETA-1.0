// agenda.js - Módulo aislado para la capa de contactos y agenda

// FUNCIÓN GLOBAL: Abre el modal de detalle de contacto
window.forzarAperturaCliente = function(contactoId) {
    if (typeof getContacts !== 'function') return;

    const contacts = getContacts();
    window.contactSelected = contacts.find(c => String(c.id) === String(contactoId));
    if (!window.contactSelected) return;

    const c = window.contactSelected;

    // Iniciales
    const initials = c.nombre.split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase();
    const initialsEl = document.getElementById('det-initials');
    if (initialsEl) {
        initialsEl.textContent = initials;
        initialsEl.className = 'det-initials-circle ' + (c.tipo === 'proveedor' ? 'det-initials-proveedor' : 'det-initials-cliente');
    }

    // Nombre
    const nameEl = document.getElementById('det-name');
    if (nameEl) nameEl.textContent = c.nombre;

    // Badge de tipo
    const tipoBadge = document.getElementById('det-tipo-badge');
    if (tipoBadge) {
        tipoBadge.textContent = c.tipo === 'proveedor' ? 'Proveedor' : 'Cliente';
        tipoBadge.className = 'det-tipo-badge ' + (c.tipo === 'proveedor' ? 'det-tipo-proveedor' : 'det-tipo-cliente');
    }

    // Teléfono
    const phoneRow = document.getElementById('det-phone-row');
    const phoneEl  = document.getElementById('det-phone');
    if (phoneRow && phoneEl) {
        if (c.telefono) {
            phoneEl.textContent = c.telefono;
            phoneRow.style.display = 'flex';
        } else {
            phoneRow.style.display = 'none';
        }
    }

    // Email
    const emailRow = document.getElementById('det-email-row');
    const emailEl  = document.getElementById('det-email');
    if (emailRow && emailEl) {
        if (c.email) {
            emailEl.textContent = c.email;
            emailRow.style.display = 'flex';
        } else {
            emailRow.style.display = 'none';
        }
    }

    // Categoría/nota
    const catRow = document.getElementById('det-categoria-row');
    const catEl  = document.getElementById('det-category-text');
    if (catRow && catEl) {
        if (c.categoria) {
            catEl.textContent = c.categoria;
            catRow.style.display = 'flex';
        } else {
            catRow.style.display = 'none';
        }
    }

    // Ocultar caja de info si no hay ningún dato
    const infoBox = document.getElementById('det-contact-info-box');
    if (infoBox) {
        infoBox.style.display = (c.telefono || c.email || c.categoria) ? '' : 'none';
    }

    // Resumen financiero (si los datos globales están cargados)
    if (typeof calculateContactFinancials === 'function') {
        calculateContactFinancials(c.nombre);
    }

    // Reiniciar iconos lucide en el modal
    const modal = document.getElementById('detalles-contacto-modal');
    if (modal) {
        modal.classList.add('active');
        setTimeout(() => {
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }, 50);
    }
};

// BOTÓN DE VOLVER O CERRAR (FUERZA BRUTA)
window.cerrarVistaCliente = function() {
    const modal = document.getElementById('detalles-contacto-modal');
    if (modal) {
        modal.classList.remove('active');
    }
};
