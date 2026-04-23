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

// ─── API: EVOLUÇÕES ───────────────────────────────────────

/**
 * GET /api/evolucoes/paciente/:id_paciente
 * Lista evoluções de um paciente específico
 */
app.get('/api/evolucoes/paciente/:id_paciente', async (req, res) => {
    const { id_paciente } = req.params;
    try {
        const [rows] = await pool.query(
            `SELECT id_evolucao, id_paciente, 
                    DATE_FORMAT(data_sessao, '%Y-%m-%d') AS data_sessao, 
                    texto_evolucao, tipo_sessao, tags
             FROM evolucoes 
             WHERE id_paciente = ? 
             ORDER BY data_sessao DESC, id_evolucao DESC`,
            [id_paciente]
        );
        res.json(rows);
    } catch (err) {
        console.error('Erro GET /api/evolucoes/paciente/:id_paciente:', err.message);
        res.status(500).json({ erro: 'Erro ao buscar evoluções do paciente.' });
    }
});

/**
 * GET /api/evolucoes/:id
 * Retorna uma evolução específica
 */
app.get('/api/evolucoes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query(
            `SELECT id_evolucao, id_paciente, 
                    DATE_FORMAT(data_sessao, '%Y-%m-%d') AS data_sessao, 
                    texto_evolucao, tipo_sessao, tags
             FROM evolucoes 
             WHERE id_evolucao = ?`,
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ erro: 'Evolução não encontrada.' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Erro GET /api/evolucoes/:id:', err.message);
        res.status(500).json({ erro: 'Erro ao buscar evolução.' });
    }
});

/**
 * POST /api/evolucoes
 * Cria uma nova evolução
 */
app.post('/api/evolucoes', async (req, res) => {
    const { id_paciente, data_sessao, texto_evolucao, tipo_sessao, tags } = req.body;

    if (!id_paciente || !data_sessao || !texto_evolucao) {
        return res.status(400).json({ erro: 'id_paciente, data_sessao e texto_evolucao são obrigatórios.' });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO evolucoes (id_paciente, data_sessao, texto_evolucao, tipo_sessao, tags)
             VALUES (?, ?, ?, ?, ?)`,
            [id_paciente, data_sessao, texto_evolucao, tipo_sessao || 'Presencial', tags || null]
        );

        res.status(201).json({ id_evolucao: result.insertId, mensagem: 'Evolução criada com sucesso.' });
    } catch (err) {
        console.error('Erro POST /api/evolucoes:', err.message);
        res.status(500).json({ erro: 'Erro ao cadastrar evolução.' });
    }
});

/**
 * PUT /api/evolucoes/:id
 * Atualiza uma evolução existente
 */
app.put('/api/evolucoes/:id', async (req, res) => {
    const { id } = req.params;
    const { data_sessao, texto_evolucao, tipo_sessao, tags } = req.body;

    if (!data_sessao || !texto_evolucao) {
        return res.status(400).json({ erro: 'data_sessao e texto_evolucao são obrigatórios.' });
    }

    try {
        const [result] = await pool.query(
            `UPDATE evolucoes 
             SET data_sessao = ?, texto_evolucao = ?, tipo_sessao = ?, tags = ?
             WHERE id_evolucao = ?`,
            [data_sessao, texto_evolucao, tipo_sessao || 'Presencial', tags || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: 'Evolução não encontrada.' });
        }
        res.json({ mensagem: 'Evolução atualizada com sucesso.' });
    } catch (err) {
        console.error('Erro PUT /api/evolucoes/:id:', err.message);
        res.status(500).json({ erro: 'Erro ao atualizar evolução.' });
    }
});

/**
 * DELETE /api/evolucoes/:id
 * Remove uma evolução
 */
app.delete('/api/evolucoes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query(
            'DELETE FROM evolucoes WHERE id_evolucao = ?', [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: 'Evolução não encontrada.' });
        }
        res.json({ mensagem: 'Evolução removida com sucesso.' });
    } catch (err) {
        console.error('Erro DELETE /api/evolucoes/:id:', err.message);
        res.status(500).json({ erro: 'Erro ao remover evolução.' });
    }
});

// ─── API: FINANCEIRO ───────────────────────────────────────

/**
 * GET /api/financeiro
 * Retorna lançamentos financeiros, opcionalmente filtrados por mês e ano
 * Query params: ?mes=MM&ano=YYYY
 */
app.get('/api/financeiro', async (req, res) => {
    const { mes, ano } = req.query;
    let query = `
        SELECT f.id_lancamento, f.id_paciente, f.descricao, f.valor, f.tipo, f.status_pagamento,
               DATE_FORMAT(f.data_vencimento, '%Y-%m-%d') AS data_vencimento,
               p.nome_completo AS nome_paciente
        FROM financeiro f
        LEFT JOIN pacientes p ON f.id_paciente = p.id_paciente
    `;
    const queryParams = [];

    if (mes && ano) {
        query += ` WHERE MONTH(f.data_vencimento) = ? AND YEAR(f.data_vencimento) = ?`;
        queryParams.push(mes, ano);
    }
    
    query += ` ORDER BY f.data_vencimento ASC, f.id_lancamento DESC`;

    try {
        const [rows] = await pool.query(query, queryParams);
        res.json(rows);
    } catch (err) {
        console.error('Erro GET /api/financeiro:', err.message);
        res.status(500).json({ erro: 'Erro ao buscar dados financeiros.' });
    }
});

/**
 * GET /api/financeiro/:id
 * Retorna um lançamento específico
 */
app.get('/api/financeiro/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query(
            `SELECT f.id_lancamento, f.id_paciente, f.descricao, f.valor, f.tipo, f.status_pagamento,
                    DATE_FORMAT(f.data_vencimento, '%Y-%m-%d') AS data_vencimento
             FROM financeiro f
             WHERE f.id_lancamento = ?`,
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ erro: 'Lançamento não encontrado.' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Erro GET /api/financeiro/:id:', err.message);
        res.status(500).json({ erro: 'Erro ao buscar lançamento.' });
    }
});

/**
 * POST /api/financeiro
 * Cria um novo lançamento financeiro
 */
app.post('/api/financeiro', async (req, res) => {
    const { id_paciente, descricao, valor, tipo, status_pagamento, data_vencimento } = req.body;

    if (!descricao || !valor || !tipo || !data_vencimento) {
        return res.status(400).json({ erro: 'Descrição, valor, tipo e data de vencimento são obrigatórios.' });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO financeiro (id_paciente, descricao, valor, tipo, status_pagamento, data_vencimento)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                id_paciente || null, 
                descricao, 
                valor, 
                tipo, 
                status_pagamento || 'Pendente', 
                data_vencimento
            ]
        );

        res.status(201).json({ id_lancamento: result.insertId, mensagem: 'Lançamento criado com sucesso.' });
    } catch (err) {
        console.error('Erro POST /api/financeiro:', err.message);
        res.status(500).json({ erro: 'Erro ao cadastrar lançamento financeiro.' });
    }
});

/**
 * PUT /api/financeiro/:id
 * Atualiza um lançamento financeiro existente
 */
app.put('/api/financeiro/:id', async (req, res) => {
    const { id } = req.params;
    const { id_paciente, descricao, valor, tipo, status_pagamento, data_vencimento } = req.body;

    if (!descricao || !valor || !tipo || !data_vencimento) {
        return res.status(400).json({ erro: 'Descrição, valor, tipo e data de vencimento são obrigatórios.' });
    }

    try {
        const [result] = await pool.query(
            `UPDATE financeiro 
             SET id_paciente = ?, descricao = ?, valor = ?, tipo = ?, status_pagamento = ?, data_vencimento = ?
             WHERE id_lancamento = ?`,
            [
                id_paciente || null, 
                descricao, 
                valor, 
                tipo, 
                status_pagamento || 'Pendente', 
                data_vencimento, 
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: 'Lançamento não encontrado.' });
        }
        res.json({ mensagem: 'Lançamento atualizado com sucesso.' });
    } catch (err) {
        console.error('Erro PUT /api/financeiro/:id:', err.message);
        res.status(500).json({ erro: 'Erro ao atualizar lançamento.' });
    }
});

/**
 * DELETE /api/financeiro/:id
 * Remove um lançamento financeiro
 */
app.delete('/api/financeiro/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query(
            'DELETE FROM financeiro WHERE id_lancamento = ?', [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: 'Lançamento não encontrado.' });
        }
        res.json({ mensagem: 'Lançamento removido com sucesso.' });
    } catch (err) {
        console.error('Erro DELETE /api/financeiro/:id:', err.message);
        res.status(500).json({ erro: 'Erro ao remover lançamento.' });
    }
});

// ─── Inicia o Servidor ────────────────────────────────────
conectarBanco().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 LEVEMENTE rodando em http://localhost:${PORT}`);
        console.log(`   Acesse: http://localhost:${PORT}/pages/pacientes.html`);
    });
});
