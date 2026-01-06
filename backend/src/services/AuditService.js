const db = require('../config/db');

class AuditService {
    /**
     * Logs action on Persona table
     * @param {Object} connection - DB Connection (for transaction)
     * @param {number} persona_id
     * @param {string} accion - INSERT, UPDATE, DELETE
     * @param {string} usuario - User performing action
     */
    static async logPersona(connection, persona_id, accion, usuario = 'SYSTEM') {
        const sql = `
            INSERT INTO Auditoria_Persona (persona_id, accion, usuario, fecha)
            VALUES (?, ?, ?, NOW())
        `;
        // Use provided connection if available, otherwise use pool
        if (connection) {
            await connection.execute(sql, [persona_id, accion, usuario]);
        } else {
            await db.execute(sql, [persona_id, accion, usuario]);
        }
    }

    /**
     * Logs action on Cita table
     * @param {Object} connection 
     * @param {number} cita_id 
     * @param {string} accion 
     * @param {string} usuario 
     */
    static async logCita(connection, cita_id, accion, usuario = 'SYSTEM') {
        const sql = `
            INSERT INTO Auditoria_Cita (cita_id, accion, usuario, fecha)
            VALUES (?, ?, ?, NOW())
        `;
        if (connection) {
            await connection.execute(sql, [cita_id, accion, usuario]);
        } else {
            await db.execute(sql, [cita_id, accion, usuario]);
        }
    }
}

module.exports = AuditService;
