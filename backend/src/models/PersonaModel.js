const db = require('../config/db');
const AuditService = require('../services/AuditService');

class PersonaModel {
    static async create(data) {
        const {
            tipo_documento_id,
            numero_documento,
            nombres,
            apellidos,
            fecha_nacimiento,
            sexo,
            ubigeo_id = '150101', // Default Ubigeo if not provided
            telefono,
            email,
            direccion = null
        } = data;

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

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
            SELECT * FROM Persona 
            WHERE nombres LIKE ? OR apellidos LIKE ? OR numero_documento LIKE ?
            LIMIT 20
        `;
        const [rows] = await db.execute(sql, [searchTerm, searchTerm, searchTerm]);
        return rows;
    }
}

module.exports = PersonaModel;
