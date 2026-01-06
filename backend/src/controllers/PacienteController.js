const PacienteModel = require('../models/PacienteModel');
const PersonaModel = require('../models/PersonaModel');

class PacienteController {
    static async create(req, res) {
        try {
            // Expects { persona: { ... }, paciente: { tipo_sangre: ... } }
            // OR checks if persona_id is provided to link existing persona

            const { persona_id, tipo_sangre } = req.body;

            if (!persona_id) {
                return res.status(400).json({ error: 'Se requiere persona_id. Cree la persona primero o envíe el ID.' });
            }

            // Verify persona exists
            const persona = await PersonaModel.findById(persona_id);
            if (!persona) {
                return res.status(404).json({ error: 'Persona no encontrada' });
            }

            const pacienteId = await PacienteModel.create(persona_id, tipo_sangre);
            res.status(201).json({
                message: 'Paciente registrado exitosamente',
                paciente_id: pacienteId
            });

        } catch (error) {
            console.error(error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Esta persona ya está registrada como paciente' });
            }
            res.status(500).json({ error: 'Error al registrar paciente' });
        }
    }

    static async getAll(req, res) {
        try {
            const pacientes = await PacienteModel.getAll();
            res.json(pacientes);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener pacientes' });
        }
    }

    static async getById(req, res) {
        try {
            const paciente = await PacienteModel.findById(req.params.id);
            if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });
            res.json(paciente);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener paciente' });
        }
    }

    // GET /api/pacientes/:id/historial
    static async getHistorial(req, res) {
        try {
            const historial = await PacienteModel.getFullHistory(req.params.id);
            if (!historial) return res.status(404).json({ error: 'Paciente no encontrado' });
            res.json(historial);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener historial clínico' });
        }
    }
}

module.exports = PacienteController;
