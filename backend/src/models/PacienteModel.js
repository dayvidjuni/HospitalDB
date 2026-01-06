const db = require('../config/db');

class PacienteModel {
    static async create(persona_id, tipo_sangre = null) {
        const sql = `
            INSERT INTO Paciente (persona_id, tipo_sangre) 
            VALUES (?, ?)
        `;
        const [result] = await db.execute(sql, [persona_id, tipo_sangre]);
        return result.insertId;
    }

    static async getAll() {
        const sql = `
            SELECT 
                pa.paciente_id,
                pa.fecha_registro,
                pa.tipo_sangre,
                pe.*,
                td.nombre as tipo_documento
            FROM Paciente pa
            JOIN Persona pe ON pa.persona_id = pe.persona_id
            JOIN Tipo_Documento td ON pe.tipo_documento_id = td.tipo_documento_id
            ORDER BY pe.apellidos, pe.nombres
        `;
        const [rows] = await db.execute(sql);
        return rows;
    }

    static async findById(id) {
        const sql = `
            SELECT 
                pa.paciente_id,
                pa.fecha_registro,
                pa.tipo_sangre,
                pe.*
            FROM Paciente pa
            JOIN Persona pe ON pa.persona_id = pe.persona_id
            WHERE pa.paciente_id = ?
        `;
        const [rows] = await db.execute(sql, [id]);
        return rows[0];
    }

    static async getFullHistory(id) {
        // 1. Get Basic Patient Info
        const paciente = await this.findById(id);
        if (!paciente) return null;

        // 2. Get Clinical Timeline (Citas + Atencion + Receta)
        const sql = `
            SELECT 
                c.cita_id, c.fecha, c.hora, c.motivo, c.estado,
                -- Medico Info
                CONCAT(p_med.nombres, ' ', p_med.apellidos) as medico,
                esp.nombre as especialidad,
                -- Medical Attention
                am.atencion_id, am.diagnostico, am.observaciones,
                -- Receta Header
                r.receta_id, r.indicaciones_generales
            FROM Cita c
            JOIN Medico m ON c.medico_id = m.medico_id
            JOIN Persona p_med ON m.persona_id = p_med.persona_id
            JOIN Especialidad esp ON c.especialidad_id = esp.especialidad_id
            LEFT JOIN Atencion_Medica am ON c.cita_id = am.cita_id
            LEFT JOIN Receta r ON c.cita_id = r.cita_id
            WHERE c.paciente_id = ?
            ORDER BY c.fecha DESC, c.hora DESC
        `;

        const [timeline] = await db.execute(sql, [id]);

        return {
            paciente,
            historial: timeline
        };
    }
}

module.exports = PacienteModel;
