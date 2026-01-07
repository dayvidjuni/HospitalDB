
const db = require('../config/db');

async function checkAdmin() {
    try {
        const [rows] = await db.execute(`
            SELECT p.nombres, p.apellidos, p.numero_documento 
            FROM Empleado e
            JOIN Persona p ON e.persona_id = p.persona_id
            WHERE e.cargo = 'Administración'
        `);

        if (rows.length > 0) {
            console.log('✅ Admin found:', rows[0]);
        } else {
            console.log('❌ No admin found');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAdmin();
