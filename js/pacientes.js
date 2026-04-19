/**
 * LEVEMENTE - Gestão de Pacientes
 * Lógica de Filtro, Cadastro, Máscaras e Persistência Local
 */

document.addEventListener("DOMContentLoaded", () => {
    // Inicialização
    carregarPacientes();
    configurarMascaras();
    configurarFiltro();
    configurarFormulario();
});

// --- FUNÇÕES DE NAVEGAÇÃO (MODAL) ---
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "block";
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "none";
}

// Fecha o modal ao clicar fora da área útil
window.onclick = (event) => {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
};

// --- CORE DA APLICAÇÃO ---

function configurarFormulario() {
    const form = document.getElementById('formNovoPaciente');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const novoPaciente = {
            id: Date.now(), // ID único para controle futuro
            nome: formData.get('nome'),
            cpf: formData.get('cpf'),
            status: formData.get('status'),
            telefone: formData.get('telefone'),
            ultimaSessao: '---'
        };

        // Persistência e Interface
        salvarPacienteLocal(novoPaciente);
        adicionarPacienteTabela(novoPaciente);
        
        // Limpeza
        closeModal('patientModal');
        form.reset();
        alert("Paciente cadastrado com sucesso!");
    });
}

function configurarFiltro() {
    const inputBusca = document.getElementById('inputBusca');
    const tabela = document.getElementById('tabelaPacientes');

    if (!inputBusca || !tabela) return;

    inputBusca.addEventListener('input', () => {
        const termo = inputBusca.value.toLowerCase();
        const linhas = tabela.getElementsByClassName('paciente-row');

        Array.from(linhas).forEach(linha => {
            const visivel = linha.textContent.toLowerCase().includes(termo);
            linha.style.display = visivel ? "" : "none";
        });
    });
}

// --- PERSISTÊNCIA (LOCAL STORAGE) ---

function salvarPacienteLocal(paciente) {
    const pacientes = JSON.parse(localStorage.getItem('levemente_pacientes')) || [];
    pacientes.push(paciente);
    localStorage.setItem('levemente_pacientes', JSON.stringify(pacientes));
}

function carregarPacientes() {
    const pacientes = JSON.parse(localStorage.getItem('levemente_pacientes')) || [];
    // Adiciona os pacientes salvos, mas mantém os que já estiverem no HTML (se houver)
    pacientes.forEach(p => adicionarPacienteTabela(p));
}

// --- INTERFACE (DOM) ---

function adicionarPacienteTabela(paciente) {
    const tabela = document.getElementById('tabelaPacientes');
    if (!tabela) return;

    const iniciais = paciente.nome
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    
    const novaLinha = document.createElement('tr');
    novaLinha.className = 'paciente-row';
    novaLinha.innerHTML = `
        <td class="patient-info">
            <div class="avatar-small">${iniciais}</div>
            <div>
                <strong>${paciente.nome}</strong>
                <span>${paciente.telefone}</span>
            </div>
        </td>
        <td>${paciente.cpf}</td>
        <td class="hide-tablet">${paciente.ultimaSessao || '---'}</td>
        <td><span class="status-tag ${paciente.status.toLowerCase()}">${paciente.status}</span></td>
        <td class="actions">
            <button class="btn-icon" title="Prontuário"><i class="fas fa-file-medical"></i></button>
            <button class="btn-icon" title="Editar"><i class="fas fa-edit"></i></button>
        </td>
    `;
    
    tabela.prepend(novaLinha);
}

// --- UTILITÁRIOS (MÁSCARAS) ---

function configurarMascaras() {
    const inputCpf = document.getElementById('cpf');
    const inputTel = document.getElementById('telefone');

    if (inputCpf) {
        inputCpf.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, '');
            v = v.replace(/(\d{3})(\d)/, '$1.$2');
            v = v.replace(/(\d{3})(\d)/, '$1.$2');
            v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            e.target.value = v.substring(0, 14);
        });
    }

    if (inputTel) {
        inputTel.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, '');
            v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
            v = v.replace(/(\d)(\d{4})$/, '$1-$2');
            e.target.value = v.substring(0, 15);
        });
    }
}