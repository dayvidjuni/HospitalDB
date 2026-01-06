const db = require('../config/db');

class AtencionModel {
    static async create(data) {
        const { cita_id, diagnostico, observaciones } = data;
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // 1. Validate - Cita must exist and be 'Programada'
            const [citas] = await connection.execute(
                'SELECT estado FROM Cita WHERE cita_id = ? FOR UPDATE',
                [cita_id]
            );

            if (citas.length === 0) throw new Error('Cita no encontrada');
            const estadoActual = citas[0].estado;

            if (estadoActual !== 'Programada') {
                throw new Error(`No se puede registrar atención. La cita está en estado: ${estadoActual}`);
            }

            // 2. Insert Atencion_Medica
            const [result] = await connection.execute(
                'INSERT INTO Atencion_Medica (cita_id, diagnostico, observaciones) VALUES (?, ?, ?)',
                [cita_id, diagnostico, observaciones]
            );
            const atencionId = result.insertId;

            // 3. Update Cita status to 'Atendida'
            await connection.execute(
                'UPDATE Cita SET estado = "Atendida" WHERE cita_id = ?',
                [cita_id]
            );

            // 4. Log Change in Cita_Historial
            await connection.execute(
                `INSERT INTO Cita_Historial (cita_id, estado_anterior, estado_nuevo, motivo) 
                 VALUES (?, ?, ?, ?)`,
                [cita_id, estadoActual, 'Atendida', `Atención médica registrada (ID: ${atencionId})`]
            );

            await connection.commit();
            return atencionId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async getByCitaId(citaId) {
        const [rows] = await db.execute(
            'SELECT * FROM Atencion_Medica WHERE cita_id = ?',
            [citaId]
        );
        return rows[0];
    }
}

module.exports = AtencionModel;
