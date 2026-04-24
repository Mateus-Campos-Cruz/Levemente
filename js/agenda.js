/**
 * LEVEMENTE - Gestão de Agenda
 */

const API_AGENDA = 'http://localhost:3000/api/agenda';
const API_PACIENTES = 'http://localhost:3000/api/pacientes';

let currentYear, currentMonth;
let agendaData = [];
let selectedDate = null;

document.addEventListener("DOMContentLoaded", () => {
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();
    
    // Seleciona o dia atual por padrão
    selectedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    inicializarFiltros();
    carregarPacientesNoSelect();
    inicializarAgenda();
    configurarFormularioAgenda();
    
    // Listeners de Navegação
    document.getElementById('prevMonth').addEventListener('click', () => navegarMes(-1));
    document.getElementById('nextMonth').addEventListener('click', () => navegarMes(1));
    document.getElementById('selectMonth').addEventListener('change', (e) => {
        currentMonth = parseInt(e.target.value);
        renderizarCalendario();
    });
    document.getElementById('selectYear').addEventListener('change', (e) => {
        currentYear = parseInt(e.target.value);
        renderizarCalendario();
    });
});

async function inicializarAgenda() {
    await renderizarCalendario();
    exibirDetalhesDia(selectedDate);
}

// --- INICIALIZAÇÃO ---

function inicializarFiltros() {
    const selectYear = document.getElementById('selectYear');
    const selectMonth = document.getElementById('selectMonth');
    
    // Popula anos (5 anos para trás e 5 para frente)
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
    renderizarCalendario();
}

// --- CALENDÁRIO ---

async function renderizarCalendario() {
    const grid = document.querySelector('.calendar-grid');
    const display = document.getElementById('current-month-display');
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    
    display.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    grid.innerHTML = '';

    // Lógica de dias
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevDaysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    // Dias do mês anterior
    for (let i = firstDay; i > 0; i--) {
        const div = document.createElement('div');
        div.className = 'day day-off';
        div.textContent = prevDaysInMonth - i + 1;
        grid.appendChild(div);
    }

    // Dias do mês atual
    await buscarAgenda(); // Carrega dados da API

    for (let i = 1; i <= daysInMonth; i++) {
        const div = document.createElement('div');
        div.className = 'day';
        
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        // Verifica se é hoje
        const hoje = new Date();
        if (i === hoje.getDate() && currentMonth === hoje.getMonth() && currentYear === hoje.getFullYear()) {
            div.classList.add('today');
        }

        // Verifica se está selecionado
        if (selectedDate === dateStr) {
            div.classList.add('selected');
        }

        div.innerHTML = i;
        
        // Verifica sessões
        const temSessao = agendaData.some(s => s.data_sessao === dateStr);
        if (temSessao) {
            const dot = document.createElement('span');
            dot.className = 'event-dot';
            div.appendChild(dot);
        }

        div.addEventListener('click', () => selecionarDia(dateStr));
        grid.appendChild(div);
    }

    // Completa o grid (dias do próximo mês)
    const totalCells = 42; // 6 linhas x 7 dias
    const remainingCells = totalCells - grid.children.length;
    for (let i = 1; i <= remainingCells; i++) {
        const div = document.createElement('div');
        div.className = 'day day-off';
        div.textContent = i;
        grid.appendChild(div);
    }
}

async function buscarAgenda() {
    try {
        const res = await fetch(API_AGENDA, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error("Falha ao carregar agenda");
        agendaData = await res.json();
    } catch (err) {
        console.error(err);
    }
}

function selecionarDia(dateStr) {
    selectedDate = dateStr;
    renderizarCalendario();
    exibirDetalhesDia(dateStr);
}

function exibirDetalhesDia(dateStr) {
    const container = document.getElementById('day-details-container');
    const sessoesDia = agendaData.filter(s => s.data_sessao === dateStr);
    
    const [ano, mes, dia] = dateStr.split('-');
    const dataFormatada = `${dia}/${mes}/${ano}`;

    let html = `<h3>Sessões em ${dataFormatada}</h3>`;

    if (sessoesDia.length === 0) {
        html += `<p class="no-events">Nenhuma sessão agendada para este dia.</p>`;
    } else {
        sessoesDia.forEach(s => {
            html += `
                <div class="event-item">
                    <span class="status-indicator ${s.status.toLowerCase()}"></span>
                    <div class="info">
                        <strong>${s.nome_paciente}</strong>
                        <span>${s.hora_sessao.substring(0, 5)} - ${s.status}</span>
                    </div>
                    <div class="actions">
                        <button title="Remarcar"><i class="fas fa-sync-alt"></i></button>
                        <button title="Falta" class="btn-danger"><i class="fas fa-user-times"></i></button>
                    </div>
                </div>
            `;
        });
    }

    container.innerHTML = html;
}

// --- MODAL E FORMULÁRIO ---

async function carregarPacientesNoSelect() {
    const select = document.getElementById('paciente_id');
    if (!select) return;

    try {
        const res = await fetch(API_PACIENTES, { headers: getAuthHeaders() });
        const pacientes = await res.json();
        
        pacientes.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id_paciente;
            opt.textContent = p.nome_completo;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error("Erro ao carregar pacientes:", err);
    }
}

function configurarFormularioAgenda() {
    const form = document.getElementById('formNovaSessao');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            id_paciente: document.getElementById('paciente_id').value,
            data_sessao: document.getElementById('data_sessao').value,
            hora_sessao: document.getElementById('hora_sessao').value,
            status: 'Agendada'
        };

        try {
            const res = await fetch(API_AGENDA, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Erro ao agendar');

            // Feedback de sucesso com maestria
            closeModal('eventModal');
            form.reset();
            
            // Recarrega agenda e renderiza novamente para mostrar a bolinha rosa
            await buscarAgenda();
            renderizarCalendario();

            // Se o dia da nova sessão for o que está selecionado, atualiza os detalhes
            if (selectedDate === payload.data_sessao) {
                exibirDetalhesDia(selectedDate);
            }

            alert('Sessão agendada com sucesso!');
            
        } catch (err) {
            alert('Falha ao agendar sessão.');
            console.error(err);
        }
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 300);
}

window.onclick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        const modalId = e.target.id;
        closeModal(modalId);
    }
};
