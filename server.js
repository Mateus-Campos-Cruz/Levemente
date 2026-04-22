/**
 * LEVEMENTE - Server
 * API REST com Express + MySQL2
 */

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// ─── Middlewares ──────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve arquivos estáticos da raiz do projeto (css, js, pages)
app.use(express.static(path.join(__dirname)));

// ─── Conexão com o Banco ──────────────────────────────────
const dbConfig = {
    host: 'localhost',
    user: 'root',       // ← altere se necessário
    password: '123456',       // ← coloque sua senha do MySQL Workbench
    database: 'LEVEMENTE',
    waitForConnections: true,
    connectionLimit: 10,
};

let pool;

async function conectarBanco() {
    try {
        pool = mysql.createPool(dbConfig);
        // Testa a conexão
        const conn = await pool.getConnection();
        console.log('✅ Conectado ao banco LEVEMENTE');
        conn.release();
    } catch (err) {
        console.error('❌ Erro ao conectar ao banco:', err.message);
        process.exit(1);
    }
}

// ─── Rotas de Páginas ─────────────────────────────────────

// Redireciona raiz para o login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

// ─── API: PACIENTES ───────────────────────────────────────

/**
 * GET /api/pacientes
 * Retorna todos os pacientes ordenados por nome
 */
app.get('/api/pacientes', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                id_paciente,
                nome_completo,
                cpf,
                DATE_FORMAT(data_nascimento, '%d/%m/%Y') AS data_nascimento,
                telefone,
                contato_emergencia,
                status,
                DATE_FORMAT(data_cadastro, '%d/%m/%Y') AS data_cadastro
             FROM pacientes
             ORDER BY nome_completo ASC`
        );
        res.json(rows);
    } catch (err) {
        console.error('Erro GET /api/pacientes:', err.message);
        res.status(500).json({ erro: 'Erro ao buscar pacientes.' });
    }
});

/**
 * POST /api/pacientes
 * Cadastra um novo paciente
 * Body: { nome_completo, cpf, telefone, status, data_nascimento?, contato_emergencia? }
 */
app.post('/api/pacientes', async (req, res) => {
    const { nome_completo, cpf, telefone, status, data_nascimento, contato_emergencia } = req.body;

    if (!nome_completo || !cpf) {
        return res.status(400).json({ erro: 'nome_completo e cpf são obrigatórios.' });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO pacientes (nome_completo, cpf, telefone, status, data_nascimento, contato_emergencia)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                nome_completo,
                cpf,
                telefone || null,
                status || 'Ativo',
                data_nascimento || null,
                contato_emergencia || null,
            ]
        );

        // Retorna o paciente recém-criado
        const [rows] = await pool.query(
            `SELECT id_paciente, nome_completo, cpf,
                    DATE_FORMAT(data_nascimento, '%d/%m/%Y') AS data_nascimento,
                    telefone, status,
                    DATE_FORMAT(data_cadastro, '%d/%m/%Y') AS data_cadastro
             FROM pacientes WHERE id_paciente = ?`,
            [result.insertId]
        );

        res.status(201).json(rows[0]);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ erro: 'CPF já cadastrado.' });
        }
        console.error('Erro POST /api/pacientes:', err.message);
        res.status(500).json({ erro: 'Erro ao cadastrar paciente.' });
    }
});

/**
 * GET /api/pacientes/:id
 * Retorna um paciente pelo ID
 */
app.get('/api/pacientes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query(
            `SELECT id_paciente, nome_completo, cpf, profissao,
                    DATE_FORMAT(data_nascimento, '%Y-%m-%d') AS data_nascimento,
                    estado_civil, escolaridade, endereco, telefone, contato_emergencia,
                    queixa_principal, historico_familiar, medicacoes_em_uso, anamnese_texto, status
             FROM pacientes WHERE id_paciente = ?`,
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ erro: 'Paciente não encontrado.' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Erro GET /api/pacientes/:id:', err.message);
        res.status(500).json({ erro: 'Erro ao buscar paciente.' });
    }
});

/**
 * PUT /api/pacientes/:id
 * Atualiza os dados de um paciente existente
 */
app.put('/api/pacientes/:id', async (req, res) => {
    const { id } = req.params;
    const { 
        nome_completo, cpf, telefone, status, data_nascimento, contato_emergencia,
        profissao, estado_civil, escolaridade, endereco, 
        queixa_principal, historico_familiar, medicacoes_em_uso, anamnese_texto 
    } = req.body;

    if (!nome_completo || !cpf) {
        return res.status(400).json({ erro: 'nome_completo e cpf são obrigatórios.' });
    }

    try {
        const [result] = await pool.query(
            `UPDATE pacientes 
             SET nome_completo = ?, cpf = ?, telefone = ?, status = ?, 
                 data_nascimento = ?, contato_emergencia = ?,
                 profissao = ?, estado_civil = ?, escolaridade = ?, endereco = ?,
                 queixa_principal = ?, historico_familiar = ?, medicacoes_em_uso = ?, anamnese_texto = ?
             WHERE id_paciente = ?`,
            [
                nome_completo, cpf, telefone || null, status || 'Ativo', data_nascimento || null, contato_emergencia || null,
                profissao || null, estado_civil || null, escolaridade || null, endereco || null,
                queixa_principal || null, historico_familiar || null, medicacoes_em_uso || null, anamnese_texto || null,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: 'Paciente não encontrado.' });
        }

        // Retorna o paciente atualizado
        const [rows] = await pool.query(
            `SELECT id_paciente, nome_completo, cpf,
                    DATE_FORMAT(data_nascimento, '%d/%m/%Y') AS data_nascimento,
                    telefone, status,
                    DATE_FORMAT(data_cadastro, '%d/%m/%Y') AS data_cadastro
             FROM pacientes WHERE id_paciente = ?`,
            [id]
        );

        res.json(rows[0]);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ erro: 'CPF já cadastrado por outro paciente.' });
        }
        console.error('Erro PUT /api/pacientes/:id:', err.message);
        res.status(500).json({ erro: 'Erro ao atualizar paciente.' });
    }
});

/**
 * DELETE /api/pacientes/:id
 * Remove um paciente pelo ID
 */
app.delete('/api/pacientes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query(
            'DELETE FROM pacientes WHERE id_paciente = ?', [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: 'Paciente não encontrado.' });
        }
        res.json({ mensagem: 'Paciente removido com sucesso.' });
    } catch (err) {
        console.error('Erro DELETE /api/pacientes:', err.message);
        res.status(500).json({ erro: 'Erro ao remover paciente.' });
    }
});

// ─── Inicia o Servidor ────────────────────────────────────
conectarBanco().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 LEVEMENTE rodando em http://localhost:${PORT}`);
        console.log(`   Acesse: http://localhost:${PORT}/pages/pacientes.html`);
    });
});
