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
}

module.exports = PersonaController;
