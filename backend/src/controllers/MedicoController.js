const MedicoModel = require('../models/MedicoModel');
const PersonaModel = require('../models/PersonaModel');

class MedicoController {

    // GET /api/medicos
    static async getAll(req, res) {
        try {
            const medicos = await MedicoModel.getAll();
            res.json(medicos);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al listar médicos' });
        }
    }

    // GET /api/medicos/:id
    static async getById(req, res) {
        try {
            const medico = await MedicoModel.findById(req.params.id);
            if (!medico) return res.status(404).json({ error: 'Médico no encontrado' });
            res.json(medico);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener médico' });
        }
    }

    // POST /api/medicos
    static async create(req, res) {
        try {
            const { persona_id, numero_colegiatura, universidad_origen, especialidades } = req.body;

            // Validations
            if (!persona_id || !numero_colegiatura) {
                return res.status(400).json({ error: 'Faltan datos obligatorios (persona_id, numero_colegiatura)' });
            }

            // Check if Persona exists
            const persona = await PersonaModel.findById(persona_id);
            if (!persona) return res.status(404).json({ error: 'Persona no encontrada. Registre la persona primero.' });

            const id = await MedicoModel.create(req.body);

            res.status(201).json({
                message: 'Médico creado exitosamente',
                medico_id: id
            });

        } catch (error) {
            console.error(error);
            if (error.code === 'ER_DUP_ENTRY') {
                if (error.message.includes('numero_colegiatura')) {
                    return res.status(409).json({ error: 'El número de colegiatura ya está registrado.' });
                }
                return res.status(409).json({ error: 'Esta persona ya es médico.' });
            }
            res.status(500).json({ error: 'Error interno al crear médico' });
        }
    }

    // PUT /api/medicos/:id
    static async update(req, res) {
        try {
            const { id } = req.params;
            const updated = await MedicoModel.update(id, req.body);

            if (!updated) return res.status(404).json({ error: 'No se pudo actualizar o médico no encontrado' });

            res.json({ message: 'Médico actualizado exitosamente' });
        } catch (error) {
            console.error(error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'El número de colegiatura ya está asignado a otro médico.' });
            }
            res.status(500).json({ error: 'Error al actualizar médico' });
        }
    }

    // DELETE /api/medicos/:id
    static async delete(req, res) {
        try {
            // WARNING: This depends on FK constraints. 
            // If Appointments exist, DB will throw error usually.
            const result = await MedicoModel.delete(req.params.id);
            if (!result) return res.status(404).json({ error: 'Médico no encontrado' });

            res.json({ message: 'Médico eliminado exitosamente' });
        } catch (error) {
            console.error(error);
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({ error: 'No se puede eliminar: El médico tiene citas o registros asociados.' });
            }
            res.status(500).json({ error: 'Error al eliminar médico' });
        }
    }
}

module.exports = MedicoController;
