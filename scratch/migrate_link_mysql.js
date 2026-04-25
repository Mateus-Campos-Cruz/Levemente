const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'LEVEMENTE'
};

async function migrate() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conectado para migração');

        // Adicionar coluna 'link' se não existir
        const [rows] = await connection.execute("SHOW COLUMNS FROM agenda LIKE 'link'");
        if (rows.length === 0) {
            await connection.execute("ALTER TABLE agenda ADD COLUMN link TEXT AFTER status");
            console.log("🚀 Coluna 'link' adicionada com sucesso!");
        } else {
            console.log("ℹ️ Coluna 'link' já existe.");
        }

        await connection.end();
    } catch (err) {
        console.error('❌ Erro na migração:', err.message);
    }
}

migrate();
