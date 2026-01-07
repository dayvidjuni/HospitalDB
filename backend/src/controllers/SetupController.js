const { seed } = require('../scripts/seedLib');

class SetupController {
    static async seed(req, res) {
        try {
            if (process.env.NODE_ENV === 'production') {
                return res.status(403).json({ error: 'Not allowed in production' });
            }
            const result = await seed();
            res.json({ message: 'Seed executed', result });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Seed failed', details: error.message });
        }
    }

    static async status(req, res) {
        res.json({ ok: true, env: process.env.NODE_ENV || 'development' });
    }
}

module.exports = SetupController;