CREATE DATABASE LEVEMENTE;
USE LEVEMENTE;

-- 2. TABELA DE USUÁRIO MESTRE (O PROFISSIONAL)
CREATE TABLE usuario_mestre (
    id_usuario_mestre INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    registro_profissional VARCHAR(50), 
    plano ENUM('Bronze', 'Prata', 'Ouro') DEFAULT 'Bronze',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. TABELA DE PACIENTES (ATUALIZADA COM EMAIL)
CREATE TABLE pacientes (
    id_paciente INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario_mestre INT NOT NULL,
    nome_completo VARCHAR(100) NOT NULL,
    email VARCHAR(100), -- Coluna adicionada
    profissao VARCHAR(100),
    cpf VARCHAR(14) NOT NULL, 
    data_nascimento DATE,
    estado_civil VARCHAR(50),
    escolaridade VARCHAR(100),
    endereco VARCHAR(255),
    telefone VARCHAR(20),
    contato_emergencia VARCHAR(100),
    queixa_principal TEXT,
    historico_familiar TEXT,
    medicacoes_em_uso TEXT,
    anamnese_texto TEXT,
    status ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mestre_pacientes FOREIGN KEY (id_usuario_mestre) 
        REFERENCES usuario_mestre(id_usuario_mestre) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. TABELA DE EVOLUÇÕES
CREATE TABLE evolucoes (
    id_evolucao INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario_mestre INT NOT NULL,
    id_paciente INT NOT NULL,
    data_sessao DATE NOT NULL,
    texto_evolucao TEXT NOT NULL,
    tipo_sessao ENUM('Presencial', 'Online') DEFAULT 'Presencial',
    tags VARCHAR(50),
    CONSTRAINT fk_mestre_evolucoes FOREIGN KEY (id_usuario_mestre) 
        REFERENCES usuario_mestre(id_usuario_mestre) ON DELETE CASCADE,
    CONSTRAINT fk_paciente_evolucoes FOREIGN KEY (id_paciente) 
        REFERENCES pacientes(id_paciente) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. TABELA FINANCEIRO
CREATE TABLE financeiro (
    id_lancamento INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario_mestre INT NOT NULL,
    id_paciente INT,
    descricao VARCHAR(100) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    tipo ENUM('Receita', 'Despesa') NOT NULL,
    status_pagamento ENUM('Pago', 'Pendente') DEFAULT 'Pendente',
    data_vencimento DATE NOT NULL,
    CONSTRAINT fk_mestre_financeiro FOREIGN KEY (id_usuario_mestre) 
        REFERENCES usuario_mestre(id_usuario_mestre) ON DELETE CASCADE,
    CONSTRAINT fk_paciente_financeiro FOREIGN KEY (id_paciente) 
        REFERENCES pacientes(id_paciente) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 6. TABELA AGENDA (NOVA)
CREATE TABLE agenda (
    id_agenda INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario_mestre INT NOT NULL,
    id_paciente INT NOT NULL,
    data_sessao DATE NOT NULL,
    hora_sessao TIME NOT NULL,
    status ENUM('Agendada', 'Realizada', 'Cancelada', 'Falta') DEFAULT 'Agendada',
    CONSTRAINT fk_mestre_agenda FOREIGN KEY (id_usuario_mestre) 
        REFERENCES usuario_mestre(id_usuario_mestre) ON DELETE CASCADE,
    CONSTRAINT fk_paciente_agenda FOREIGN KEY (id_paciente) 
        REFERENCES pacientes(id_paciente) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_mestre_pacientes ON pacientes(id_usuario_mestre);
CREATE INDEX idx_mestre_evolucoes ON evolucoes(id_usuario_mestre);
CREATE INDEX idx_mestre_financeiro ON financeiro(id_usuario_mestre);
CREATE INDEX idx_mestre_agenda ON agenda(id_usuario_mestre);