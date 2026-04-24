/**
 * LEVEMENTE - Gestão de Pacientes
 * Lógica de Filtro, Cadastro, Máscaras e Persistência via API REST
 */

const API_URL = 'http://localhost:3000/api/pacientes';

document.addEventListener("DOMContentLoaded", () => {
    carregarPacientes();
    configurarMascaras();
    configurarFiltro();
    configurarFormulario();
});

// --- MODAL ---

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "block";
    }
}

function abrirModalNovoPaciente() {
    const form = document.getElementById('formNovoPaciente');
    if (form) form.reset();
    document.getElementById('pacienteId').value = '';
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-user-plus"></i> Novo Paciente';
    openModal('patientModal');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "none";
}

window.onclick = (event) => {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
};

// --- CORE DA APLICAÇÃO ---

async function configurarFormulario() {
    const form = document.getElementById('formNovoPaciente');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btnSalvar = form.querySelector('button[type="submit"]');
        btnSalvar.disabled = true;
        btnSalvar.textContent = 'Salvando...';

        const pacienteId = document.getElementById('pacienteId').value;
        const method = pacienteId ? 'PUT' : 'POST';
        const url = pacienteId ? `${API_URL}/${pacienteId}` : API_URL;

        const payload = {
            nome_completo: document.getElementById('nome').value.trim(),
            email:         document.getElementById('email').value.trim(),
            cpf:           document.getElementById('cpf').value.trim(),
            telefone:      document.getElementById('telefone').value.trim(),
            status:        document.getElementById('status').value,
        };

        try {
            const res = await fetch(url, {
                method: method,
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.erro || 'Erro ao salvar paciente.');
                return;
            }

            if (pacienteId) {
                // Atualiza a linha existente
                const trExistente = document.querySelector(`tr[data-id="${pacienteId}"]`);
                if (trExistente) {
                    trExistente.remove();
                }
                adicionarPacienteTabela(data);
                // Não muda o contador pois é edição
            } else {
                // Adiciona nova linha
                adicionarPacienteTabela(data);
                atualizarContador(1);
            }

            closeModal('patientModal');
            form.reset();
            document.getElementById('pacienteId').value = '';

        } catch (err) {
            alert('Não foi possível conectar ao servidor. Verifique se o server.js está rodando.');
            console.error(err);
        } finally {
            btnSalvar.disabled = false;
            btnSalvar.textContent = 'Salvar Paciente';
        }
    });
}

function configurarFiltro() {
    const inputBusca = document.getElementById('inputBusca');
    const tabela = document.getElementById('tabelaPacientes');
    if (!inputBusca || !tabela) return;

    inputBusca.addEventListener('input', () => {
        const termo = inputBusca.value.toLowerCase();
        Array.from(tabela.getElementsByClassName('paciente-row')).forEach(linha => {
            linha.style.display = linha.textContent.toLowerCase().includes(termo) ? '' : 'none';
        });
    });
}

// --- API ---

async function carregarPacientes() {
    const tabela = document.getElementById('tabelaPacientes');
    if (!tabela) return;

    // Limpa linhas estáticas de exemplo
    tabela.innerHTML = `
        <tr id="loading-row">
            <td colspan="5" style="text-align:center; padding: 30px; color: #64748b;">
                <i class="fas fa-spinner fa-spin"></i> Carregando pacientes...
            </td>
        </tr>`;

    try {
        const res = await fetch(API_URL, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Resposta inválida do servidor.');

        const pacientes = await res.json();
        tabela.innerHTML = ''; // Limpa o loading

        if (pacientes.length === 0) {
            tabela.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; padding: 30px; color: #64748b;">
                        Nenhum paciente cadastrado ainda.
                    </td>
                </tr>`;
        } else {
            pacientes.forEach(p => adicionarPacienteTabela(p));
        }

        // Atualiza o badge com total real
        const badge = document.querySelector('.badge-count');
        if (badge) badge.textContent = `${pacientes.length} Total`;

    } catch (err) {
        tabela.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding: 30px; color: #ef4444;">
                    <i class="fas fa-exclamation-triangle"></i>
                    Erro ao conectar ao servidor. Certifique-se de que o <strong>server.js</strong> está rodando.
                </td>
            </tr>`;
        console.error('Erro ao carregar pacientes:', err);
    }
}

// --- DOM ---

function adicionarPacienteTabela(paciente) {
    const tabela = document.getElementById('tabelaPacientes');
    if (!tabela) return;

    // Gera iniciais a partir do nome_completo (coluna do banco)
    const iniciais = (paciente.nome_completo || '')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

    // Última sessão virá de evolucoes no futuro; por ora exibe data_cadastro
    const ultimaSessao = paciente.ultima_sessao || paciente.data_cadastro || '---';

    const statusClass = paciente.status === 'Ativo' ? 'active' : 'inactive';

    const tr = document.createElement('tr');
    tr.className = 'paciente-row';
    tr.dataset.id = paciente.id_paciente;
    tr.innerHTML = `
        <td class="patient-info">
            <div class="avatar-small">${iniciais}</div>
            <div>
                <strong>${paciente.nome_completo}</strong>
                <span>${paciente.telefone || '—'}</span>
            </div>
        </td>
        <td>${paciente.cpf}</td>
        <td class="hide-tablet">${ultimaSessao}</td>
        <td><span class="status-tag ${statusClass}">${paciente.status}</span></td>
        <td class="actions">
            <button class="btn-icon" title="Prontuário" onclick="abrirProntuario(${paciente.id_paciente})">
                <i class="fas fa-file-medical"></i>
            </button>
            <button class="btn-icon" title="Editar" onclick="editarPaciente(${paciente.id_paciente})">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon danger" title="Excluir" onclick="confirmarDelete(${paciente.id_paciente}, '${(paciente.nome_completo || '').replace(/'/g, String.fromCharCode(92, 39))}')">
                <i class="fas fa-trash-alt"></i>
            </button>
        </td>
    `;

    tabela.prepend(tr);
}

function atualizarContador(delta) {
    const badge = document.querySelector('.badge-count');
    if (!badge) return;
    const atual = parseInt(badge.textContent) || 0;
    badge.textContent = `${Math.max(0, atual + delta)} Total`;
}

// --- DELETE COM MODAL DE CONFIRMAÇÃO ---

let _idParaExcluir = null;

function confirmarDelete(id, nome) {
    _idParaExcluir = id;
    document.getElementById('deleteNomePaciente').textContent = nome;

    // Recria o botão para evitar listeners duplicados
    const btnAntigo = document.getElementById('btnConfirmarDelete');
    const btnNovo = btnAntigo.cloneNode(true);
    btnAntigo.parentNode.replaceChild(btnNovo, btnAntigo);
    btnNovo.addEventListener('click', () => excluirPaciente(_idParaExcluir));

    openModal('deleteModal');
}

async function excluirPaciente(id) {
    const btn = document.getElementById('btnConfirmarDelete');
    btn.disabled = true;
    btn.textContent = 'Excluindo...';

    try {
        const res = await fetch(`http://localhost:3000/api/pacientes/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!res.ok) {
            const data = await res.json();
            alert(data.erro || 'Erro ao excluir paciente.');
            return;
        }

        // Animação de saída antes de remover do DOM
        const linha = document.querySelector(`tr[data-id="${id}"]`);
        if (linha) {
            linha.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            linha.style.opacity = '0';
            linha.style.transform = 'translateX(20px)';
            setTimeout(() => linha.remove(), 300);
        }

        atualizarContador(-1);
        closeModal('deleteModal');

    } catch (err) {
        alert('Não foi possível conectar ao servidor.');
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Excluir Paciente';
    }
}

// --- AÇÕES (stubs para implementação futura) ---

function abrirProntuario(id) {
    window.location.href = `perfil-paciente.html?id=${id}`;
}

async function editarPaciente(id) {
    try {
        const res = await fetch(`http://localhost:3000/api/pacientes/${id}`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Falha ao buscar paciente');
        const p = await res.json();

        // Preenche o form
        document.getElementById('pacienteId').value = p.id_paciente;
        document.getElementById('nome').value = p.nome_completo;
        document.getElementById('email').value = p.email || '';
        document.getElementById('cpf').value = p.cpf;
        document.getElementById('telefone').value = p.telefone || '';
        document.getElementById('status').value = p.status;

        // Muda título e abre
        document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Editar Paciente';
        openModal('patientModal');

    } catch(err) {
        alert('Erro ao carregar os dados do paciente.');
        console.error(err);
    }
}

// --- MÁSCARAS ---

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