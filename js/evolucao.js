/**
 * LEVEMENTE - Evoluções
 */

let evolucaoIdParaDeletar = null;
let pacienteIdAtual = null;

document.addEventListener("DOMContentLoaded", () => {
    carregarCabecalhoEEvolucoes();
});

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "block";
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "none";
}

async function carregarCabecalhoEEvolucoes() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    pacienteIdAtual = id;

    if (!id) {
        alert("ID do paciente não informado.");
        window.location.href = "pacientes.html";
        return;
    }

    // Botão de Nova Evolução
    const btnNova = document.getElementById('btnNovaEvolucao');
    if (btnNova) {
        btnNova.onclick = () => {
            window.location.href = `nova-evolucao.html?id=${id}`;
        };
    }

    // Busca paciente
    try {
        const res = await fetch(`http://localhost:3000/api/pacientes/${id}`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Erro ao buscar paciente');
        const p = await res.json();

        // Atualiza breadcrumb
        const linkPerfil = document.getElementById('link-perfil-paciente');
        if (linkPerfil) {
            linkPerfil.textContent = p.nome_completo;
            linkPerfil.href = `perfil-paciente.html?id=${id}`;
        }
    } catch (err) {
        console.error(err);
        alert('Erro ao carregar dados do paciente.');
    }

    // Busca evoluções
    carregarListaEvolucoes();
}

async function carregarListaEvolucoes() {
    try {
        const res = await fetch(`http://localhost:3000/api/evolucoes/paciente/${pacienteIdAtual}`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Erro ao buscar evoluções');
        const evolucoes = await res.json();

        renderizarEvolucoes(evolucoes);
    } catch (err) {
        console.error(err);
        document.getElementById('lista-evolucoes').innerHTML = '<p>Erro ao carregar evoluções.</p>';
    }
}

const meses = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

function renderizarEvolucoes(evolucoes) {
    const lista = document.getElementById('lista-evolucoes');
    lista.innerHTML = '';

    if (evolucoes.length === 0) {
        lista.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Nenhuma evolução cadastrada para este paciente.</p>';
        return;
    }

    evolucoes.forEach(ev => {
        // Tratar data
        const dateObj = new Date(ev.data_sessao + 'T00:00:00');
        const dia = String(dateObj.getDate()).padStart(2, '0');
        const mesStr = meses[dateObj.getMonth()];
        const ano = dateObj.getFullYear();

        const card = document.createElement('div');
        card.className = 'card timeline-item';
        card.id = `evolucao-${ev.id_evolucao}`;

        card.innerHTML = `
            <div class="timeline-date">
                <strong>${dia}</strong>
                <span>${mesStr} ${ano}</span>
            </div>
            <div class="timeline-content">
                <div class="content-header">
                    <h4>Sessão - ${ev.tipo_sessao}</h4>
                    ${ev.tags ? `<span class="tag">${ev.tags}</span>` : ''}
                </div>
                <p id="texto-ev-${ev.id_evolucao}">${ev.texto_evolucao}</p>
                <div class="content-footer">
                    <button class="btn-text" onclick="editarEvolucao(${ev.id_evolucao})"><i class="fas fa-edit"></i> Editar</button>
                    <button class="btn-text" style="color:#ef4444;" onclick="confirmarDeletar(${ev.id_evolucao})"><i class="fas fa-trash"></i> Deletar</button>
                    <button class="btn-text" onclick="imprimirEvolucao(${ev.id_evolucao})"><i class="fas fa-print"></i> Imprimir PDF</button>
                </div>
            </div>
        `;
        lista.appendChild(card);
    });
}

function confirmarDeletar(id_evolucao) {
    evolucaoIdParaDeletar = id_evolucao;
    openModal('deleteEvolucaoModal');
}

document.getElementById('btnConfirmarDeleteEvolucao').addEventListener('click', async () => {
    if (!evolucaoIdParaDeletar) return;

    try {
        const res = await fetch(`http://localhost:3000/api/evolucoes/${evolucaoIdParaDeletar}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!res.ok) throw new Error('Erro ao deletar.');

        // Sucesso
        closeModal('deleteEvolucaoModal');
        const card = document.getElementById(`evolucao-${evolucaoIdParaDeletar}`);
        if (card) {
            card.remove();
        }
        
    } catch (err) {
        console.error(err);
        alert('Erro ao excluir a evolução.');
    } finally {
        evolucaoIdParaDeletar = null;
    }
});

function editarEvolucao(id_evolucao) {
    window.location.href = `editar-evolucao.html?id=${id_evolucao}`;
}

function imprimirEvolucao(id_evolucao) {
    // Isolamos o texto da evolução para imprimir
    const texto = document.getElementById(`texto-ev-${id_evolucao}`).innerText;
    const nomePaciente = document.getElementById('link-perfil-paciente').textContent;
    
    // Abrimos uma nova janela vazia
    const janelaImpressao = window.open('', '', 'width=800,height=600');
    janelaImpressao.document.write(`
        <html>
            <head>
                <title>Impressão de Evolução - ${nomePaciente}</title>
                <style>
                    body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                    h1 { font-size: 1.5rem; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-bottom: 30px; }
                    .header { margin-bottom: 40px; }
                    .footer { margin-top: 50px; font-size: 0.8rem; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>LEVEMENTE - Registro de Evolução</h1>
                    <p><strong>Paciente:</strong> ${nomePaciente}</p>
                </div>
                <div>
                    ${texto.replace(/\n/g, '<br>')}
                </div>
                <div class="footer">
                    Documento gerado pelo sistema Levemente.
                </div>
            </body>
        </html>
    `);
    
    janelaImpressao.document.close();
    janelaImpressao.focus();
    // Aguarda o render para chamar a impressão
    setTimeout(() => {
        janelaImpressao.print();
        janelaImpressao.close();
    }, 250);
}
