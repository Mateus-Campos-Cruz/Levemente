/**
 * LEVEMENTE - Gestão Financeira
 * Lógica de Integração com API, Modal, Persistência e Interface
 */

const API_FINANCEIRO = 'http://localhost:3000/api/financeiro';
const API_PACIENTES = 'http://localhost:3000/api/pacientes';

let idLancamentoExcluir = null;
let currentYear, currentMonth;
let listaPacientes = []; // Cache para busca dinâmica

document.addEventListener("DOMContentLoaded", () => {
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();

    inicializarFiltros();
    configurarBuscaTabela();
    carregarPacientes();
    configurarBuscaPaciente();
    configurarFormFinanceiro();
    carregarLancamentos(currentMonth + 1, currentYear);
    
    // Listeners de Navegação (Estilo Agenda)
    document.getElementById('prevMonth').addEventListener('click', () => navegarMes(-1));
    document.getElementById('nextMonth').addEventListener('click', () => navegarMes(1));
    document.getElementById('selectMonth').addEventListener('change', (e) => {
        currentMonth = parseInt(e.target.value);
        carregarLancamentos(currentMonth + 1, currentYear);
    });
    document.getElementById('selectYear').addEventListener('change', (e) => {
        currentYear = parseInt(e.target.value);
        carregarLancamentos(currentMonth + 1, currentYear);
    });

    const btnConfirmarExclusao = document.getElementById('btnConfirmarExclusao');
    if (btnConfirmarExclusao) {
        btnConfirmarExclusao.addEventListener('click', confirmarExclusao);
    }
});

// --- FILTROS ---

function inicializarFiltros() {
    const selectYear = document.getElementById('selectYear');
    const selectMonth = document.getElementById('selectMonth');
    const year = new Date().getFullYear();
    for (let i = year - 5; i <= year + 5; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = i;
        if (i === currentYear) opt.selected = true;
        selectYear.appendChild(opt);
    }
    selectMonth.value = currentMonth;
}

function navegarMes(direcao) {
    currentMonth += direcao;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    document.getElementById('selectMonth').value = currentMonth;
    document.getElementById('selectYear').value = currentYear;
    carregarLancamentos(currentMonth + 1, currentYear);
}

function configurarBuscaTabela() {
    const inputBusca = document.getElementById('inputBuscaFinanceiro');
    if (!inputBusca) return;
    inputBusca.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        const linhas = document.querySelectorAll('.finance-row');
        linhas.forEach(linha => {
            const textoLinha = linha.innerText.toLowerCase();
            linha.style.display = textoLinha.includes(termo) ? '' : 'none';
        });
    });
}

// --- BUSCA DINÂMICA DE PACIENTES NO MODAL ---

async function carregarPacientes() {
    try {
        const res = await fetch(API_PACIENTES, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Erro ao buscar pacientes');
        listaPacientes = await res.json();
    } catch (error) {
        console.error(error);
    }
}

function configurarBuscaPaciente() {
    const inputSearch = document.getElementById('paciente_search');
    const inputId = document.getElementById('id_paciente');
    const resultsContainer = document.getElementById('paciente_results');

    if (!inputSearch || !resultsContainer) return;

    inputSearch.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        
        // Se limpar o campo, limpa o ID também
        if (!termo) {
            inputId.value = "";
            resultsContainer.classList.remove('active');
            return;
        }

        const filtrados = listaPacientes.filter(p => 
            p.nome_completo.toLowerCase().includes(termo)
        );

        renderizarResultadosBusca(filtrados);
    });

    // Fecha a lista ao clicar fora
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select-container')) {
            resultsContainer.classList.remove('active');
        }
    });
}

function renderizarResultadosBusca(pacientes) {
    const resultsContainer = document.getElementById('paciente_results');
    resultsContainer.innerHTML = '';
    
    if (pacientes.length === 0) {
        resultsContainer.innerHTML = '<div class="result-item no-results">Nenhum paciente encontrado</div>';
    } else {
        pacientes.forEach(p => {
            const div = document.createElement('div');
            div.className = 'result-item';
            div.textContent = p.nome_completo;
            div.onclick = () => selecionarPaciente(p);
            resultsContainer.appendChild(div);
        });
    }
    
    resultsContainer.classList.add('active');
}

function selecionarPaciente(paciente) {
    document.getElementById('paciente_search').value = paciente.nome_completo;
    document.getElementById('id_paciente').value = paciente.id_paciente;
    document.getElementById('paciente_results').classList.remove('active');
}

// --- API FETCH ---

async function carregarLancamentos(mes, ano) {
    try {
        let url = API_FINANCEIRO;
        if (mes && ano) url += `?mes=${mes}&ano=${ano}`;
        const res = await fetch(url, { headers: getAuthHeaders() });
        const lancamentos = await res.json();
        renderizarTabela(lancamentos);
        atualizarResumo(lancamentos);
    } catch (error) {
        console.error(error);
    }
}

// --- MODAL ---

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "flex";
        if (modalId === 'modalLancamento') {
            // Resetar busca de paciente ao abrir
            document.getElementById('paciente_search').value = "";
            document.getElementById('id_paciente').value = "";
            
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
    if (event.target.classList.contains('modal')) event.target.style.display = "none";
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

        const payload = { id_paciente: id_paciente || null, descricao, valor, data_vencimento, tipo, status_pagamento };

        try {
            const res = await fetch(API_FINANCEIRO, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Erro ao salvar lançamento');
            closeModal('modalLancamento');
            form.reset();
            carregarLancamentos(currentMonth + 1, currentYear);
        } catch (error) {
            alert(error.message);
        }
    });
}

// --- INTERFACE (DOM) ---

function renderizarTabela(lista) {
    const tabela = document.getElementById('tabelaFinanceira');
    if (!tabela) return;
    tabela.innerHTML = '';
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
                <i class="fas fa-edit" style="color: var(--pink-accent);"></i>
            </button>
            <button class="btn-icon" title="Excluir" onclick="abrirModalExcluir(${item.id_lancamento})">
                <i class="fas fa-trash-alt" style="color: #ef4444;"></i>
            </button>
        </td>
    `;
    tabela.appendChild(tr);
}

function editarLancamento(id) { window.location.href = `lancamento_edit.html?id=${id}`; }

function abrirModalExcluir(id) { idLancamentoExcluir = id; openModal('modalExcluir'); }

async function confirmarExclusao() {
    if (!idLancamentoExcluir) return;
    try {
        const res = await fetch(`${API_FINANCEIRO}/${idLancamentoExcluir}`, { method: 'DELETE', headers: getAuthHeaders() });
        closeModal('modalExcluir');
        idLancamentoExcluir = null;
        carregarLancamentos(currentMonth + 1, currentYear);
    } catch (error) { alert('Falha ao excluir o lançamento.'); }
}

function atualizarResumo(lista) {
    let recP = 0, recPend = 0, desP = 0, desPend = 0;
    lista.forEach(item => {
        const v = Number(item.valor) || 0;
        if (item.tipo === 'Receita') { if (item.status_pagamento === 'Pago') recP += v; else recPend += v; }
        else { if (item.status_pagamento === 'Pago') desP += v; else desPend += v; }
    });
    document.getElementById('receita-paga').innerText = `R$ ${recP.toFixed(2).replace('.', ',')}`;
    document.getElementById('receita-pendente').innerText = `R$ ${recPend.toFixed(2).replace('.', ',')}`;
    document.getElementById('despesa-paga').innerText = `R$ ${desP.toFixed(2).replace('.', ',')}`;
    document.getElementById('despesa-pendente').innerText = `R$ ${desPend.toFixed(2).replace('.', ',')}`;
}
