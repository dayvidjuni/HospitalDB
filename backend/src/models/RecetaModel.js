const db = require('../config/db');

class RecetaModel {
    static async create(data) {
        const { cita_id, diagnostico, indicaciones_generales, medicamentos } = data;
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // 1. Validation: Cita must have Medical Attention
            const [atencion] = await connection.execute(
                'SELECT atencion_id FROM Atencion_Medica WHERE cita_id = ?',
                [cita_id]
            );

            if (atencion.length === 0) {
                throw new Error('No se puede generar receta. La cita no tiene atención médica registrada.');
            }

            // 2. Create Receta Header
            const [result] = await connection.execute(
                'INSERT INTO Receta (cita_id, diagnostico, indicaciones_generales) VALUES (?, ?, ?)',
                [cita_id, diagnostico, indicaciones_generales]
            );
            const recetaId = result.insertId;

            // 3. Insert Details (Medicamentos)
            if (medicamentos && Array.isArray(medicamentos) && medicamentos.length > 0) {
                const detailSql = `
                    INSERT INTO Detalle_Receta (receta_id, nombre_medicamento, dosis, frecuencia, duracion, cantidad_total)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;

                for (const med of medicamentos) {
                    // Validar campos obligatorios de medicamento
                    if (!med.nombre_medicamento) continue;

                    await connection.execute(detailSql, [
                        recetaId,
                        med.nombre_medicamento,
                        med.dosis || '',
                        med.frecuencia || '',
                        med.duracion || '',
                        med.cantidad_total || null
                    ]);
                }
            }

            await connection.commit();
            return recetaId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async getByCitaId(citaId) {
        // Get Header
        const [recetas] = await db.execute('SELECT * FROM Receta WHERE cita_id = ?', [citaId]);
        if (recetas.length === 0) return null;

        const receta = recetas[0];

        // Get Details
        const [detalles] = await db.execute('SELECT * FROM Detalle_Receta WHERE receta_id = ?', [receta.receta_id]);

        return {
            ...receta,
            medicamentos: detalles
        };
    }

    static async getById(id) {
        const [recetas] = await db.execute('SELECT * FROM Receta WHERE receta_id = ?', [id]);
        if (recetas.length === 0) return null;

        const receta = recetas[0];
        const [detalles] = await db.execute('SELECT * FROM Detalle_Receta WHERE receta_id = ?', [id]);

        return { ...receta, medicamentos: detalles };
    }
}

module.exports = RecetaModel;
