/**
 * LEVEMENTE - Perfil do Paciente
 * Lógica para buscar os dados de um paciente via API REST e popular a interface
 */

document.addEventListener("DOMContentLoaded", () => {
    carregarPerfilPaciente();
});

async function carregarPerfilPaciente() {
    // Pega o ID da URL (?id=...)
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        alert("ID do paciente não informado.");
        window.location.href = "pacientes.html";
        return;
    }

    try {
        const res = await fetch(`http://localhost:3000/api/pacientes/${id}`);
        
        if (!res.ok) {
            throw new Error('Erro ao buscar dados do paciente.');
        }

        const paciente = await res.json();
        popularDadosNaTela(paciente);

    } catch (err) {
        console.error(err);
        alert("Não foi possível carregar os dados do paciente.");
        window.location.href = "pacientes.html";
    }
}

function popularDadosNaTela(paciente) {
    // Trata iniciais
    const iniciais = (paciente.nome_completo || '')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

    // Tratamento de Data de Nascimento e Idade
    let idadeStr = "-- anos";
    let nascStr = "--/--/----";
    if (paciente.data_nascimento) {
        // formato retornado do banco: YYYY-MM-DD
        const dataNasc = new Date(paciente.data_nascimento + 'T00:00:00'); // Evita timezone offset issues
        const dataAtual = new Date();
        
        let idade = dataAtual.getFullYear() - dataNasc.getFullYear();
        const m = dataAtual.getMonth() - dataNasc.getMonth();
        if (m < 0 || (m === 0 && dataAtual.getDate() < dataNasc.getDate())) {
            idade--;
        }

        idadeStr = `${idade} anos`;
        nascStr = dataNasc.toLocaleDateString('pt-BR');
    }

    // Status
    const statusClass = paciente.status === 'Ativo' ? 'active' : 'inactive';

    // Popular DOM
    document.getElementById('breadcrumb-nome').textContent = paciente.nome_completo;
    document.getElementById('profile-nome').textContent = paciente.nome_completo;
    document.getElementById('profile-iniciais').textContent = iniciais;
    
    const statusEl = document.getElementById('profile-status');
    statusEl.textContent = paciente.status;
    statusEl.className = `status-tag ${statusClass}`;

    document.getElementById('profile-idade').textContent = idadeStr;
    document.getElementById('profile-nascimento').textContent = nascStr;
    document.getElementById('profile-cpf').textContent = paciente.cpf;
    document.getElementById('profile-telefone').textContent = paciente.telefone || 'Não informado';
    
    document.getElementById('profile-contato-emergencia').textContent = paciente.contato_emergencia || 'Não informado';
}
