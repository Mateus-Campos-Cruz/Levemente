/**
 * LEVEMENTE - Gestão de Agenda
 */

const API_AGENDA = 'http://localhost:3000/api/agenda';
const API_PACIENTES = 'http://localhost:3000/api/pacientes';

document.addEventListener("DOMContentLoaded", () => {
    carregarPacientesNoSelect();
    carregarAgenda();
    configurarFormularioAgenda();
});

// --- MODAL ---

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

window.onclick = (e) => {
    if (e.target.classList.contains('modal')) e.target.style.display = 'none';
};

// --- CORE ---

async function carregarPacientesNoSelect() {
    const select = document.getElementById('paciente_id');
    if (!select) return;

    try {
        const res = await fetch(API_PACIENTES);
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

async function carregarAgenda() {
    // Implementação básica: No momento apenas mostra um log ou popula a lista se houver
    // Para "maestria", poderíamos popular o grid do calendário. 
    // Por ora, vamos focar na funcionalidade de persistência.
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Erro ao agendar');

            alert('Sessão agendada com sucesso!');
            closeModal('eventModal');
            form.reset();
            
            // Se estivermos no dashboard, ele atualizaria no reload ou via evento.
            // Aqui poderíamos recarregar a lista da agenda.
            
        } catch (err) {
            alert('Falha ao agendar sessão.');
            console.error(err);
        }
    });
}
