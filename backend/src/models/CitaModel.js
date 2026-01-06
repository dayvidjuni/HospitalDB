const db = require('../config/db');
const AuditService = require('../services/AuditService');

class CitaModel {
    static async create(data) {
        const { paciente_id, medico_id, especialidad_id, fecha, hora, motivo } = data;
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // 1. Validate if Patient and Doctor exist (Foreign Keys check usually handles this but explicit check is nicer for errors)
            // We rely on DB constraints for atomicity.

            const sql = `
                INSERT INTO Cita (paciente_id, medico_id, especialidad_id, fecha, hora, motivo, estado)
                VALUES (?, ?, ?, ?, ?, ?, 'Programada')
            `;
            const [result] = await connection.execute(sql, [
                paciente_id, medico_id, especialidad_id, fecha, hora, motivo
            ]);

            const citaId = result.insertId;

            // 2. Initial Audit Log (Optional, but good practice)
            await connection.execute(
                `INSERT INTO Cita_Historial (cita_id, estado_anterior, estado_nuevo, motivo) 
                 VALUES (?, NULL, 'Programada', 'Creación inicial')`,
                [citaId]
            );

            await connection.commit();
            return citaId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Change status (Cancel, Attend, No Show)
     */
    static async updateStatus(cita_id, nuevo_estado, motivo_cambio) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Get current status to validate transition
            const [rows] = await connection.execute('SELECT estado FROM Cita WHERE cita_id = ? FOR UPDATE', [cita_id]);
            if (rows.length === 0) throw new Error('Cita no encontrada');

            const estado_anterior = rows[0].estado;

            // Validations
            if (estado_anterior === 'Cancelada') {
                throw new Error('No se puede modificar una cita cancelada.');
            }
            if (estado_anterior === 'Atendida' && nuevo_estado === 'Cancelada') {
                throw new Error('No se puede cancelar una cita ya atendida.');
            }

            // 2. Update Cita
            await connection.execute(
                'UPDATE Cita SET estado = ? WHERE cita_id = ?',
                [nuevo_estado, cita_id]
            );

            // 3. Log into History
            await connection.execute(
                `INSERT INTO Cita_Historial (cita_id, estado_anterior, estado_nuevo, motivo) 
                 VALUES (?, ?, ?, ?)`,
                [cita_id, estado_anterior, nuevo_estado, motivo_cambio]
            );

            // Audit Table Log
            await AuditService.logCita(connection, cita_id, 'UPDATE_STATUS', 'SYSTEM');

            await connection.commit();
            return { anterior: estado_anterior, nuevo: nuevo_estado };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Reschedule: Changes Date/Time and logs it
     */
    static async reschedule(cita_id, nueva_fecha, nueva_hora, motivo_cambio) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Verify current status
            const [rows] = await connection.execute('SELECT estado, fecha, hora FROM Cita WHERE cita_id = ? FOR UPDATE', [cita_id]);
            if (rows.length === 0) throw new Error('Cita no encontrada');

            const actual = rows[0];
            if (['Cancelada', 'Atendida', 'No Asistio'].includes(actual.estado)) {
                throw new Error(`No se puede reprogramar una cita en estado ${actual.estado}`);
            }

            // 2. Update Cita
            await connection.execute(
                'UPDATE Cita SET fecha = ?, hora = ? WHERE cita_id = ?',
                [nueva_fecha, nueva_hora, cita_id]
            );

            // 3. Log into Hostorial (Special logging for reschedule)
            const detalleAnterior = `Fecha: ${actual.fecha}, Hora: ${actual.hora}`;
            const detalleNuevo = `Reprogramada a ${nueva_fecha} ${nueva_hora}`;

            await connection.execute(
                `INSERT INTO Cita_Historial (cita_id, estado_anterior, estado_nuevo, motivo) 
                 VALUES (?, ?, ?, ?)`,
                [cita_id, actual.estado, actual.estado, `${motivo_cambio} (${detalleAnterior} -> ${detalleNuevo})`]
            );

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async getById(id) {
        const sql = `
            SELECT 
                c.*,
                CONCAT(pp.nombres, ' ', pp.apellidos) as paciente_nombre,
                CONCAT(pm.nombres, ' ', pm.apellidos) as medico_nombre,
                e.nombre as especialidad
            FROM Cita c
            JOIN Paciente p ON c.paciente_id = p.paciente_id
            JOIN Persona pp ON p.persona_id = pp.persona_id
            JOIN Medico m ON c.medico_id = m.medico_id
            JOIN Persona pm ON m.persona_id = pm.persona_id
            JOIN Especialidad e ON c.especialidad_id = e.especialidad_id
            WHERE c.cita_id = ?
        `;
        const [rows] = await db.execute(sql, [id]);
        return rows[0];
    }

    static async getHistory(cita_id) {
        const sql = `SELECT * FROM Cita_Historial WHERE cita_id = ? ORDER BY fecha_cambio DESC`;
        const [rows] = await db.execute(sql, [cita_id]);
        return rows;
    }

    static async getByFilters(filters) {
        let sql = `
            SELECT 
                c.cita_id, c.fecha, c.hora, c.motivo, c.estado,
                CONCAT(pp.nombres, ' ', pp.apellidos) as paciente,
                CONCAT(pm.nombres, ' ', pm.apellidos) as medico,
                e.nombre as especialidad
            FROM Cita c
            JOIN Paciente p ON c.paciente_id = p.paciente_id
            JOIN Persona pp ON p.persona_id = pp.persona_id
            JOIN Medico m ON c.medico_id = m.medico_id
            JOIN Persona pm ON m.persona_id = pm.persona_id
            JOIN Especialidad e ON c.especialidad_id = e.especialidad_id
            WHERE 1=1
        `;
        const params = [];

        if (filters.medico_id) { sql += ' AND c.medico_id = ?'; params.push(filters.medico_id); }
        if (filters.paciente_id) { sql += ' AND c.paciente_id = ?'; params.push(filters.paciente_id); }
        if (filters.fecha) { sql += ' AND c.fecha = ?'; params.push(filters.fecha); }
        if (filters.estado) { sql += ' AND c.estado = ?'; params.push(filters.estado); }

        sql += ' ORDER BY c.fecha, c.hora';
        const [rows] = await db.execute(sql, params);
        return rows;
    }
}



module.exports = CitaModel;
