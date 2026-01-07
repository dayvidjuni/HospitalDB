const express = require('express');
const cors = require('cors');
require('dotenv').config();

const personaRoutes = require('./routes/personaRoutes');
const pacienteRoutes = require('./routes/pacienteRoutes');
const medicoRoutes = require('./routes/medicoRoutes');
const citaRoutes = require('./routes/citaRoutes');
const atencionRoutes = require('./routes/atencionRoutes');
const setupRoutes = require('./routes/setupRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/personas', personaRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/medicos', medicoRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/atenciones', atencionRoutes);

// Dev-only setup endpoints (seed, status)
app.use('/api/setup', setupRoutes);

// Health Check
app.get('/api/status', (req, res) => {
    res.json({ status: 'OK', message: 'Hospital API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
