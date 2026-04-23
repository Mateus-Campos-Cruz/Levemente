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
    document.getElementById('profile-cpf').textContent = paciente.cpf || 'Não informado';
    document.getElementById('profile-telefone').textContent = paciente.telefone || 'Não informado';
    
    document.getElementById('profile-contato-emergencia').textContent = paciente.contato_emergencia || 'Não informado';

    // Novos Campos Cadastrais
    document.getElementById('profile-profissao').textContent = paciente.profissao || 'Não informada';
    document.getElementById('profile-estado-civil').textContent = paciente.estado_civil || 'Não informado';
    document.getElementById('profile-escolaridade').textContent = paciente.escolaridade || 'Não informada';
    document.getElementById('profile-endereco').textContent = paciente.endereco || 'Não informado';

    // Anamnese
    document.getElementById('profile-queixa').textContent = paciente.queixa_principal || 'Não registrada.';
    document.getElementById('profile-historico').textContent = paciente.historico_familiar || 'Não registrado.';
    document.getElementById('profile-medicacoes').textContent = paciente.medicacoes_em_uso || 'Não registradas.';
    
    const textoAnamnese = document.getElementById('profile-anamnese-texto');
    const emptyAction = document.getElementById('anamnese-empty-action');
    
    if (paciente.anamnese_texto && paciente.anamnese_texto.trim() !== '') {
        textoAnamnese.textContent = paciente.anamnese_texto;
        emptyAction.style.display = 'none';
    } else {
        textoAnamnese.textContent = '';
        emptyAction.style.display = 'block';
    }

    // Botões de Ação
    document.getElementById('btnEditarPerfil').onclick = () => {
        window.location.href = `perfil-paciente-edit.html?id=${paciente.id_paciente}`;
    };

    document.getElementById('btnEvolucoes').onclick = () => {
        window.location.href = `evolucao.html?id=${paciente.id_paciente}`;
    };
}

function switchTab(tab) {
    const btnCadastrais = document.getElementById('tab-cadastrais');
    const btnAnamnese = document.getElementById('tab-anamnese');
    const contentCadastrais = document.getElementById('content-cadastrais');
    const contentAnamnese = document.getElementById('content-anamnese');

    if (tab === 'cadastrais') {
        btnCadastrais.classList.add('active');
        btnAnamnese.classList.remove('active');
        contentCadastrais.style.display = 'block';
        contentAnamnese.style.display = 'none';
    } else {
        btnAnamnese.classList.add('active');
        btnCadastrais.classList.remove('active');
        contentAnamnese.style.display = 'block';
        contentCadastrais.style.display = 'none';
    }
}

function irParaEdicao() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
        window.location.href = `perfil-paciente-edit.html?id=${id}`;
    }
}
