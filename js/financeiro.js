/**
 * LEVEMENTE - Gestão Financeira
 * Lógica de Modal, Cadastro, Persistência e Interface
 */

document.addEventListener("DOMContentLoaded", () => {
    carregarLancamentos();
    configurarFormFinanceiro();
    configurarFiltro();
});

// --- MODAL ---

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "block";
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "none";
}

// Fecha ao clicar fora da área útil
window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
});

// --- FORMULÁRIO ---

function configurarFormFinanceiro() {
    const form = document.getElementById('formFinanceiro');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const descricao = document.getElementById('descricao').value.trim();
        const valor = parseFloat(document.getElementById('valor').value);
        const status = document.getElementById('statusLancamento').value;

        if (!descricao || isNaN(valor) || valor <= 0) return;

        const lancamento = {
            id: Date.now(),
            descricao,
            valor,
            status,  // "Pago" ou "Pendente"
            data: new Date().toLocaleDateString('pt-BR')
        };

        salvarLancamento(lancamento);
        adicionarLinhaFinanceira(lancamento);
        atualizarResumo();
        closeModal('modalLancamento');
        form.reset();
    });
}

// --- PERSISTÊNCIA ---

function salvarLancamento(obj) {
    const lista = JSON.parse(localStorage.getItem('levemente_financeiro')) || [];
    lista.push(obj);
    localStorage.setItem('levemente_financeiro', JSON.stringify(lista));
}

function excluirLancamento(id) {
    let lista = JSON.parse(localStorage.getItem('levemente_financeiro')) || [];
    lista = lista.filter(item => item.id !== id);
    localStorage.setItem('levemente_financeiro', JSON.stringify(lista));

    const btn = document.querySelector(`button[data-id="${id}"]`);
    if (btn) btn.closest('tr').remove();

    atualizarResumo();
}

function carregarLancamentos() {
    const lista = JSON.parse(localStorage.getItem('levemente_financeiro')) || [];
    lista.forEach(item => adicionarLinhaFinanceira(item));
    atualizarResumo();
}

// --- INTERFACE (DOM) ---

function adicionarLinhaFinanceira(item) {
    const tabela = document.getElementById('tabelaFinanceira');
    if (!tabela) return;

    // Garante que valor é número mesmo que venha do localStorage como string
    const valor = Number(item.valor);
    const valorFormatado = isNaN(valor) ? '0.00' : valor.toFixed(2);

    // Mapeia status para classe CSS (igual ao pacientes.js com toLowerCase)
    const statusClass = item.status.toLowerCase() === 'pago' ? 'active' : 'inactive';
    const statusLabel = item.status;

    const tr = document.createElement('tr');
    tr.className = 'finance-row';
    tr.innerHTML = `
        <td class="finance-info">
            <div class="avatar-small"><i class="fas fa-file-invoice-dollar"></i></div>
            <div><strong>${item.descricao}</strong></div>
        </td>
        <td>Particular</td>
        <td class="hide-tablet"><strong>R$ ${valorFormatado}</strong></td>
        <td class="hide-tablet">${item.data}</td>
        <td><span class="status-tag ${statusClass}">${statusLabel}</span></td>
        <td class="actions">
            <button class="btn-icon" data-id="${item.id}" title="Excluir" onclick="excluirLancamento(${item.id})">
                <i class="fas fa-trash-alt"></i>
            </button>
        </td>
    `;

    tabela.prepend(tr);
}

// --- RESUMO FINANCEIRO ---

function atualizarResumo() {
    const lista = JSON.parse(localStorage.getItem('levemente_financeiro')) || [];
    let pago = 0;
    let pendente = 0;

    lista.forEach(item => {
        const valor = Number(item.valor) || 0;
        if (item.status.toLowerCase() === 'pago') {
            pago += valor;
        } else {
            pendente += valor;
        }
    });

    const elReceita = document.getElementById('receita-total');
    const elPendente = document.getElementById('pendente-total');
    if (elReceita) elReceita.innerText = `R$ ${pago.toFixed(2)}`;
    if (elPendente) elPendente.innerText = `R$ ${pendente.toFixed(2)}`;
}

// --- FILTRO DE BUSCA ---

function configurarFiltro() {
    const input = document.getElementById('inputBuscaFinanceiro');
    const tabela = document.getElementById('tabelaFinanceira');
    if (!input || !tabela) return;

    input.addEventListener('input', () => {
        const termo = input.value.toLowerCase();
        Array.from(tabela.getElementsByClassName('finance-row')).forEach(linha => {
            linha.style.display = linha.textContent.toLowerCase().includes(termo) ? '' : 'none';
        });
    });
}
