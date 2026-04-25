const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'LEVEMENTE'
};

async function getUser() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute("SELECT id_usuario_mestre, nome, email FROM usuario_mestre LIMIT 1");
        console.log(JSON.stringify(rows[0]));
        await connection.end();
    } catch (err) {
        console.error(err.message);
    }
}

getUser();
