// ===== CLIENTE SUPABASE =====
// Inicializa el cliente de Supabase con las credenciales del servidor.
// NUNCA exponer SUPABASE_SERVICE_KEY al frontend.

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('[SUPABASE] Faltan variables de entorno: SUPABASE_URL o SUPABASE_SERVICE_KEY');
}

// Crear cliente con valores por defecto para evitar crash en import
// Las operaciones fallarán si las variables no están configuradas
const supabase = createClient(
    SUPABASE_URL || 'https://placeholder.supabase.co',
    SUPABASE_SERVICE_KEY || 'placeholder-key'
);

module.exports = supabase;
