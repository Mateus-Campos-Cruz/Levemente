/**
 * LEVEMENTE - Dashboard
 * Lógica para popular dados dinâmicos do Dashboard
 */

const API_DASH_STATS = 'http://localhost:3000/api/dashboard/stats';
const API_AGENDA = 'http://localhost:3000/api/agenda';
const API_EVOLUCOES_GERAL = 'http://localhost:3000/api/evolucoes'; // Endpoint que retorna todas evoluções (ou implementamos o filtro)

document.addEventListener("DOMContentLoaded", () => {
    carregarUsuario();
    carregarEstatisticas();
    carregarSessoesPendentesHoje();
    carregarPendenciasEvolucao();
});

/**
 * Carrega dados do usuário logado do localStorage
 */
function carregarUsuario() {
    const usuarioJson = localStorage.getItem('usuario');
    if (usuarioJson) {
        const usuario = JSON.parse(usuarioJson);
        const elNome = document.getElementById('user-name-display');
        const elAvatar = document.getElementById('user-avatar-display');

        if (elNome) elNome.textContent = usuario.nome || 'Usuário';
        if (elAvatar && usuario.nome) {
            elAvatar.textContent = usuario.nome.charAt(0).toUpperCase();
        }
    }
}

/**
 * Busca estatísticas gerais (Ativos, Sessões Hoje, Faturamento)
 */
async function carregarEstatisticas() {
    try {
        const res = await fetch(API_DASH_STATS, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Erro ao buscar estatísticas');
        const stats = await res.json();

        const elAtivos = document.getElementById('total-pacientes-ativos');
        if (elAtivos) elAtivos.textContent = stats.pacientesAtivos;

        const elSessoesHoje = document.getElementById('total-sessoes-hoje');
        if (elSessoesHoje) elSessoesHoje.textContent = stats.sessoesHoje;

        const elFaturamento = document.getElementById('faturamento-mes');
        if (elFaturamento) {
            elFaturamento.innerText = `R$ ${stats.faturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
    } catch (error) {
        console.error("Erro ao carregar estatísticas do Dashboard:", error);
    }
}

/**
 * Busca sessões agendadas para hoje que ainda não foram iniciadas
 */
async function carregarSessoesPendentesHoje() {
    const lista = document.getElementById('lista-sessoes-pendentes');
    if (!lista) return;

    try {
        const res = await fetch(API_AGENDA, { headers: getAuthHeaders() });
        const agenda = await res.json();

        const hoje = new Date().toISOString().split('T')[0];
        const sessoesPendentes = agenda.filter(item => 
            item.data_sessao === hoje && item.status === 'Agendada'
        );

        lista.innerHTML = '';
        if (sessoesPendentes.length === 0) {
            lista.innerHTML = `<li class="session-item" style="justify-content: center; color: #64748b; padding: 20px; font-size: 0.9rem;">Nenhuma sessão pendente para hoje.</li>`;
            return;
        }

        sessoesPendentes.forEach(sessao => {
            const li = document.createElement('li');
            li.className = 'session-item';
            const onclickAction = sessao.link ? `window.open('${sessao.link}', '_blank')` : `alert('Link não cadastrado.')`;
            li.innerHTML = `
                <div class="session-time">${sessao.hora_sessao.substring(0, 5)}</div>
                <div class="session-details">
                    <strong>${sessao.nome_paciente}</strong>
                    <span>Sessão de Terapia</span>
                </div>
                <button class="btn-action" onclick="${onclickAction}">Iniciar</button>
            `;
            lista.appendChild(li);
        });
    } catch (error) { console.error(error); }
}

/**
 * Identifica sessões que já ocorreram mas não possuem evolução registrada
 */
async function carregarPendenciasEvolucao() {
    const lista = document.getElementById('listaSessoesSemEvolucao');
    if (!lista) return;

    try {
        // 1. Busca todas as sessões e todas as evoluções
        const [resAgenda, resEvol] = await Promise.all([
            fetch(API_AGENDA, { headers: getAuthHeaders() }),
            fetch('http://localhost:3000/api/evolucoes', { headers: getAuthHeaders() })
        ]);

        const agenda = await resAgenda.json();
        const evolucoes = await resEvol.json();

        const agora = new Date();
        const hojeStr = agora.toISOString().split('T')[0];

        // 2. Filtra sessões passadas ou de hoje (que já deveriam ter ocorrido) 
        // e que não possuem uma evolução com a mesma data e paciente
        const pendencias = agenda.filter(sessao => {
            // Só sessões 'Agendada' ou 'Realizada' (ignoramos Faltas/Canceladas para evoluções)
            if (sessao.status === 'Falta' || sessao.status === 'Cancelada') return false;

            // Verifica se a sessão é no passado ou hoje
            const dataSessao = new Date(sessao.data_sessao + 'T' + sessao.hora_sessao);
            if (dataSessao > agora) return false;

            // Verifica se já existe evolução para este paciente nesta data
            const jaEvoluiu = evolucoes.some(e => 
                e.id_paciente === sessao.id_paciente && 
                e.data_sessao.split('T')[0] === sessao.data_sessao
            );

            return !jaEvoluiu;
        });

        // 3. Renderiza
        lista.innerHTML = '';
        if (pendencias.length === 0) {
            lista.innerHTML = `
                <div class="empty-state">
                    <p>Parabéns! Todas as evoluções estão em dia.</p>
                    <i class="fas fa-check-circle" style="color: #22c55e; font-size: 2rem; margin-top: 10px;"></i>
                </div>`;
            return;
        }

        // Mostra as 5 mais recentes pendentes
        pendencias.slice(0, 5).forEach(p => {
            const li = document.createElement('li');
            li.className = 'session-item';
            const [ano, mes, dia] = p.data_sessao.split('-');
            
            li.innerHTML = `
                <div class="session-time" style="font-size: 0.75rem; line-height: 1.2;">
                    ${dia}/${mes}<br>${p.hora_sessao.substring(0, 5)}
                </div>
                <div class="session-details">
                    <strong>${p.nome_paciente}</strong>
                    <span>Evolução pendente</span>
                </div>
                <button class="btn-action" onclick="window.location.href='nova-evolucao.html?id=${p.id_paciente}&data=${p.data_sessao}'">Escrever</button>
            `;
            lista.appendChild(li);
        });

    } catch (error) {
        console.error("Erro ao carregar pendências de evolução:", error);
    }
}
