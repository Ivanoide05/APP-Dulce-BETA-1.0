// agenda.js - Módulo aislado para la capa de contactos y agenda

// FUNCIÓN GLOBAL INYECTADA DIRECTAMENTE AL HTML (FUERZA BRUTA) PARA ABRIR MODAL
window.forzarAperturaCliente = function (contactoId) {
    if (typeof getContacts !== 'function') return;

    const contacts = getContacts();
    window.contactSelected = contacts.find(c => String(c.id) === String(contactoId));

    if (!window.contactSelected) return;

    // Iniciales en Círculo Neón
    const initials = window.contactSelected.nombre.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase();
    document.getElementById('det-initials').textContent = initials;

    // Nombre
    document.getElementById('det-name').textContent = window.contactSelected.nombre;

    // Estado/Categoría (Emulando "🟡 Sin Registros / Activo")
    const categoria = window.contactSelected.categoria || "Sin Registros";
    const statusText = document.getElementById('det-category-text');
    if (statusText) statusText.textContent = categoria;

    // Color de la bolita de estado
    const color = window.contactSelected.categoria ? '#39FF14' : '#FFEA00';
    const dot = document.getElementById('det-status-dot');
    if (dot) {
        dot.style.background = color;
        dot.style.boxShadow = `0 0 8px ${color}`;
    }

    // Rellenamos "RESUMEN FINANCIERO RÁPIDO" delegando en la lógica existente de HTML
    if (typeof calculateContactFinancials === 'function') {
        calculateContactFinancials(window.contactSelected.nombre);
    }

    // ABRIR EL MODAL ANTIGUO (Cero Bugs)
    const modal = document.getElementById('detalles-contacto-modal');
    if (modal) {
        modal.classList.add('active');
    }
};

// BOTÓN DE VOLVER O CERRAR (FUERZA BRUTA)
window.cerrarVistaCliente = function () {
    const modal = document.getElementById('detalles-contacto-modal');
    if (modal) {
        modal.classList.remove('active');
    }
};
