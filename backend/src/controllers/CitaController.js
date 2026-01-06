const CitaModel = require('../models/CitaModel');

class CitaController {

    // POST /api/citas
    static async create(req, res) {
        try {
            const { paciente_id, medico_id, especialidad_id, fecha, hora, motivo } = req.body;

            // Basic Validation
            if (!paciente_id || !medico_id || !fecha || !hora) {
                return res.status(400).json({ error: 'Faltan campos obligatorios' });
            }

            const id = await CitaModel.create(req.body);
            res.status(201).json({
                message: 'Cita programada exitosamente',
                cita_id: id,
                estado: 'Programada'
            });
        } catch (error) {
            console.error(error);
            // Handle FK errors
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({ error: 'Paciente, Médico o Especialidad no existen.' });
            }
            res.status(500).json({ error: 'Error al programar cita' });
        }
    }

    // PATCH /api/citas/:id/status
    // Body: { estado: 'Cancelada' | 'Atendida' | 'No Asistio', motivo: '...' }
    static async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { estado, motivo } = req.body;

            const validStatuses = ['Atendida', 'Cancelada', 'No Asistio'];
            if (!validStatuses.includes(estado)) {
                return res.status(400).json({ error: 'Estado inválido. Use: Atendida, Cancelada, No Asistio' });
            }

            if (estado === 'Cancelada' && !motivo) {
                return res.status(400).json({ error: 'Debe especificar un motivo para cancelar.' });
            }

            const result = await CitaModel.updateStatus(id, estado, motivo);
            res.json({
                message: `Cita actualizada de ${result.anterior} a ${result.nuevo}`,
                cita_id: id
            });
        } catch (error) {
            console.error(error);
            res.status(400).json({ error: error.message });
        }
    }

    // PATCH /api/citas/:id/reschedule
    // Body: { fecha: 'YYYY-MM-DD', hora: 'HH:MM', motivo: '...' }
    static async reschedule(req, res) {
        try {
            const { id } = req.params;
            const { fecha, hora, motivo } = req.body;

            if (!fecha || !hora || !motivo) {
                return res.status(400).json({ error: 'Fecha, hora y motivo son requeridos para reprogramar.' });
            }

            await CitaModel.reschedule(id, fecha, hora, motivo);
            res.json({ message: 'Cita reprogramada exitosamente' });
        } catch (error) {
            console.error(error);
            res.status(400).json({ error: error.message });
        }
    }

    // GET /api/citas
    static async getList(req, res) {
        try {
            const citas = await CitaModel.getByFilters(req.query);
            res.json(citas);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener citas' });
        }
    }

    // GET /api/citas/:id
    static async getById(req, res) {
        try {
            const cita = await CitaModel.getById(req.params.id);
            if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });

            const historial = await CitaModel.getHistory(req.params.id);
            res.json({ ...cita, historial });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener detalle de cita' });
        }
    }
}

module.exports = CitaController;
