// js/financeiro.js

// --- FUNÇÕES DE NAVEGAÇÃO (MODAL) ---
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "block";
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "none";
    }
}

// Fechar ao clicar fora da área branca
window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
});


document.addEventListener("DOMContentLoaded", () => {
    carregarLancamentos();
    configurarFormFinanceiro();
});

function configurarFormFinanceiro() {
    const form = document.getElementById('formFinanceiro');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = new FormData(form);
        
        const lancamento = {
            id: Date.now(),
            descricao: data.get('descricao'),
            valor: parseFloat(data.get('valor')),
            status: data.get('status'),
            data: new Date().toLocaleDateString('pt-BR')
        };

        salvarLancamento(lancamento);
        adicionarLinhaFinanceira(lancamento);
        atualizarResumo();
        closeModal('modalLancamento');
        form.reset();
    });
}

function salvarLancamento(obj) {
    const lista = JSON.parse(localStorage.getItem('levemente_financeiro')) || [];
    lista.push(obj);
    localStorage.setItem('levemente_financeiro', JSON.stringify(lista));
}

function carregarLancamentos() {
    const lista = JSON.parse(localStorage.getItem('levemente_financeiro')) || [];
    lista.forEach(item => adicionarLinhaFinanceira(item));
    atualizarResumo();
}

function adicionarLinhaFinanceira(item) {
    const tabela = document.getElementById('tabelaFinanceira');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${item.descricao}</td>
        <td>Particular</td>
        <td>R$ ${item.valor.toFixed(2)}</td>
        <td>${item.data}</td>
        <td><span class="status-tag ${item.status}">${item.status.toUpperCase()}</span></td>
        <td><button class="btn-icon" onclick="excluirLancamento(${item.id})"><i class="fas fa-trash"></i></button></td>
    `;
    tabela.prepend(tr);
}

function atualizarResumo() {
    const lista = JSON.parse(localStorage.getItem('levemente_financeiro')) || [];
    let pago = 0;
    let pendente = 0;

    lista.forEach(item => {
        if (item.status === 'pago') pago += item.valor;
        else pendente += item.valor;
    });

    document.getElementById('receita-total').innerText = `R$ ${pago.toFixed(2)}`;
    document.getElementById('pendente-total').innerText = `R$ ${pendente.toFixed(2)}`;
}

