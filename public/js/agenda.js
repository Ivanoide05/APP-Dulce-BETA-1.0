/**
 * agenda.js - Módulo de contactos y agenda Dulce y Jaleo
 * Restaura la funcionalidad completa de la App Maestra.
 */

// FUNCIÓN GLOBAL PARA ABRIR MODAL CON DATOS REALES
window.forzarAperturaCliente = function(contactoId) {
    if (typeof getContacts !== 'function') return;

    const contacts = getContacts();
    window.contactSelected = contacts.find(c => String(c.id) === String(contactoId));
    
    if (!window.contactSelected) return;

    // Iniciales en Círculo
    const initials = window.contactSelected.nombre.split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase();
    const initialsEl = document.getElementById('det-initials');
    if (initialsEl) initialsEl.textContent = initials;
    
    // Nombre e Identidad
    const nameEl = document.getElementById('det-name');
    if (nameEl) nameEl.textContent = window.contactSelected.nombre;
    
    // Estado/Categoría
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

    // CÁLCULO FINANCIERO DINÁMICO
    if (typeof calculateContactFinancials === 'function') {
        calculateContactFinancials(window.contactSelected.nombre);
    }

    // ABRIR EL MODAL (Style Class 'active')
    const modal = document.getElementById('detalles-contacto-modal');
    if (modal) {
        modal.classList.add('active');
    }
};

window.cerrarVistaCliente = function() {
    const modal = document.getElementById('detalles-contacto-modal');
    if (modal) {
        modal.classList.remove('active');
    }
};

// MOTOR FINANCIERO DEL CONTACTO
function calculateContactFinancials(nombre) {
    if (!globalStats || !globalStats.allRecords) return;
    const allDocs = globalStats.allRecords;
    
    // Función auxiliar para normalizar nombres
    const normalize = (str) => (str || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const target = normalize(nombre);
    
    const matches = allDocs.filter(d => normalize(d.proveedor).includes(target));

    const total = matches.reduce((acc, d) => acc + (d.total || 0), 0);
    const count = matches.length;
    const avg = count > 0 ? (total / count) : 0;
    const lastDate = matches.length > 0 ? matches[0].fecha : '-';

    const saldoEl = document.getElementById('det-saldo');
    const ticketEl = document.getElementById('det-ticket');
    const ultimaEl = document.getElementById('det-ultima');
    
    if (saldoEl) saldoEl.textContent = total.toFixed(2) + ' €';
    if (ticketEl) ticketEl.textContent = avg.toFixed(2) + ' €';
    if (ultimaEl) ultimaEl.textContent = lastDate || '-';
}

// ACCIONES RÁPIDAS
window.ejecutarLlamada = function () {
    if (window.contactSelected && window.contactSelected.telefono) {
        window.location.href = 'tel:' + window.contactSelected.telefono;
    } else {
        alert('Este contacto no tiene teléfono guardado.');
    }
};

window.ejecutarWhatsApp = function () {
    if (window.contactSelected && window.contactSelected.telefono) {
        let phone = window.contactSelected.telefono.replace(/\s+/g, '');
        if (!phone.startsWith('+')) phone = '+34' + phone; // Asumimos España por defecto
        window.location.href = 'https://wa.me/' + phone;
    } else {
        alert('Este contacto no tiene teléfono guardado.');
    }
};

window.ejecutarHistorial = function () {
    if (!window.contactSelected) return;
    if (typeof activateTab === 'function') {
        activateTab('facturas');
        // Aquí podrías disparar un trigger de búsqueda en la sección facturas
    }
    window.cerrarVistaCliente();
};

window.ejecutarNota = function() {
    alert('Función de Notas: Próximamente disponible.');
};
