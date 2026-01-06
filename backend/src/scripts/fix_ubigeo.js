const db = require('../config/db');

async function fixUbigeo() {
    try {
        const connection = await db.getConnection();
        console.log('🔧 Fixing Ubigeo table...');

        // Check if exists
        const [rows] = await connection.query("SELECT * FROM Ubigeo WHERE ubigeo_id = '150101'");

        if (rows.length === 0) {
            console.log('Inserting Ubigeo 150101...');
            // Try to insert with explicit ID. 
            // Note: If ubigeo_id is AUTO_INCREMENT, this might need care, but usually MySQL allows explicit insert.
            // Adjust column names based on previous seed attempt: codigo, departamento...
            // Assuming ubigeo_id IS the PK and we want it to be 150101. 
            // If the schema uses 'id' instead, we would have seen different error.

            // We'll try to insert mapping 150101 to both ID and Code if possible, or just ID.
            await connection.query(`
                INSERT INTO Ubigeo (ubigeo_id, codigo, departamento, provincia, distrito) 
                VALUES ('150101', '150101', 'Lima', 'Lima', 'Lima')
            `);
            console.log('✅ Ubigeo 150101 inserted.');
        } else {
            console.log('✅ Ubigeo 150101 already exists.');
        }

        connection.release();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing Ubigeo:', error);
        // Fallback: If column names are different or strict mode prevents ID insert
        process.exit(1);
    }
}

fixUbigeo();
