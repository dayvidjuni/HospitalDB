const PersonaModel = require('../models/PersonaModel');

class PersonaController {
    static async create(req, res) {
        try {
            // Basic validation could go here
            const id = await PersonaModel.create(req.body);
            res.status(201).json({
                message: 'Persona creada exitosamente',
                persona_id: id
            });
        } catch (error) {
            console.error(error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Ya existe una persona con ese documento' });
            }
            res.status(500).json({ error: 'Error al crear persona' });
        }
    }

    static async search(req, res) {
        try {
            const { q = '' } = req.query;
            // if (!q) return res.status(400).json({ error: 'Término de búsqueda requerido' });

            const results = await PersonaModel.search(q);
            res.json(results);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al buscar personas' });
        }
    }

    static async getAll(req, res) {
        try {
            const personas = await PersonaModel.getAll();
            res.json(personas);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener personas' });
        }
    }

    static async getById(req, res) {
        try {
            const persona = await PersonaModel.findById(req.params.id);
            if (!persona) return res.status(404).json({ error: 'Persona no encontrada' });
            res.json(persona);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener persona' });
        }
    }

    static async update(req, res) {
        try {
            const updated = await PersonaModel.update(req.params.id, req.body);
            if (!updated) return res.status(404).json({ error: 'Persona no encontrada' });
            res.json({ message: 'Persona actualizada exitosamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al actualizar persona' });
        }
    }

    static async delete(req, res) {
        try {
            const deleted = await PersonaModel.delete(req.params.id);
            if (!deleted) return res.status(404).json({ error: 'Persona no encontrada' });
            res.json({ message: 'Persona eliminada exitosamente' });
        } catch (error) {
            console.error(error);
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({ error: 'No se puede eliminar: tiene registros asociados (paciente, médico, etc.)' });
            }
            res.status(500).json({ error: 'Error al eliminar persona' });
        }
    }
}

module.exports = PersonaController;
