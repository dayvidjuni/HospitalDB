#!/usr/bin/env node
// Simple DB connectivity test used by `npm run test-db`
require('dotenv').config();
const db = require('../config/db');

(async () => {
    try {
        // A quick sanity check query
        const [rows] = await db.execute('SELECT 1+1 AS result');
        console.log('✅ Database reachable. Test query result:', rows[0].result);
        process.exit(0);
    } catch (err) {
        console.error('❌ Database test failed:', err.message || err);
        process.exit(1);
    }
})();
