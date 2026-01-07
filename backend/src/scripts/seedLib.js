const db = require('../config/db');

async function seed() {
    console.log('🌱 Running seed (seedLib)...');
    const connection = await db.getConnection();

    try {
        // 1. Tipo Documento
        const [docs] = await connection.query('SELECT COUNT(*) as count FROM Tipo_Documento');
        if (docs[0].count === 0) {
            console.log('Inserting Tipo_Documento...');
            await connection.query(`
                INSERT INTO Tipo_Documento (nombre_tipo) VALUES 
                ('DNI'), ('Pasaporte'), ('Carnet Extranjería')
            `);
        }

        // 2. Especialidades
        const [esps] = await connection.query('SELECT COUNT(*) as count FROM Especialidad');
        if (esps[0].count === 0) {
            console.log('Inserting Especialidad...');
            await connection.query(`
                INSERT INTO Especialidad (nombre, descripcion) VALUES 
                ('Medicina General', 'Atención primaria y preventiva'),
                ('Cardiología', 'Enfermedades del corazón'),
                ('Pediatría', 'Atención a niños y adolescentes'),
                ('Dermatología', 'Cuidado de la piel'),
                ('Neurología', 'Sistema nervioso')
            `);
        }

        // 3. Ubigeo
        const [ubis] = await connection.query('SELECT COUNT(*) as count FROM Ubigeo');
        if (ubis[0].count === 0) {
            console.log('Inserting basic Ubigeo...');
            await connection.query(`
                INSERT INTO Ubigeo (codigo, departamento, provincia, distrito) VALUES 
                ('150101', 'Lima', 'Lima', 'Lima'),
                ('040101', 'Arequipa', 'Arequipa', 'Arequipa')
            `);
        }

        // 4. Optional: Insert demo persona + medico + paciente for quick demo
        const [personDemo] = await connection.query("SELECT COUNT(*) as count FROM Persona WHERE numero_documento = '70251984'");
        if (personDemo[0].count === 0) {
            console.log('Inserting demo Persona/Medico/Paciente...');
            const [resPersona] = await connection.execute(
                `INSERT INTO Persona (tipo_documento_id, numero_documento, nombres, apellidos, fecha_nacimiento, sexo, ubigeo_id, telefono) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [1, '70251984', 'Carlos', 'Mamani', '1985-01-01', 'M', '150101', '951234567']
            );
            const personaId = resPersona.insertId;

            // Insert Paciente
            await connection.execute(`INSERT INTO Paciente (persona_id, tipo_sangre) VALUES (?, ?)`, [personaId, 'O+']);

            // Create Medico Persona
            const [resPersona2] = await connection.execute(
                `INSERT INTO Persona (tipo_documento_id, numero_documento, nombres, apellidos, fecha_nacimiento, sexo, ubigeo_id, telefono) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [1, '55667788', 'Gregory', 'House', '1970-06-11', 'M', '150101', '999888777']
            );
            const personaMedId = resPersona2.insertId;
            const [resMed] = await connection.execute(`INSERT INTO Medico (persona_id, numero_colegiatura, universidad_origen) VALUES (?, ?, ?)`, [personaMedId, 'CMP-12345', 'UNA Puno']);
            const medicoId = resMed.insertId;

            // Link a especialidad (assume first especialidad id = 1 exists)
            await connection.execute('INSERT INTO Medico_Especialidad (medico_id, especialidad_id) VALUES (?, ?)', [medicoId, 1]);
        }

        console.log('✅ Seed finished');
        return { seeded: true };
    } catch (error) {
        console.error('❌ Seed error', error);
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = { seed };
