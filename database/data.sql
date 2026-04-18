CREATE DATABASE LEVEMENTE;

USE LEVEMENTE;

CREATE TABLE pacientes (
    id_paciente INT AUTO_INCREMENT PRIMARY KEY,
    nome_completo VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    data_nascimento DATE,
    telefone VARCHAR(20),
    contato_emergencia VARCHAR(100),
    anamnese_texto TEXT,
    status ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE evolucoes (
    id_evolucao INT AUTO_INCREMENT PRIMARY KEY,
    id_paciente INT,
    data_sessao DATE NOT NULL,
    texto_evolucao TEXT NOT NULL,
    tipo_sessao ENUM('Presencial', 'Online') DEFAULT 'Presencial',
    tags VARCHAR(50), -- Ex: 'Ansiedade', 'Luto'
    FOREIGN KEY (id_paciente) REFERENCES pacientes(id_paciente) ON DELETE CASCADE
);

CREATE TABLE financeiro (
    id_lancamento INT AUTO_INCREMENT PRIMARY KEY,
    id_paciente INT, -- Pode ser NULL para despesas fixas (aluguel, etc)
    descricao VARCHAR(100) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    tipo ENUM('Receita', 'Despesa') NOT NULL,
    status_pagamento ENUM('Pago', 'Pendente') DEFAULT 'Pendente',
    data_vencimento DATE NOT NULL,
    FOREIGN KEY (id_paciente) REFERENCES pacientes(id_paciente)
);