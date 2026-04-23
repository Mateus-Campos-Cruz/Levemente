/**
 * LEVEMENTE - Dashboard
 * Lógica para popular dados dinâmicos do Dashboard
 */

const API_DASH_STATS = 'http://localhost:3000/api/dashboard/stats';
const API_AGENDA = 'http://localhost:3000/api/agenda';

document.addEventListener("DOMContentLoaded", () => {
    carregarEstatisticas();
    carregarSessoesPendentes();
});

/**
 * Busca estatísticas gerais (Ativos, Sessões Hoje, Faturamento)
 */
async function carregarEstatisticas() {
    try {
        const res = await fetch(API_DASH_STATS);
        if (!res.ok) throw new Error('Erro ao buscar estatísticas');
        const stats = await res.json();

        // 1. Pacientes Ativos
        const elAtivos = document.getElementById('total-pacientes-ativos');
        if (elAtivos) elAtivos.textContent = stats.pacientesAtivos;

        // 2. Sessões Hoje
        const elSessoesHoje = document.getElementById('total-sessoes-hoje');
        if (elSessoesHoje) elSessoesHoje.textContent = stats.sessoesHoje;

        // 3. Faturamento Mês
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
async function carregarSessoesPendentes() {
    const lista = document.getElementById('lista-sessoes-pendentes');
    if (!lista) return;

    try {
        const res = await fetch(API_AGENDA);
        if (!res.ok) throw new Error('Erro ao buscar agenda');
        const agenda = await res.json();

        // Filtra apenas agendamentos de hoje com status 'Agendada'
        const hoje = new Date().toISOString().split('T')[0];
        const sessoesPendentes = agenda.filter(item => 
            item.data_sessao === hoje && item.status === 'Agendada'
        );

        lista.innerHTML = '';

        if (sessoesPendentes.length === 0) {
            lista.innerHTML = `
                <li class="session-item" style="justify-content: center; color: #64748b; padding: 20px; font-size: 0.9rem;">
                    Nenhuma sessão pendente para hoje.
                </li>`;
            return;
        }

        sessoesPendentes.forEach(sessao => {
            const li = document.createElement('li');
            li.className = 'session-item';
            li.innerHTML = `
                <div class="session-time">${sessao.hora_sessao.substring(0, 5)}</div>
                <div class="session-details">
                    <strong>${sessao.nome_paciente}</strong>
                    <span>Sessão de Terapia</span>
                </div>
                <button class="btn-action" onclick="iniciarSessao(${sessao.id_agenda})">Iniciar</button>
            `;
            lista.appendChild(li);
        });

    } catch (error) {
        console.error("Erro ao carregar sessões pendentes:", error);
        lista.innerHTML = `<li class="session-item" style="justify-content: center; color: #64748b; padding: 20px; font-size: 0.9rem;">
            Não existem sessões agendadas para hoje.
        </li>`;
    }
}

/**
 * Placeholder para iniciar sessão (futura implementação)
 */
function iniciarSessao(id) {
    alert(`Iniciando sessão ID: ${id}. Funcionalidade em desenvolvimento.`);
}
