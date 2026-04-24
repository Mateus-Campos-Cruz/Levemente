/**
 * LEVEMENTE - Gestão Financeira
 * Lógica de Integração com API, Modal, Persistência e Interface
 */

const API_FINANCEIRO = 'http://localhost:3000/api/financeiro';
const API_PACIENTES = 'http://localhost:3000/api/pacientes';

let idLancamentoExcluir = null;

document.addEventListener("DOMContentLoaded", () => {
    configurarFiltroMes();
    configurarBusca();
    carregarPacientes();
    configurarFormFinanceiro();
    
    // Configurar exclusão
    const btnConfirmarExclusao = document.getElementById('btnConfirmarExclusao');
    if (btnConfirmarExclusao) {
        btnConfirmarExclusao.addEventListener('click', confirmarExclusao);
    }
});

// --- FILTRO DE MÊS ---

function configurarFiltroMes() {
    const inputMes = document.getElementById('filtroMes');
    if (!inputMes) return;

    // Setar o mês atual como padrão
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    inputMes.value = `${ano}-${mes}`;

    // Carregar lançamentos iniciais
    carregarLancamentos(mes, ano);

    // Evento de mudança no filtro
    inputMes.addEventListener('change', (e) => {
        const [novoAno, novoMes] = e.target.value.split('-');
        if (novoAno && novoMes) {
            carregarLancamentos(novoMes, novoAno);
        } else {
            // Se o campo for limpo, carrega tudo (ou você pode forçar um valor)
            carregarLancamentos();
        }
    });
}

// --- FILTRO DE BUSCA ---

function configurarBusca() {
    const inputBusca = document.getElementById('inputBuscaFinanceiro');
    if (!inputBusca) return;

    inputBusca.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        const linhas = document.querySelectorAll('.finance-row');
        
        linhas.forEach(linha => {
            const textoLinha = linha.innerText.toLowerCase();
            if (textoLinha.includes(termo)) {
                linha.style.display = '';
            } else {
                linha.style.display = 'none';
            }
        });
    });
}

// --- API FETCH ---

async function carregarPacientes() {
    try {
        const res = await fetch(API_PACIENTES, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Erro ao buscar pacientes');
        const pacientes = await res.json();
        
        const select = document.getElementById('id_paciente');
        if (!select) return;

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

async function carregarLancamentos(mes, ano) {
    try {
        let url = API_FINANCEIRO;
        if (mes && ano) {
            url += `?mes=${mes}&ano=${ano}`;
        }
        const res = await fetch(url, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Erro ao buscar lançamentos');
        const lancamentos = await res.json();
        
        renderizarTabela(lancamentos);
        atualizarResumo(lancamentos);
    } catch (error) {
        console.error(error);
        alert('Erro ao carregar os dados financeiros.');
    }
}

// --- MODAL ---

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "flex";
        // Definir a data atual no form se for novo lançamento
        if (modalId === 'modalLancamento') {
            const dateInput = document.getElementById('data_vencimento');
            if (dateInput && !dateInput.value) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "none";
}

window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
});

// --- FORMULÁRIO ---

function configurarFormFinanceiro() {
    const form = document.getElementById('formFinanceiro');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

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
            const res = await fetch(API_FINANCEIRO, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.erro || 'Erro ao cadastrar lançamento');
            }

            closeModal('modalLancamento');
            form.reset();
            
            // Recarrega de acordo com o filtro atual
            const inputMes = document.getElementById('filtroMes');
            if (inputMes && inputMes.value) {
                const [ano, mes] = inputMes.value.split('-');
                carregarLancamentos(mes, ano);
            } else {
                carregarLancamentos();
            }

        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    });
}

// --- INTERFACE (DOM) ---

function renderizarTabela(lista) {
    const tabela = document.getElementById('tabelaFinanceira');
    if (!tabela) return;
    tabela.innerHTML = ''; // Limpar tabela

    if (lista.length === 0) {
        tabela.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">Nenhum lançamento encontrado para este mês.</td></tr>';
        return;
    }

    lista.forEach(item => adicionarLinhaFinanceira(item));
}

function adicionarLinhaFinanceira(item) {
    const tabela = document.getElementById('tabelaFinanceira');
    const valor = Number(item.valor);
    const valorFormatado = isNaN(valor) ? '0.00' : valor.toFixed(2).replace('.', ',');

    // Estilos das Tags
    // Receita: texto azul, Despesa: texto vermelho, Pendente: texto amarelo
    let corTextoTipo = item.tipo === 'Receita' ? 'color: #1890ff;' : 'color: #f5222d;';
    let corTextoStatus = item.status_pagamento === 'Pendente' ? 'color: #faad14;' : 'color: #52c41a;';

    const [ano, mes, dia] = item.data_vencimento.split('-');
    const dataFormatada = `${dia}/${mes}/${ano}`;

    const tr = document.createElement('tr');
    tr.className = 'finance-row';
    tr.innerHTML = `
        <td class="finance-info">
            <div class="avatar-small"><i class="fas fa-file-invoice-dollar"></i></div>
            <div><strong>${item.descricao}</strong></div>
        </td>
        <td>${item.nome_paciente || 'Despesa Fixa / Outro'}</td>
        <td class="hide-tablet"><strong>R$ ${valorFormatado}</strong></td>
        <td class="hide-tablet">${dataFormatada}</td>
        <td><strong style="${corTextoTipo}">${item.tipo}</strong></td>
        <td><span style="${corTextoStatus}; font-weight: 600;">${item.status_pagamento}</span></td>
        <td class="actions">
            <button class="btn-icon" title="Editar" onclick="editarLancamento(${item.id_lancamento})">
                <i class="fas fa-edit" style="color: var(--primary-color);"></i>
            </button>
            <button class="btn-icon" title="Excluir" onclick="abrirModalExcluir(${item.id_lancamento})">
                <i class="fas fa-trash-alt" style="color: var(--danger-color);"></i>
            </button>
        </td>
    `;

    tabela.appendChild(tr);
}

// --- AÇÕES ---

function editarLancamento(id) {
    window.location.href = `lancamento_edit.html?id=${id}`;
}

function abrirModalExcluir(id) {
    idLancamentoExcluir = id;
    openModal('modalExcluir');
}

async function confirmarExclusao() {
    if (!idLancamentoExcluir) return;

    try {
        const res = await fetch(`${API_FINANCEIRO}/${idLancamentoExcluir}`, { 
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Erro ao excluir lançamento');

        closeModal('modalExcluir');
        idLancamentoExcluir = null;

        const inputMes = document.getElementById('filtroMes');
        if (inputMes && inputMes.value) {
            const [ano, mes] = inputMes.value.split('-');
            carregarLancamentos(mes, ano);
        } else {
            carregarLancamentos();
        }
    } catch (error) {
        console.error(error);
        alert('Falha ao excluir o lançamento.');
    }
}

// --- RESUMO FINANCEIRO ---

function atualizarResumo(lista) {
    let receitaPaga = 0;
    let receitaPendente = 0;
    let despesaPaga = 0;
    let despesaPendente = 0;

    lista.forEach(item => {
        const valor = Number(item.valor) || 0;
        if (item.tipo === 'Receita') {
            if (item.status_pagamento === 'Pago') receitaPaga += valor;
            else receitaPendente += valor;
        } else if (item.tipo === 'Despesa') {
            if (item.status_pagamento === 'Pago') despesaPaga += valor;
            else despesaPendente += valor;
        }
    });

    const elReceitaPaga = document.getElementById('receita-paga');
    const elReceitaPendente = document.getElementById('receita-pendente');
    const elDespesaPaga = document.getElementById('despesa-paga');
    const elDespesaPendente = document.getElementById('despesa-pendente');

    if (elReceitaPaga) elReceitaPaga.innerText = `R$ ${receitaPaga.toFixed(2).replace('.', ',')}`;
    if (elReceitaPendente) elReceitaPendente.innerText = `R$ ${receitaPendente.toFixed(2).replace('.', ',')}`;
    if (elDespesaPaga) elDespesaPaga.innerText = `R$ ${despesaPaga.toFixed(2).replace('.', ',')}`;
    if (elDespesaPendente) elDespesaPendente.innerText = `R$ ${despesaPendente.toFixed(2).replace('.', ',')}`;
}
