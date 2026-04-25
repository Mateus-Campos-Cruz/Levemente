const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'database', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Adicionar coluna 'link' na tabela agenda se não existir
    db.run("ALTER TABLE agenda ADD COLUMN link TEXT;", (err) => {
        if (err) {
            if (err.message.includes("duplicate column name")) {
                console.log("Coluna 'link' já existe.");
            } else {
                console.error("Erro ao adicionar coluna 'link':", err.message);
            }
        } else {
            console.log("Coluna 'link' adicionada com sucesso!");
        }
    });
});

db.close();
