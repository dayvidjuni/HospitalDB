const { seed } = require('./seedLib');

async function run() {
    try {
        await seed();
        console.log('✅ Seeding Completed (cli)!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding Failed (cli):', error);
        process.exit(1);
    }
}

if (require.main === module) {
    run();
}

module.exports = { run };

