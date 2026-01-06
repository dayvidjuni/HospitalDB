const db = require('../config/db');

async function checkUbigeo() {
    try {
        const [rows] = await db.query('SELECT * FROM Ubigeo LIMIT 10');
        console.log('Current Ubigeo Data:', rows);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkUbigeo();
