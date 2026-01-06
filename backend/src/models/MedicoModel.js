const db = require('../config/db');

class MedicoModel {
    /**
     * Create a new Medico with optional Specialties
     * @param {Object} data - { persona_id, numero_colegiatura, universidad_origen, especialidades: [id, id] }
     */
    static async create(data) {
        const { persona_id, numero_colegiatura, universidad_origen, especialidades } = data;
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // 1. Insert Medico
            const [result] = await connection.execute(
                `INSERT INTO Medico (persona_id, numero_colegiatura, universidad_origen) 
                 VALUES (?, ?, ?)`,
                [persona_id, numero_colegiatura, universidad_origen]
            );
            const medicoId = result.insertId;

            // 2. Insert Specialties
            if (especialidades && especialidades.length > 0) {
                const values = especialidades.map(id => [medicoId, id]);
                await connection.query(
                    'INSERT INTO Medico_Especialidad (medico_id, especialidad_id) VALUES ?',
                    [values]
                );
            }

            await connection.commit();
            return medicoId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Update Medico details and specialties
     * @param {number} id - Medico ID
     * @param {Object} data 
     */
    static async update(id, data) {
        const { numero_colegiatura, universidad_origen, especialidades } = data;
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // 1. Update basic info
            if (numero_colegiatura || universidad_origen) {
                await connection.execute(
                    `UPDATE Medico SET 
                        numero_colegiatura = COALESCE(?, numero_colegiatura),
                        universidad_origen = COALESCE(?, universidad_origen)
                     WHERE medico_id = ?`,
                    [numero_colegiatura, universidad_origen, id]
                );
            }

            // 2. Update Specialties (Delete all & Re-insert strategy for simplicity)
            if (especialidades) {
                await connection.execute('DELETE FROM Medico_Especialidad WHERE medico_id = ?', [id]);

                if (especialidades.length > 0) {
                    const values = especialidades.map(espId => [id, espId]);
                    await connection.query(
                        'INSERT INTO Medico_Especialidad (medico_id, especialidad_id) VALUES ?',
                        [values]
                    );
                }
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async delete(id) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            // Delete relationships first
            await connection.execute('DELETE FROM Medico_Especialidad WHERE medico_id = ?', [id]);
            await connection.execute('DELETE FROM Horario_Medico WHERE medico_id = ?', [id]);
            // Delete Medico
            const [result] = await connection.execute('DELETE FROM Medico WHERE medico_id = ?', [id]);

            await connection.commit();
            return result.affectedRows > 0;
        } catch (error) {
            await connection.rollback();
            throw error; // Propagate error (likely constraint violation if appointments exist)
        } finally {
            connection.release();
        }
    }

    static async getAll() {
        const sql = `
            SELECT 
                m.medico_id, m.numero_colegiatura, m.universidad_origen, m.fecha_ingreso,
                p.nombres, p.apellidos,
                JSON_ARRAYAGG(
                    JSON_OBJECT('id', e.especialidad_id, 'nombre', e.nombre)
                ) as especialidades
            FROM Medico m
            JOIN Persona p ON m.persona_id = p.persona_id
            LEFT JOIN Medico_Especialidad me ON m.medico_id = me.medico_id
            LEFT JOIN Especialidad e ON me.especialidad_id = e.especialidad_id
            GROUP BY m.medico_id
        `;
        const [rows] = await db.execute(sql);
        return rows;
    }

    static async findById(id) {
        const sql = `
            SELECT 
                m.medico_id, m.numero_colegiatura, m.universidad_origen, m.fecha_ingreso,
                p.persona_id, p.nombres, p.apellidos, p.numero_documento,
                JSON_ARRAYAGG(
                    JSON_OBJECT('id', e.especialidad_id, 'nombre', e.nombre)
                ) as especialidades
            FROM Medico m
            JOIN Persona p ON m.persona_id = p.persona_id
            LEFT JOIN Medico_Especialidad me ON m.medico_id = me.medico_id
            LEFT JOIN Especialidad e ON me.especialidad_id = e.especialidad_id
            WHERE m.medico_id = ?
            GROUP BY m.medico_id
        `;
        const [rows] = await db.execute(sql, [id]);
        return rows[0];
    }
}

module.exports = MedicoModel;
