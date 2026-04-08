// ===== RESET PASSWORD — Dulce y Jaleo =====
// Ejecutar: node resetPassword.js
// Resetea la contraseña de demo@dulcejaleo.com a "demo123"

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const TARGET_EMAIL = 'demo@dulcejaleo.com';
const NEW_PASSWORD = 'demo123';
const SALT_ROUNDS = 12;

async function resetPassword() {
    console.log('');
    console.log('🔐 Dulce y Jaleo — Reset de Contraseña');
    console.log('━'.repeat(45));

    // 1. Buscar en tabla clients
    console.log(`\n🔍 Buscando "${TARGET_EMAIL}" en tabla clients...`);
    const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('id, name, email, active')
        .eq('email', TARGET_EMAIL);

    if (clientError) {
        console.error('❌ Error buscando en clients:', clientError.message);
    }

    // 2. Buscar en tabla admins
    console.log(`🔍 Buscando "${TARGET_EMAIL}" en tabla admins...`);
    const { data: admins, error: adminError } = await supabase
        .from('admins')
        .select('id, name, email');

    if (adminError) {
        console.error('❌ Error buscando en admins:', adminError.message);
    }

    // Mostrar lo que se encontró
    console.log('\n📋 Usuarios encontrados:');
    console.log('━'.repeat(45));

    if (clients && clients.length > 0) {
        clients.forEach(c => {
            console.log(`  [CLIENT] ${c.name} — ${c.email} (ID: ${c.id}, Activo: ${c.active})`);
        });
    } else {
        console.log('  (Ningún cliente encontrado con ese email)');
    }

    if (admins && admins.length > 0) {
        admins.forEach(a => {
            console.log(`  [ADMIN]  ${a.name} — ${a.email} (ID: ${a.id})`);
        });
    } else {
        console.log('  (Ningún admin encontrado)');
    }

    // 3. Resetear la contraseña
    const newHash = await bcrypt.hash(NEW_PASSWORD, SALT_ROUNDS);
    console.log(`\n🔑 Nuevo hash generado para "${NEW_PASSWORD}"`);

    // Buscar el usuario concreto en clients
    const targetClient = clients ? clients.find(c => c.email === TARGET_EMAIL) : null;

    if (targetClient) {
        const { error: updateError } = await supabase
            .from('clients')
            .update({ password_hash: newHash })
            .eq('id', targetClient.id);

        if (updateError) {
            console.error('❌ Error actualizando contraseña:', updateError.message);
        } else {
            console.log(`\n✅ ¡Contraseña reseteada con éxito!`);
            console.log('━'.repeat(45));
            console.log(`  📧 Email:      ${TARGET_EMAIL}`);
            console.log(`  🔒 Contraseña: ${NEW_PASSWORD}`);
            console.log(`  👤 Nombre:     ${targetClient.name}`);
            console.log('━'.repeat(45));
        }
    } else {
        console.log(`\n⚠️  No se encontró "${TARGET_EMAIL}" en la tabla clients.`);
        console.log('   Vamos a resetear TODOS los clientes y admins listados arriba.\n');

        // Resetear todos los clientes
        if (clients && clients.length > 0) {
            for (const c of clients) {
                const { error } = await supabase
                    .from('clients')
                    .update({ password_hash: newHash })
                    .eq('id', c.id);
                if (!error) {
                    console.log(`  ✅ [CLIENT] ${c.email} → "${NEW_PASSWORD}"`);
                } else {
                    console.error(`  ❌ [CLIENT] ${c.email} → Error: ${error.message}`);
                }
            }
        }

        // Resetear todos los admins
        if (admins && admins.length > 0) {
            for (const a of admins) {
                const { error } = await supabase
                    .from('admins')
                    .update({ password_hash: newHash })
                    .eq('id', a.id);
                if (!error) {
                    console.log(`  ✅ [ADMIN]  ${a.email} → "${NEW_PASSWORD}"`);
                } else {
                    console.error(`  ❌ [ADMIN]  ${a.email} → Error: ${error.message}`);
                }
            }
        }

        console.log('\n━'.repeat(45));
        console.log(`  🔒 Contraseña universal: ${NEW_PASSWORD}`);
        console.log('━'.repeat(45));
    }

    console.log('\n🎉 Listo. Ahora ve a login.html y usa esas credenciales.\n');
}

resetPassword().catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
});
