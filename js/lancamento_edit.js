/**
 * LEVEMENTE - Editar Lançamento Financeiro
 */

const API_FINANCEIRO = 'http://localhost:3000/api/financeiro';
const API_PACIENTES = 'http://localhost:3000/api/pacientes';

let idLancamento = null;

document.addEventListener("DOMContentLoaded", async () => {
    // Pegar ID da URL
    const params = new URLSearchParams(window.location.search);
    idLancamento = params.get('id');

    if (!idLancamento) {
        alert("ID de lançamento não fornecido.");
        window.location.href = 'financeiro.html';
        return;
    }

    await carregarPacientes();
    await carregarDadosLancamento();
    configurarFormulario();
});

// Funções de Modal
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex';
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
}

async function carregarPacientes() {
    try {
        const res = await fetch(API_PACIENTES, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Erro ao buscar pacientes');
        const pacientes = await res.json();
        
        const select = document.getElementById('id_paciente');
        
        pacientes.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id_paciente;
            option.textContent = p.nome_completo;
            select.appendChild(option);
        });
    } catch (error) {
        console.error(error);
    }
}

async function carregarDadosLancamento() {
    try {
        const res = await fetch(`${API_FINANCEIRO}/${idLancamento}`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Lançamento não encontrado');
        const data = await res.json();

        document.getElementById('id_paciente').value = data.id_paciente || '';
        document.getElementById('descricao').value = data.descricao;
        document.getElementById('valor').value = parseFloat(data.valor).toFixed(2);
        
        // Data vem no formato YYYY-MM-DD
        document.getElementById('data_vencimento').value = data.data_vencimento;
        
        document.getElementById('tipo').value = data.tipo;
        document.getElementById('status_pagamento').value = data.status_pagamento;

    } catch (error) {
        console.error(error);
        alert('Erro ao carregar dados do lançamento.');
        window.location.href = 'financeiro.html';
    }
}

function configurarFormulario() {
    const form = document.getElementById('formEditLancamento');
    const btnConfirmarSave = document.getElementById('btnConfirmarSave');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        openModal('modalConfirmarUpdate');
    });

    if (btnConfirmarSave) {
        btnConfirmarSave.addEventListener('click', async () => {
            closeModal('modalConfirmarUpdate');
            await executarSalvamento();
        });
    }
}

async function executarSalvamento() {
    const id_paciente = document.getElementById('id_paciente').value;
    const descricao = document.getElementById('descricao').value.trim();
    const valor = parseFloat(document.getElementById('valor').value);
    const data_vencimento = document.getElementById('data_vencimento').value;
    const tipo = document.getElementById('tipo').value;
    const status_pagamento = document.getElementById('status_pagamento').value;

    if (!descricao || isNaN(valor) || valor <= 0 || !data_vencimento || !tipo) {
        alert('Preencha os campos corretamente.');
        return;
    }

    const payload = {
        id_paciente: id_paciente || null,
        descricao,
        valor,
        data_vencimento,
        tipo,
        status_pagamento
    };

    try {
        const res = await fetch(`${API_FINANCEIRO}/${idLancamento}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.erro || 'Erro ao atualizar lançamento');
        }

        // Show Success Modal
        openModal('modalSucesso');

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}
