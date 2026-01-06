const db = require('../config/db');

async function seed() {
    console.log('🌱 Starting Database Seeding...');
    try {
        const connection = await db.getConnection();

        // 1. Tipo Documento
        const [docs] = await connection.query('SELECT COUNT(*) as count FROM Tipo_Documento');
        if (docs[0].count === 0) {
            console.log('Inserting Tipo_Documento...');
            await connection.query(`
                INSERT INTO Tipo_Documento (nombre_tipo) VALUES 
                ('DNI'), ('Pasaporte'), ('Carnet Extranjería')
            `);
        } else {
            console.log('Tipo_Documento already has data.');
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
        } else {
            console.log('Especialidad already has data.');
        }

        // 3. Ubigeo (Optional basics)
        const [ubis] = await connection.query('SELECT COUNT(*) as count FROM Ubigeo');
        if (ubis[0].count === 0) {
            console.log('Inserting basic Ubigeo...');
            await connection.query(`
                INSERT INTO Ubigeo (codigo, departamento, provincia, distrito) VALUES 
                ('150101', 'Lima', 'Lima', 'Lima'),
                ('040101', 'Arequipa', 'Arequipa', 'Arequipa')
            `);
        } else {
            console.log('Ubigeo already has data.');
        }

        connection.release();
        console.log('✅ Seeding Completed!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding Failed:', error);
        process.exit(1);
    }
}

seed();
