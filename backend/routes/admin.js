// ===== RUTAS DE ADMINISTRACIÓN =====
// CRUD de clientes y listado de admins.
// Todas las rutas requieren JWT con role === 'admin'.

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const supabase = require('../lib/supabaseClient');
const authMiddleware = require('../lib/authMiddleware');

const SALT_ROUNDS = 12;

// ─────────────────────────────────────────────
// Middleware local: verificar que es admin
// ─────────────────────────────────────────────
function requireAdmin(req, res) {
    const user = authMiddleware(req, res);
    if (!user) return null;

    if (user.role !== 'admin') {
        res.status(403).json({ error: 'Acceso restringido a administradores.' });
        return null;
    }

    return user;
}

// ─────────────────────────────────────────────
// Generar client_id único con formato CLI-<timestamp>
// ─────────────────────────────────────────────
function generateClientId() {
    return 'CLI-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}

// ─────────────────────────────────────────────
// GET /api/admin/clients — Listar todos los clientes
// ─────────────────────────────────────────────
router.get('/clients', async (req, res) => {
    const user = requireAdmin(req, res);
    if (!user) return;

    try {
        const { data, error } = await supabase
            .from('clients')
            .select('id, client_id, name, email, airtable_base_id, active, created_at, last_login')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ success: true, clients: data });
    } catch (err) {
        console.error('[ADMIN] Error listando clientes:', err.message);
        res.status(500).json({ error: 'Error al obtener la lista de clientes.' });
    }
});

// ─────────────────────────────────────────────
// POST /api/admin/clients — Crear un nuevo cliente
// Body: { name, email, password, airtable_base_id }
// ─────────────────────────────────────────────
router.post('/clients', async (req, res) => {
    const user = requireAdmin(req, res);
    if (!user) return;

    try {
        const { name, email, password, airtable_base_id } = req.body;

        if (!name || !email || !password || !airtable_base_id) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios: name, email, password, airtable_base_id.' });
        }

        // Verificar si el email ya existe
        const { data: existing } = await supabase
            .from('clients')
            .select('id')
            .eq('email', email.toLowerCase().trim())
            .limit(1);

        if (existing && existing.length > 0) {
            return res.status(409).json({ error: 'Ya existe un cliente con ese email.' });
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const clientId = generateClientId();

        const { data, error } = await supabase
            .from('clients')
            .insert({
                client_id: clientId,
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password_hash: passwordHash,
                airtable_base_id: airtable_base_id.trim(),
                active: true
            })
            .select('id, client_id, name, email, airtable_base_id, active, created_at');

        if (error) throw error;

        console.log(`[ADMIN] Cliente creado: ${email} (${clientId})`);
        res.status(201).json({ success: true, client: data[0] });
    } catch (err) {
        console.error('[ADMIN] Error creando cliente:', err.message);
        res.status(500).json({ error: 'Error al crear el cliente.' });
    }
});

// ─────────────────────────────────────────────
// PUT /api/admin/clients/:id — Editar cliente
// Body: { name?, email?, password?, airtable_base_id? }
// ─────────────────────────────────────────────
router.put('/clients/:id', async (req, res) => {
    const user = requireAdmin(req, res);
    if (!user) return;

    try {
        const { id } = req.params;
        const { name, email, password, airtable_base_id } = req.body;

        const updates = {};
        if (name) updates.name = name.trim();
        if (email) updates.email = email.toLowerCase().trim();
        if (airtable_base_id) updates.airtable_base_id = airtable_base_id.trim();
        if (password) updates.password_hash = await bcrypt.hash(password, SALT_ROUNDS);

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron campos para actualizar.' });
        }

        const { data, error } = await supabase
            .from('clients')
            .update(updates)
            .eq('id', id)
            .select('id, client_id, name, email, airtable_base_id, active, created_at, last_login');

        if (error) throw error;

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado.' });
        }

        console.log(`[ADMIN] Cliente actualizado: ${id}`);
        res.json({ success: true, client: data[0] });
    } catch (err) {
        console.error('[ADMIN] Error actualizando cliente:', err.message);
        res.status(500).json({ error: 'Error al actualizar el cliente.' });
    }
});

// ─────────────────────────────────────────────
// DELETE /api/admin/clients/:id — Eliminar cliente
// ─────────────────────────────────────────────
router.delete('/clients/:id', async (req, res) => {
    const user = requireAdmin(req, res);
    if (!user) return;

    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id)
            .select('id, email');

        if (error) throw error;

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado.' });
        }

        console.log(`[ADMIN] Cliente eliminado: ${data[0].email}`);
        res.json({ success: true, message: 'Cliente eliminado correctamente.' });
    } catch (err) {
        console.error('[ADMIN] Error eliminando cliente:', err.message);
        res.status(500).json({ error: 'Error al eliminar el cliente.' });
    }
});

// ─────────────────────────────────────────────
// PUT /api/admin/clients/:id/toggle — Activar/desactivar cliente
// ─────────────────────────────────────────────
router.put('/clients/:id/toggle', async (req, res) => {
    const user = requireAdmin(req, res);
    if (!user) return;

    try {
        const { id } = req.params;

        // Obtener estado actual
        const { data: current, error: fetchError } = await supabase
            .from('clients')
            .select('active')
            .eq('id', id)
            .limit(1);

        if (fetchError) throw fetchError;

        if (!current || current.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado.' });
        }

        const newActive = !current[0].active;

        const { data, error } = await supabase
            .from('clients')
            .update({ active: newActive })
            .eq('id', id)
            .select('id, client_id, name, email, active');

        if (error) throw error;

        const statusText = newActive ? 'activado' : 'desactivado';
        console.log(`[ADMIN] Cliente ${statusText}: ${data[0].email}`);
        res.json({ success: true, client: data[0], message: `Cliente ${statusText} correctamente.` });
    } catch (err) {
        console.error('[ADMIN] Error toggling cliente:', err.message);
        res.status(500).json({ error: 'Error al cambiar el estado del cliente.' });
    }
});

// ─────────────────────────────────────────────
// GET /api/admin/admins — Listar todos los admins
// ─────────────────────────────────────────────
router.get('/admins', async (req, res) => {
    const user = requireAdmin(req, res);
    if (!user) return;

    try {
        const { data, error } = await supabase
            .from('admins')
            .select('id, admin_id, name, email, role, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ success: true, admins: data });
    } catch (err) {
        console.error('[ADMIN] Error listando admins:', err.message);
        res.status(500).json({ error: 'Error al obtener la lista de administradores.' });
    }
});

// ─────────────────────────────────────────────
// POST /api/admin/admins — Crear un nuevo administrador
// ─────────────────────────────────────────────
router.post('/admins', async (req, res) => {
    const user = requireAdmin(req, res);
    if (!user) return;

    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Nombre, Email y Contraseña son obligatorios.' });
        }

        // Verificar si existe el email en admins
        const { data: existing } = await supabase
            .from('admins')
            .select('id')
            .eq('email', email.toLowerCase().trim())
            .limit(1);

        if (existing && existing.length > 0) {
            return res.status(409).json({ error: 'Ya existe un administrador con ese email.' });
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const adminId = 'ADM-' + Date.now().toString(36).toUpperCase();

        const { data, error } = await supabase
            .from('admins')
            .insert({
                admin_id: adminId,
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password_hash: passwordHash,
                role: 'admin'
            })
            .select('id, admin_id, name, email, role, created_at');

        if (error) throw error;

        res.status(201).json({ success: true, admin: data[0] });
    } catch (err) {
        console.error('[ADMIN] Error creando admin:', err.message);
        res.status(500).json({ error: 'Error al crear el administrador.' });
    }
});

// ─────────────────────────────────────────────
// PUT /api/admin/admins/:id — Editar admin
// ─────────────────────────────────────────────
router.put('/admins/:id', async (req, res) => {
    const user = requireAdmin(req, res);
    if (!user) return;

    try {
        const { id } = req.params;
        const { name, email, password } = req.body;

        const updates = {};
        if (name) updates.name = name.trim();
        if (email) updates.email = email.toLowerCase().trim();
        if (password) updates.password_hash = await bcrypt.hash(password, SALT_ROUNDS);

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron campos para actualizar.' });
        }

        const { data, error } = await supabase
            .from('admins')
            .update(updates)
            .eq('id', id)
            .select('id, name, email, role');

        if (error) throw error;

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Administrador no encontrado.' });
        }

        console.log(`[ADMIN] Admin actualizado: ${id}`);
        res.json({ success: true, admin: data[0] });
    } catch (err) {
        console.error('[ADMIN] Error actualizando admin:', err.message);
        res.status(500).json({ error: 'Error al actualizar el administrador.' });
    }
});

// ─────────────────────────────────────────────
// DELETE /api/admin/admins/:id — Eliminar admin
// ─────────────────────────────────────────────
router.delete('/admins/:id', async (req, res) => {
    const user = requireAdmin(req, res);
    if (!user) return;

    try {
        const { id } = req.params;

        // Protección: No permitir que un admin se borre a sí mismo
        if (String(id) === String(user.id)) {
            return res.status(403).json({ error: 'No puedes eliminarte a ti mismo.' });
        }

        const { data, error } = await supabase
            .from('admins')
            .delete()
            .eq('id', id)
            .select('id, email');

        if (error) throw error;

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Administrador no encontrado.' });
        }

        console.log(`[ADMIN] Admin eliminado por el superadmin: ${data[0].email}`);
        res.json({ success: true, message: 'Administrador eliminado correctamente.' });
    } catch (err) {
        console.error('[ADMIN] Error eliminando admin:', err.message);
        res.status(500).json({ error: 'Error al eliminar el administrador.' });
    }
});

// ─────────────────────────────────────────────
// GESTIÓN DE AVISOS (GLOBAL NOTICES)
// ─────────────────────────────────────────────

// GET /api/admin/notices — Listar todos los avisos
router.get('/notices', async (req, res) => {
    const user = requireAdmin(req, res);
    if (!user) return;

    try {
        const { data, error } = await supabase
            .from('global_notices')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            // Si la tabla no existe, devolvemos array vacío en lugar de 500 para no romper el panel
            if (error.code === '42P01') return res.json({ success: true, notices: [] });
            throw error;
        }

        res.json({ success: true, notices: data });
    } catch (err) {
        console.error('[ADMIN] Error listando avisos:', err.message);
        res.status(500).json({ error: 'Error al obtener la lista de avisos.' });
    }
});

// POST /api/admin/notices — Crear o actualizar aviso
router.post('/notices', async (req, res) => {
    const user = requireAdmin(req, res);
    if (!user) return;

    try {
        const { content, type, target_client_id, active } = req.body;

        if (!content) return res.status(400).json({ error: 'El contenido del aviso es obligatorio.' });

        // Si es un aviso "General", desactivamos los anteriores para que solo haya uno activo (opcional)
        // Por simplificación, permitiremos varios.

        const { data, error } = await supabase
            .from('global_notices')
            .insert({
                content: content.trim(),
                type: type || 'info',
                target_client_id: target_client_id || null,
                active: active !== undefined ? active : true,
                created_by: user.id
            })
            .select('*');

        if (error) throw error;

        res.status(201).json({ success: true, notice: data[0] });
    } catch (err) {
        console.error('[ADMIN] Error creando aviso:', err.message);
        res.status(500).json({ error: 'Error al crear el aviso en Supabase.' });
    }
});

// DELETE /api/admin/notices/:id — Eliminar aviso
router.delete('/notices/:id', async (req, res) => {
    const user = requireAdmin(req, res);
    if (!user) return;

    try {
        const { id } = req.params;
        const { error } = await supabase.from('global_notices').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true, message: 'Aviso eliminado.' });
    } catch (err) {
        console.error('[ADMIN] Error eliminando aviso:', err.message);
        res.status(500).json({ error: 'Error al eliminar el aviso.' });
    }
});

module.exports = router;
