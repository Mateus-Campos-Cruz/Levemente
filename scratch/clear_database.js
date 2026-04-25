const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'LEVEMENTE'
};

async function clearData() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conectado para limpeza de dados');

        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
        
        const tables = ['agenda', 'financeiro', 'evolucoes', 'pacientes', 'usuario_mestre'];
        
        for (const table of tables) {
            await connection.execute(`TRUNCATE TABLE ${table}`);
            console.log(`🧹 Tabela ${table} limpa.`);
        }

        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
        
        console.log('🚀 Todas as tabelas foram resetadas com sucesso!');

        await connection.end();
    } catch (err) {
        console.error('❌ Erro ao limpar dados:', err.message);
    }
}

clearData();
