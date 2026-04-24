/**
 * LEVEMENTE - Server
 * API REST com Express + MySQL2
 */

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;

// Helper para obter o ID do usuário das requisições
const getUserId = (req) => {
    return req.headers['x-user-id'] || null;
};

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

// ─── API: AUTENTICAÇÃO ────────────────────────────────────

/**
 * POST /api/auth/register
 * Cadastro de novo usuário mestre
 */
app.post('/api/auth/register', async (req, res) => {
    const { nome, email, senha, registro_profissional } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        const [result] = await pool.query(
            `INSERT INTO usuario_mestre (nome, email, senha_hash, registro_profissional)
             VALUES (?, ?, ?, ?)`,
            [nome, email, senhaHash, registro_profissional || null]
        );

        res.status(201).json({ id: result.insertId, nome, mensagem: 'Usuário cadastrado com sucesso.' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ erro: 'E-mail já cadastrado.' });
        }
        console.error('Erro no registro:', err);
        res.status(500).json({ erro: 'Erro ao cadastrar usuário.' });
    }
});

/**
 * POST /api/auth/login
 * Login simplificado
 */
app.post('/api/auth/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM usuario_mestre WHERE email = ?', [email]);
        
        if (rows.length === 0) {
            return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
        }

        const usuario = rows[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

        if (!senhaValida) {
            return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
        }

        res.json({ id: usuario.id_usuario_mestre, nome: usuario.nome });
    } catch (err) {
        console.error('Erro no login:', err);
        res.status(500).json({ erro: 'Erro ao realizar login.' });
    }
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
                email,
                cpf,
                DATE_FORMAT(data_nascimento, '%d/%m/%Y') AS data_nascimento,
                telefone,
                contato_emergencia,
                status
             FROM pacientes
             WHERE id_usuario_mestre = ?
             ORDER BY nome_completo ASC`,
            [getUserId(req)]
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
    const { nome_completo, email, cpf, telefone, status, data_nascimento, contato_emergencia } = req.body;

    if (!nome_completo || !cpf) {
        return res.status(400).json({ erro: 'nome_completo e cpf são obrigatórios.' });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO pacientes (id_usuario_mestre, nome_completo, email, cpf, telefone, status, data_nascimento, contato_emergencia)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                getUserId(req),
                nome_completo,
                email || null,
                cpf,
                telefone || null,
                status || 'Ativo',
                data_nascimento || null,
                contato_emergencia || null,
            ]
        );

        // Retorna o paciente recém-criado
        const [rows] = await pool.query(
            `SELECT id_paciente, nome_completo, email, cpf,
                    DATE_FORMAT(data_nascimento, '%d/%m/%Y') AS data_nascimento,
                    telefone, status,
                    DATE_FORMAT(data_cadastro, '%d/%m/%Y') AS data_cadastro
             FROM pacientes WHERE id_paciente = ? AND id_usuario_mestre = ?`,
            [result.insertId, getUserId(req)]
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
            `SELECT id_paciente, nome_completo, email, cpf, profissao,
                    DATE_FORMAT(data_nascimento, '%Y-%m-%d') AS data_nascimento,
                    estado_civil, escolaridade, endereco, telefone, contato_emergencia,
                    queixa_principal, historico_familiar, medicacoes_em_uso, anamnese_texto, status
             FROM pacientes WHERE id_paciente = ? AND id_usuario_mestre = ?`,
            [id, getUserId(req)]
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
        nome_completo, email, cpf, telefone, status, data_nascimento, contato_emergencia,
        profissao, estado_civil, escolaridade, endereco, 
        queixa_principal, historico_familiar, medicacoes_em_uso, anamnese_texto 
    } = req.body;

    if (!nome_completo || !cpf) {
        return res.status(400).json({ erro: 'nome_completo e cpf são obrigatórios.' });
    }

    try {
        const [result] = await pool.query(
            `UPDATE pacientes 
             SET nome_completo = ?, email = ?, cpf = ?, telefone = ?, status = ?, 
                 profissao = ?, estado_civil = ?, escolaridade = ?, endereco = ?,
                 queixa_principal = ?, historico_familiar = ?, medicacoes_em_uso = ?, anamnese_texto = ?
             WHERE id_paciente = ? AND id_usuario_mestre = ?`,
            [
                nome_completo, email || null, cpf, telefone || null, status || 'Ativo', data_nascimento || null, contato_emergencia || null,
                profissao || null, estado_civil || null, escolaridade || null, endereco || null,
                queixa_principal || null, historico_familiar || null, medicacoes_em_uso || null, anamnese_texto || null,
                id, getUserId(req)
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: 'Paciente não encontrado.' });
        }

        // Retorna o paciente atualizado
        const [rows] = await pool.query(
            `SELECT id_paciente, nome_completo, email, cpf,
                    DATE_FORMAT(data_nascimento, '%d/%m/%Y') AS data_nascimento,
                    telefone, status,
                    DATE_FORMAT(data_cadastro, '%d/%m/%Y') AS data_cadastro
             FROM pacientes WHERE id_paciente = ? AND id_usuario_mestre = ?`,
            [id, getUserId(req)]
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
            'DELETE FROM pacientes WHERE id_paciente = ? AND id_usuario_mestre = ?', [id, getUserId(req)]
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
             WHERE id_paciente = ? AND id_usuario_mestre = ?
             ORDER BY data_sessao DESC, id_evolucao DESC`,
            [id_paciente, getUserId(req)]
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
             WHERE id_evolucao = ? AND id_usuario_mestre = ?`,
            [id, getUserId(req)]
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
            `INSERT INTO evolucoes (id_usuario_mestre, id_paciente, data_sessao, texto_evolucao, tipo_sessao, tags)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [getUserId(req), id_paciente, data_sessao, texto_evolucao, tipo_sessao || 'Presencial', tags || null]
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
             WHERE id_evolucao = ? AND id_usuario_mestre = ?`,
            [data_sessao, texto_evolucao, tipo_sessao || 'Presencial', tags || null, id, getUserId(req)]
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
            'DELETE FROM evolucoes WHERE id_evolucao = ? AND id_usuario_mestre = ?', [id, getUserId(req)]
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
        WHERE f.id_usuario_mestre = ?
    `;
    const queryParams = [getUserId(req)];

    if (mes && ano) {
        query += ` AND MONTH(f.data_vencimento) = ? AND YEAR(f.data_vencimento) = ?`;
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
             WHERE f.id_lancamento = ? AND f.id_usuario_mestre = ?`,
            [id, getUserId(req)]
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
            `INSERT INTO financeiro (id_usuario_mestre, id_paciente, descricao, valor, tipo, status_pagamento, data_vencimento)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                getUserId(req),
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
             WHERE id_lancamento = ? AND id_usuario_mestre = ?`,
            [
                id_paciente || null, 
                descricao, 
                valor, 
                tipo, 
                status_pagamento || 'Pendente', 
                data_vencimento, 
                id,
                getUserId(req)
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
            'DELETE FROM financeiro WHERE id_lancamento = ? AND id_usuario_mestre = ?', [id, getUserId(req)]
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

// ─── API: DASHBOARD ───────────────────────────────────────

/**
 * GET /api/dashboard/stats
 * Retorna as métricas do dashboard filtradas pelo usuário logado
 */
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        // 1. Pacientes Ativos
        const [[{ totalAtivos }]] = await pool.query(
            'SELECT COUNT(*) AS totalAtivos FROM pacientes WHERE status = "Ativo" AND id_usuario_mestre = ?',
            [getUserId(req)]
        );

        // 2. Sessões Hoje
        const [[{ totalHoje }]] = await pool.query(
            'SELECT COUNT(*) AS totalHoje FROM agenda WHERE data_sessao = CURDATE() AND id_usuario_mestre = ?',
            [getUserId(req)]
        );

        // 3. Sessões Pendentes Hoje (Agendadas e não realizadas)
        const [[{ totalPendentes }]] = await pool.query(
            'SELECT COUNT(*) AS totalPendentes FROM agenda WHERE data_sessao = CURDATE() AND status = "Agendada" AND id_usuario_mestre = ?',
            [getUserId(req)]
        );

        // 4. Faturamento Mês (Receitas pagas no mês atual)
        const [[{ faturamentoMes }]] = await pool.query(
            `SELECT SUM(valor) AS faturamentoMes 
             FROM financeiro 
             WHERE tipo = "Receita" AND status_pagamento = "Pago" 
               AND MONTH(data_vencimento) = MONTH(CURDATE()) 
               AND YEAR(data_vencimento) = YEAR(CURDATE())
               AND id_usuario_mestre = ?`,
            [getUserId(req)]
        );

        res.json({
            pacientesAtivos: totalAtivos,
            sessoesHoje: totalHoje,
            sessoesPendentesHoje: totalPendentes,
            faturamentoMes: faturamentoMes || 0
        });

    } catch (err) {
        console.error('Erro GET /api/dashboard/stats:', err.message);
        res.status(500).json({ erro: 'Erro ao carregar estatísticas do dashboard.' });
    }
});

// ─── API: AGENDA ──────────────────────────────────────────

/**
 * GET /api/agenda
 * Lista agendamentos do usuário
 */
app.get('/api/agenda', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT a.id_agenda, a.id_paciente, p.nome_completo AS nome_paciente,
                    DATE_FORMAT(a.data_sessao, '%Y-%m-%d') AS data_sessao,
                    a.hora_sessao, a.status
             FROM agenda a
             JOIN pacientes p ON a.id_paciente = p.id_paciente
             WHERE a.id_usuario_mestre = ?
             ORDER BY a.data_sessao ASC, a.hora_sessao ASC`,
            [getUserId(req)]
        );
        res.json(rows);
    } catch (err) {
        console.error('Erro GET /api/agenda:', err.message);
        res.status(500).json({ erro: 'Erro ao buscar agenda.' });
    }
});

/**
 * POST /api/agenda
 * Cria um novo agendamento
 */
app.post('/api/agenda', async (req, res) => {
    const { id_paciente, data_sessao, hora_sessao, status } = req.body;
    if (!id_paciente || !data_sessao || !hora_sessao) {
        return res.status(400).json({ erro: 'Paciente, data e hora são obrigatórios.' });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO agenda (id_usuario_mestre, id_paciente, data_sessao, hora_sessao, status)
             VALUES (?, ?, ?, ?, ?)`,
            [getUserId(req), id_paciente, data_sessao, hora_sessao, status || 'Agendada']
        );
        res.status(201).json({ id_agenda: result.insertId, mensagem: 'Sessão agendada com sucesso.' });
    } catch (err) {
        console.error('Erro POST /api/agenda:', err.message);
        res.status(500).json({ erro: 'Erro ao agendar sessão.' });
    }
});

/**
 * PUT /api/agenda/:id
 * Atualiza um agendamento existente
 */
app.get('/api/agenda/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query(
            'SELECT * FROM agenda WHERE id_agenda = ? AND id_usuario_mestre = ?',
            [id, getUserId(req)]
        );
        if (rows.length === 0) return res.status(404).json({ erro: 'Agendamento não encontrado.' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar agendamento.' });
    }
});

app.put('/api/agenda/:id', async (req, res) => {
    const { id } = req.params;
    const { id_paciente, data_sessao, hora_sessao, status } = req.body;
    try {
        const [result] = await pool.query(
            `UPDATE agenda 
             SET id_paciente = ?, data_sessao = ?, hora_sessao = ?, status = ?
             WHERE id_agenda = ? AND id_usuario_mestre = ?`,
            [id_paciente, data_sessao, hora_sessao, status, id, getUserId(req)]
        );
        if (result.affectedRows === 0) return res.status(404).json({ erro: 'Agendamento não encontrado.' });
        res.json({ mensagem: 'Agendamento atualizado com sucesso.' });
    } catch (err) {
        console.error('Erro PUT /api/agenda:', err.message);
        res.status(500).json({ erro: 'Erro ao atualizar agendamento.' });
    }
});

/**
 * DELETE /api/agenda/:id
 */
app.delete('/api/agenda/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query(
            'DELETE FROM agenda WHERE id_agenda = ? AND id_usuario_mestre = ?',
            [id, getUserId(req)]
        );
        if (result.affectedRows === 0) return res.status(404).json({ erro: 'Agendamento não encontrado.' });
        res.json({ mensagem: 'Agendamento removido com sucesso.' });
    } catch (err) {
        console.error('Erro DELETE /api/agenda:', err.message);
        res.status(500).json({ erro: 'Erro ao remover agendamento.' });
    }
});

// ─── Inicia o Servidor ────────────────────────────────────
conectarBanco().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 LEVEMENTE rodando em http://localhost:${PORT}`);
        console.log(`   Acesse: http://localhost:${PORT}/pages/pacientes.html`);
    });
});
