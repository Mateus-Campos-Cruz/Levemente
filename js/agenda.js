/**
 * LEVEMENTE - Gestão de Agenda
 */

const API_AGENDA = 'http://localhost:3000/api/agenda';
const API_PACIENTES = 'http://localhost:3000/api/pacientes';

let currentYear, currentMonth;
let agendaData = [];
let listaPacientes = []; // Cache para busca dinâmica
let selectedDate = null;

document.addEventListener("DOMContentLoaded", () => {
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();
    
    // Seleciona o dia atual por padrão
    selectedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    inicializarFiltros();
    carregarPacientes();
    configurarBuscaPaciente();
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

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevDaysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    for (let i = firstDay; i > 0; i--) {
        const div = document.createElement('div');
        div.className = 'day day-off';
        div.textContent = prevDaysInMonth - i + 1;
        grid.appendChild(div);
    }

    await buscarAgenda();

    for (let i = 1; i <= daysInMonth; i++) {
        const div = document.createElement('div');
        div.className = 'day';
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const hoje = new Date();
        const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
        
        if (dateStr === hojeStr) div.classList.add('today');
        if (selectedDate === dateStr) div.classList.add('selected');

        div.innerHTML = i;
        const temSessao = agendaData.some(s => s.data_sessao === dateStr);
        if (temSessao) {
            const dot = document.createElement('span');
            dot.className = 'event-dot';
            div.appendChild(dot);
        }
        div.addEventListener('click', () => selecionarDia(dateStr));
        grid.appendChild(div);
    }

    const totalCells = 42;
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
        agendaData = await res.json();
    } catch (err) { console.error(err); }
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
                        <button title="Remarcar" onclick='abrirModalEdicao(${JSON.stringify(s)})'><i class="fas fa-sync-alt"></i></button>
                        <button title="Falta" class="btn-danger" onclick="marcarFalta(${s.id_agenda})"><i class="fas fa-user-times"></i></button>
                    </div>
                </div>
            `;
        });
    }
    container.innerHTML = html;
}

// --- BUSCA DE PACIENTES ---

async function carregarPacientes() {
    try {
        const res = await fetch(API_PACIENTES, { headers: getAuthHeaders() });
        listaPacientes = await res.json();
    } catch (err) { console.error(err); }
}

function configurarBuscaPaciente() {
    const inputSearch = document.getElementById('paciente_search');
    const inputId = document.getElementById('paciente_id');
    const resultsContainer = document.getElementById('paciente_results');

    if (!inputSearch || !resultsContainer) return;

    inputSearch.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        if (!termo) {
            inputId.value = "";
            resultsContainer.classList.remove('active');
            return;
        }
        const filtrados = listaPacientes.filter(p => p.nome_completo.toLowerCase().includes(termo));
        renderizarResultadosBusca(filtrados);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select-container')) resultsContainer.classList.remove('active');
    });
}

function renderizarResultadosBusca(pacientes) {
    const container = document.getElementById('paciente_results');
    container.innerHTML = '';
    if (pacientes.length === 0) {
        container.innerHTML = '<div class="result-item no-results">Nenhum paciente encontrado</div>';
    } else {
        pacientes.forEach(p => {
            const div = document.createElement('div');
            div.className = 'result-item';
            div.textContent = p.nome_completo;
            div.onclick = () => selecionarPaciente(p);
            container.appendChild(div);
        });
    }
    container.classList.add('active');
}

function selecionarPaciente(paciente) {
    document.getElementById('paciente_search').value = paciente.nome_completo;
    document.getElementById('paciente_id').value = paciente.id_paciente;
    document.getElementById('paciente_results').classList.remove('active');
}

// --- FORMULÁRIO ---

function configurarFormularioAgenda() {
    const form = document.getElementById('formNovaSessao');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const idEdit = document.getElementById('id_agenda_edit').value;
        const dataS = document.getElementById('data_sessao').value;
        const horaS = document.getElementById('hora_sessao').value;
        
        if (new Date(`${dataS}T${horaS}`) < new Date()) {
            alert('Não é possível agendar sessões em datas ou horários passados.');
            return;
        }

        const payload = {
            id_paciente: document.getElementById('paciente_id').value,
            data_sessao: dataS,
            hora_sessao: horaS,
            link: document.getElementById('link_sessao').value || null,
            status: 'Agendada'
        };

        if (!payload.id_paciente) {
            alert('Selecione um paciente válido da lista.');
            return;
        }

        try {
            const url = idEdit ? `${API_AGENDA}/${idEdit}` : API_AGENDA;
            const res = await fetch(url, {
                method: idEdit ? 'PUT' : 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Erro ao salvar');
            closeModal('eventModal');
            form.reset();
            await buscarAgenda();
            renderizarCalendario();
            if (selectedDate === payload.data_sessao) exibirDetalhesDia(selectedDate);
            alert(idEdit ? 'Sessão remarcada!' : 'Sessão agendada!');
        } catch (err) { alert('Falha ao agendar.'); }
    });
}

function abrirModalEdicao(sessao) {
    document.getElementById('id_agenda_edit').value = sessao.id_agenda;
    document.getElementById('paciente_id').value = sessao.id_paciente;
    document.getElementById('paciente_search').value = sessao.nome_paciente;
    document.getElementById('data_sessao').value = sessao.data_sessao;
    document.getElementById('hora_sessao').value = sessao.hora_sessao.substring(0, 5);
    document.getElementById('link_sessao').value = sessao.link || '';
    document.querySelector('.modal-header h3').textContent = 'Remarcar Sessão';
    openModal('eventModal');
}

function abrirNovoAgendamento() {
    const form = document.getElementById('formNovaSessao');
    form.reset();
    document.getElementById('id_agenda_edit').value = '';
    document.getElementById('paciente_id').value = '';
    document.getElementById('paciente_search').value = '';
    document.querySelector('.modal-header h3').textContent = 'Novo Agendamento';
    if (selectedDate) document.getElementById('data_sessao').value = selectedDate;
    openModal('eventModal');
}

async function marcarFalta(id) {
    if (!confirm('Deseja marcar falta?')) return;
    try {
        await fetch(`${API_AGENDA}/${id}/status`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: 'Falta' })
        });
        await buscarAgenda();
        renderizarCalendario();
        exibirDetalhesDia(selectedDate);
    } catch (err) { console.error(err); }
}

function openModal(modalId) {
    const m = document.getElementById(modalId);
    m.style.display = 'flex';
    setTimeout(() => m.classList.add('active'), 10);
}

function closeModal(modalId) {
    const m = document.getElementById(modalId);
    m.classList.remove('active');
    setTimeout(() => m.style.display = 'none', 300);
}

window.onclick = (e) => { if (e.target.classList.contains('modal-overlay')) closeModal(e.target.id); };
