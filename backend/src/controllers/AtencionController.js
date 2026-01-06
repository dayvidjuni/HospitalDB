const AtencionModel = require('../models/AtencionModel');
const RecetaModel = require('../models/RecetaModel');

class AtencionController {

    // POST /api/atenciones
    static async registrarAtencion(req, res) {
        try {
            const { cita_id, diagnostico, observaciones } = req.body;

            if (!cita_id || !diagnostico) {
                return res.status(400).json({ error: 'Faltan datos obligatorios (cita_id, diagnostico)' });
            }

            const id = await AtencionModel.create(req.body);
            res.status(201).json({
                message: 'Atención registrada exitosamente. Cita marcada como atendida.',
                atencion_id: id
            });
        } catch (error) {
            console.error(error);
            // Handle unique constraint (Duplicate attention)
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Esta cita ya tiene una atención registrada.' });
            }
            res.status(400).json({ error: error.message });
        }
    }

    // GET /api/atenciones/:cita_id
    static async getAtencionByCita(req, res) {
        try {
            const atencion = await AtencionModel.getByCitaId(req.params.cita_id);
            if (!atencion) return res.status(404).json({ error: 'No se encontró atención para esta cita' });
            res.json(atencion);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener atención' });
        }
    }

    // POST /api/atenciones/recetas
    static async generarReceta(req, res) {
        try {
            const { cita_id, medicamentos } = req.body;

            if (!cita_id) {
                return res.status(400).json({ error: 'cita_id es requerido' });
            }
            if (!medicamentos || medicamentos.length === 0) {
                return res.status(400).json({ error: 'La receta debe incluir al menos un medicamento.' });
            }

            const id = await RecetaModel.create(req.body);
            res.status(201).json({
                message: 'Receta generada exitosamente',
                receta_id: id
            });
        } catch (error) {
            console.error(error);
            res.status(400).json({ error: error.message });
        }
    }

    // GET /api/atenciones/recetas/:id (Busca por ID de Receta)
    static async getRecetaById(req, res) {
        try {
            const receta = await RecetaModel.getById(req.params.id);
            if (!receta) return res.status(404).json({ error: 'Receta no encontrada' });
            res.json(receta);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener receta' });
        }
    }

    // GET /api/atenciones/cita/:cita_id/receta (Busca receta por Cita)
    static async getRecetaByCita(req, res) {
        try {
            const receta = await RecetaModel.getByCitaId(req.params.cita_id);
            if (!receta) return res.status(404).json({ error: 'No hay receta asociada a esta cita' });
            res.json(receta);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener receta de la cita' });
        }
    }
}

module.exports = AtencionController;
