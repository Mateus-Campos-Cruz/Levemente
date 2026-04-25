/**
 * LEVEMENTE - Gestão de Evoluções
 * Listagem, Busca, Paginação e Ações
 */

const API_EVOLUCOES = 'http://localhost:3000/api/evolucoes';
let paginaAtual = 1;
const itensPorPagina = 10;
let termoBusca = '';
let statusFiltro = '';
let idEvolucaoExcluir = null;

document.addEventListener("DOMContentLoaded", () => {
    carregarEvolucoes();
    configurarFiltros();
    
    document.getElementById('btnCarregarMais').addEventListener('click', () => {
        paginaAtual++;
        carregarEvolucoes(true);
    });

    document.getElementById('btnConfirmarExclusao').addEventListener('click', confirmarExclusao);
});

async function carregarEvolucoes(append = false) {
    const lista = document.getElementById('listaEvolucoes');
    const btnMais = document.getElementById('btnCarregarMais');

    if (!append) {
        lista.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><p>Buscando evoluções...</p></div>';
        paginaAtual = 1;
    }

    try {
        const offset = (paginaAtual - 1) * itensPorPagina;
        let url = `${API_EVOLUCOES}?limit=${itensPorPagina}&offset=${offset}`;
        if (termoBusca) url += `&busca=${encodeURIComponent(termoBusca)}`;
        if (statusFiltro) url += `&status=${statusFiltro}`;

        const res = await fetch(url, { headers: getAuthHeaders() });
        const data = await res.json(); // { total: X, items: [...] }

        if (!append) lista.innerHTML = '';

        if (data.items.length === 0 && !append) {
            lista.innerHTML = '<div class="loading-state"><p>Nenhuma evolução encontrada.</p></div>';
            btnMais.style.display = 'none';
            return;
        }

        data.items.forEach(evol => {
            const card = criarCardEvolucao(evol);
            lista.appendChild(card);
        });

        // Mostrar ou esconder botão "Carregar Mais"
        if (data.items.length < itensPorPagina || (offset + data.items.length) >= data.total) {
            btnMais.style.display = 'none';
        } else {
            btnMais.style.display = 'block';
        }

    } catch (err) {
        console.error(err);
        lista.innerHTML = '<div class="loading-state"><p>Erro ao carregar evoluções.</p></div>';
    }
}

function criarCardEvolucao(evol) {
    const div = document.createElement('div');
    div.className = 'evolucao-card';
    
    // Formata data
    const dateSessao = new Date(evol.data_sessao + 'T00:00:00');
    const dataFormatada = dateSessao.toLocaleDateString('pt-BR');
    
    const status = evol.status || 'Finalizado';
    const statusClass = status.toLowerCase();

    div.innerHTML = `
        <div class="evolucao-header">
            <div class="patient-info">
                <h4>${evol.nome_paciente}</h4>
                <span>${evol.tipo_sessao || 'Sessão Individual'}</span>
            </div>
            <div class="evolucao-tags">
                <span class="status-tag ${statusClass}">${status}</span>
            </div>
        </div>
        <div class="evolucao-content">
            ${evol.texto_evolucao}
        </div>
        <div class="evolucao-footer">
            <div class="evolucao-date">
                <i class="far fa-calendar-alt"></i> Sessão de ${dataFormatada}
            </div>
            <div class="card-actions">
                <button class="btn-card-action" title="Editar" onclick="editarEvolucao(${evol.id_evolucao})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-card-action delete" title="Excluir" onclick="abrirModalExcluir(${evol.id_evolucao})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `;

    // Clicar no card leva para a edição (ou visualização)
    div.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
            editarEvolucao(evol.id_evolucao);
        }
    });

    return div;
}

function configurarFiltros() {
    const inputBusca = document.getElementById('inputBuscaEvolucoes');
    const selectStatus = document.getElementById('filtroStatus');

    let debounceTimer;
    inputBusca.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            termoBusca = e.target.value;
            carregarEvolucoes();
        }, 500);
    });

    selectStatus.addEventListener('change', (e) => {
        statusFiltro = e.target.value;
        carregarEvolucoes();
    });
}

function editarEvolucao(id) {
    window.location.href = `editar-evolucao.html?id=${id}`;
}

function abrirModalExcluir(id) {
    idEvolucaoExcluir = id;
    const modal = document.getElementById('modalExcluir');
    modal.style.display = 'flex';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

async function confirmarExclusao() {
    if (!idEvolucaoExcluir) return;

    try {
        const res = await fetch(`${API_EVOLUCOES}/${idEvolucaoExcluir}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!res.ok) throw new Error('Erro ao excluir');

        closeModal('modalExcluir');
        carregarEvolucoes();
        alert('Evolução excluída com sucesso.');
    } catch (err) {
        console.error(err);
        alert('Falha ao excluir evolução.');
    }
}
