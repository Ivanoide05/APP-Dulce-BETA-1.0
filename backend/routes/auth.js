// ===== RUTAS DE AUTENTICACIÓN =====
// POST /login — Autentica admins y clientes contra Supabase.
// Devuelve un JWT firmado con los datos del usuario.

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabaseClient');

// ─────────────────────────────────────────────
// POST /api/auth/login
// Busca primero en admins, luego en clients.
// Devuelve JWT con { id, email, name, role, airtable_base_id }
// ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 1. Buscar en la tabla admins
        const { data: adminRows, error: adminError } = await supabase
            .from('admins')
            .select('*')
            .eq('email', normalizedEmail)
            .limit(1);

        if (adminError) {
            console.error('[AUTH] Error buscando admin:', adminError.message);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }

        if (adminRows && adminRows.length > 0) {
            const admin = adminRows[0];
            const passwordMatch = await bcrypt.compare(password, admin.password_hash);

            if (!passwordMatch) {
                return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
            }

            // Actualizar last_login (sin bloquear la respuesta)
            supabase
                .from('admins')
                .update({ last_login: new Date().toISOString() })
                .eq('id', admin.id)
                .then(() => console.log(`[AUTH] Admin login: ${admin.email}`))
                .catch(err => console.error('[AUTH] Error actualizando last_login admin:', err.message));

            // Generar JWT para admin
            const token = jwt.sign(
                {
                    id: admin.id,
                    email: admin.email,
                    name: admin.name,
                    role: 'admin',
                    airtable_base_id: null
                },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );

            return res.json({
                success: true,
                token,
                user: {
                    id: admin.id,
                    email: admin.email,
                    name: admin.name,
                    role: 'admin'
                }
            });
        }

        // 2. Buscar en la tabla clients
        const { data: clientRows, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .eq('email', normalizedEmail)
            .limit(1);

        if (clientError) {
            console.error('[AUTH] Error buscando client:', clientError.message);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }

        if (!clientRows || clientRows.length === 0) {
            return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
        }

        const client = clientRows[0];

        // Verificar si está activo
        if (client.active === false) {
            return res.status(403).json({ error: 'Tu acceso está desactivado. Contacta con el administrador.' });
        }

        const passwordMatch = await bcrypt.compare(password, client.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
        }

        // Actualizar last_login (sin bloquear la respuesta)
        supabase
            .from('clients')
            .update({ last_login: new Date().toISOString() })
            .eq('id', client.id)
            .then(() => console.log(`[AUTH] Client login: ${client.email}`))
            .catch(err => console.error('[AUTH] Error actualizando last_login client:', err.message));

        // Generar JWT para cliente
        const token = jwt.sign(
            {
                id: client.id,
                email: client.email,
                name: client.name,
                role: 'client',
                airtable_base_id: client.airtable_base_id
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        return res.json({
            success: true,
            token,
            user: {
                id: client.id,
                email: client.email,
                name: client.name,
                role: 'client',
                airtable_base_id: client.airtable_base_id
            }
        });

    } catch (err) {
        console.error('[AUTH] Error en login:', err.message);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ─────────────────────────────────────────────
// GET /api/auth — Info del endpoint
// ─────────────────────────────────────────────
router.get('/', (req, res) => {
    res.json({
        message: 'Endpoint de autenticación de DulceOS activo.',
        endpoints: {
            login: 'POST /api/auth/login'
        }
    });
});

module.exports = router;

