const db = require('../config/db');
const AuditService = require('../services/AuditService');

class PersonaModel {
    static async create(data) {
        let {
            tipo_documento_id,
            numero_documento,
            nombres,
            apellidos,
            fecha_nacimiento,
            sexo,
            ubigeo_id = '150101', // This might be a code string
            telefono,
            email,
            direccion = null
        } = data;

        // Defaults for missing required fields (Quick fix for demo)
        if (!fecha_nacimiento) fecha_nacimiento = '2000-01-01';
        if (!sexo) sexo = 'M'; // Default query validation

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // Handle Ubigeo: If string/code, lookup ID
            if (ubigeo_id && (typeof ubigeo_id === 'string' || ubigeo_id.length === 6)) {
                const [uRows] = await connection.execute('SELECT ubigeo_id FROM Ubigeo WHERE codigo = ?', [ubigeo_id]);
                if (uRows.length > 0) {
                    ubigeo_id = uRows[0].ubigeo_id;
                } else {
                    // Fallback: If not found, use NULL or a known ID?
                    // For now, let's try to find ANY ubigeo or null to avoid FK error
                    // OR if '150101', maybe insert it? 
                    // Let's assume database has some ubigeo. If specific code not found, set null.
                    ubigeo_id = null;
                }
            }

            const sql = `
                INSERT INTO Persona (
                    tipo_documento_id, numero_documento, nombres, apellidos, 
                    fecha_nacimiento, sexo, ubigeo_id, telefono, email, direccion
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await connection.execute(sql, [
                tipo_documento_id, numero_documento, nombres, apellidos,
                fecha_nacimiento, sexo, ubigeo_id, telefono, email, direccion
            ]);

            const personaId = result.insertId;

            // Audit Log
            await AuditService.logPersona(connection, personaId, 'INSERT', 'SYSTEM');

            await connection.commit();
            return personaId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async findByDocument(tipo_documento_id, numero_documento) {
        const sql = `SELECT * FROM Persona WHERE tipo_documento_id = ? AND numero_documento = ?`;
        const [rows] = await db.execute(sql, [tipo_documento_id, numero_documento]);
        return rows[0];
    }

    static async findById(id) {
        const sql = `SELECT * FROM Persona WHERE persona_id = ?`;
        const [rows] = await db.execute(sql, [id]);
        return rows[0];
    }

    static async search(term) {
        const searchTerm = `%${term}%`;
        const sql = `
            SELECT 
                p.*,
                td.nombre as tipo_documento,
                CASE 
                    WHEN m.medico_id IS NOT NULL THEN 'medico'
                    WHEN pa.paciente_id IS NOT NULL THEN 'paciente'
                    WHEN e.empleado_id IS NOT NULL THEN 'trabajador' -- Default for employees
                END as rol_base,
                e.cargo,
                CASE 
                    WHEN e.cargo = 'Administración' THEN 'admin'
                    WHEN e.cargo = 'Enfermería' THEN 'trabajador'
                    WHEN e.cargo = 'Limpieza' THEN 'trabajador'
                    WHEN e.cargo = 'Seguridad' THEN 'trabajador'
                    WHEN e.cargo = 'Técnico' THEN 'trabajador'
                    ELSE 
                        CASE 
                            WHEN m.medico_id IS NOT NULL THEN 'medico'
                            WHEN pa.paciente_id IS NOT NULL THEN 'paciente'
                            ELSE 'trabajador'
                        END
                END as rol,
                m.medico_id,
                pa.paciente_id,
                e.empleado_id
            FROM Persona p
            LEFT JOIN Tipo_Documento td ON p.tipo_documento_id = td.tipo_documento_id
            LEFT JOIN Medico m ON p.persona_id = m.persona_id
            LEFT JOIN Paciente pa ON p.persona_id = pa.persona_id
            LEFT JOIN Empleado e ON p.persona_id = e.persona_id
            WHERE p.nombres LIKE ? OR p.apellidos LIKE ? OR p.numero_documento LIKE ?
            LIMIT 20
        `;
        const [rows] = await db.execute(sql, [searchTerm, searchTerm, searchTerm]);
        return rows;
    }

    static async getAll() {
        const sql = `
            SELECT 
                p.*,
                td.nombre as tipo_documento,
                CASE 
                    WHEN m.medico_id IS NOT NULL THEN 'medico'
                    WHEN pa.paciente_id IS NOT NULL THEN 'paciente'
                    ELSE 'trabajador'
                END as rol,
                m.medico_id,
                m.numero_colegiatura,
                m.universidad_origen,
                pa.paciente_id,
                pa.tipo_sangre
            FROM Persona p
            LEFT JOIN Tipo_Documento td ON p.tipo_documento_id = td.tipo_documento_id
            LEFT JOIN Medico m ON p.persona_id = m.persona_id
            LEFT JOIN Paciente pa ON p.persona_id = pa.persona_id
            ORDER BY p.apellidos, p.nombres
        `;
        const [rows] = await db.execute(sql);
        return rows;
    }

    static async update(id, data) {
        const {
            nombres,
            apellidos,
            fecha_nacimiento,
            sexo,
            ubigeo_id,
            telefono,
            email,
            direccion
        } = data;

        const sql = `
            UPDATE Persona SET
                nombres = COALESCE(?, nombres),
                apellidos = COALESCE(?, apellidos),
                fecha_nacimiento = COALESCE(?, fecha_nacimiento),
                sexo = COALESCE(?, sexo),
                ubigeo_id = COALESCE(?, ubigeo_id),
                telefono = COALESCE(?, telefono),
                email = COALESCE(?, email),
                direccion = COALESCE(?, direccion)
            WHERE persona_id = ?
        `;

        const [result] = await db.execute(sql, [
            nombres, apellidos, fecha_nacimiento, sexo,
            ubigeo_id, telefono, email, direccion, id
        ]);

        return result.affectedRows > 0;
    }

    static async delete(id) {
        // Note: This may fail if persona has related records (paciente, medico, etc.)
        const sql = `DELETE FROM Persona WHERE persona_id = ?`;
        const [result] = await db.execute(sql, [id]);
        return result.affectedRows > 0;
    }
}

module.exports = PersonaModel;
