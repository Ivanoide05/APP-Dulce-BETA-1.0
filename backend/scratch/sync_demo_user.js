/**
 * Script de utilidad: Sincronizar el airtable_base_id del usuario demo en Supabase.
 * Uso: node backend/scratch/sync_demo_user.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const DEMO_EMAIL = 'demo@dulcejaleo.com';
const NEW_BASE_ID = process.env.AIRTABLE_BASE_ID; // appSf2sNpbpScfgIk

async function syncDemoUser() {
    console.log(`\n🔄 Actualizando airtable_base_id para ${DEMO_EMAIL}...`);
    console.log(`   Nuevo Base ID: ${NEW_BASE_ID}\n`);

    // 1. Buscar al usuario demo
    const { data: clients, error: fetchError } = await supabase
        .from('clients')
        .select('id, email, name, airtable_base_id')
        .eq('email', DEMO_EMAIL);

    if (fetchError) {
        console.error('❌ Error buscando cliente:', fetchError.message);
        process.exit(1);
    }

    if (!clients || clients.length === 0) {
        console.log(`⚠️  No se encontró ningún cliente con email ${DEMO_EMAIL}.`);
        console.log('   Listando todos los clientes existentes...\n');

        const { data: allClients } = await supabase
            .from('clients')
            .select('id, email, name, airtable_base_id');

        if (allClients && allClients.length > 0) {
            allClients.forEach(c => {
                console.log(`   📌 ${c.email} — base: ${c.airtable_base_id || '(vacío)'}`);
            });
        } else {
            console.log('   (No hay clientes en la tabla)');
        }
        process.exit(0);
    }

    const client = clients[0];
    console.log(`✅ Cliente encontrado: ${client.name} (${client.email})`);
    console.log(`   Base actual: ${client.airtable_base_id || '(vacío)'}`);

    if (client.airtable_base_id === NEW_BASE_ID) {
        console.log('\n✅ Ya está configurado con la base correcta. No se necesitan cambios.');
        process.exit(0);
    }

    // 2. Actualizar
    const { data: updated, error: updateError } = await supabase
        .from('clients')
        .update({ airtable_base_id: NEW_BASE_ID })
        .eq('id', client.id)
        .select('id, email, airtable_base_id');

    if (updateError) {
        console.error('❌ Error actualizando:', updateError.message);
        process.exit(1);
    }

    console.log(`\n🎉 ¡Actualizado correctamente!`);
    console.log(`   ${updated[0].email} → base: ${updated[0].airtable_base_id}`);
}

syncDemoUser().catch(err => {
    console.error('❌ Error inesperado:', err);
    process.exit(1);
});
