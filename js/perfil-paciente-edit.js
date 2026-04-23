/**
 * LEVEMENTE - Editar Perfil do Paciente
 */

let pacienteId = null;

document.addEventListener("DOMContentLoaded", () => {
    configurarMascarasEdit();
    carregarDadosPaciente();
    configurarFormularioEdit();
});

async function carregarDadosPaciente() {
    const params = new URLSearchParams(window.location.search);
    pacienteId = params.get('id');

    if (!pacienteId) {
        alert("ID do paciente não informado.");
        window.location.href = "pacientes.html";
        return;
    }

    document.getElementById('btnCancelar').onclick = () => {
        window.location.href = `perfil-paciente.html?id=${pacienteId}`;
    };

    try {
        const res = await fetch(`http://localhost:3000/api/pacientes/${pacienteId}`);
        if (!res.ok) throw new Error('Erro ao buscar paciente');
        const p = await res.json();

        // Configura o link de voltar com o nome real
        const linkVoltar = document.getElementById('link-voltar-perfil');
        if (linkVoltar) {
            linkVoltar.textContent = p.nome_completo;
            linkVoltar.href = `perfil-paciente.html?id=${pacienteId}`;
        }

        // Preenche os campos
        document.getElementById('nome_completo').value = p.nome_completo || '';
        document.getElementById('email').value = p.email || '';
        document.getElementById('cpf').value = p.cpf || '';
        document.getElementById('data_nascimento').value = p.data_nascimento || ''; // Já vem YYYY-MM-DD da API
        document.getElementById('estado_civil').value = p.estado_civil || '';
        document.getElementById('escolaridade').value = p.escolaridade || '';
        document.getElementById('profissao').value = p.profissao || '';
        document.getElementById('telefone').value = p.telefone || '';
        document.getElementById('endereco').value = p.endereco || '';
        document.getElementById('contato_emergencia').value = p.contato_emergencia || '';
        document.getElementById('status').value = p.status || 'Ativo';
        
        document.getElementById('queixa_principal').value = p.queixa_principal || '';
        document.getElementById('historico_familiar').value = p.historico_familiar || '';
        document.getElementById('medicacoes_em_uso').value = p.medicacoes_em_uso || '';

    } catch (err) {
        console.error(err);
        alert('Não foi possível carregar os dados para edição.');
        window.location.href = `perfil-paciente.html?id=${pacienteId}`;
    }
}

function configurarFormularioEdit() {
    const form = document.getElementById('formEditPaciente');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btnSalvar = document.getElementById('btnSalvar');
        btnSalvar.disabled = true;
        btnSalvar.textContent = 'Salvando...';

        const payload = {
            nome_completo: document.getElementById('nome_completo').value.trim(),
            email: document.getElementById('email').value.trim(),
            cpf: document.getElementById('cpf').value.trim(),
            data_nascimento: document.getElementById('data_nascimento').value || null,
            estado_civil: document.getElementById('estado_civil').value,
            escolaridade: document.getElementById('escolaridade').value.trim(),
            profissao: document.getElementById('profissao').value.trim(),
            telefone: document.getElementById('telefone').value.trim(),
            endereco: document.getElementById('endereco').value.trim(),
            contato_emergencia: document.getElementById('contato_emergencia').value.trim(),
            status: document.getElementById('status').value,
            queixa_principal: document.getElementById('queixa_principal').value.trim(),
            historico_familiar: document.getElementById('historico_familiar').value.trim(),
            medicacoes_em_uso: document.getElementById('medicacoes_em_uso').value.trim()
        };

        try {
            const res = await fetch(`http://localhost:3000/api/pacientes/${pacienteId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                alert(data.erro || 'Erro ao salvar alterações.');
                return;
            }

            // Sucesso
            window.location.href = `perfil-paciente.html?id=${pacienteId}`;

        } catch (err) {
            console.error(err);
            alert('Não foi possível conectar ao servidor.');
        } finally {
            btnSalvar.disabled = false;
            btnSalvar.textContent = 'Salvar Alterações';
        }
    });
}

// Máscaras (reaproveitadas do pacientes.js simplificadas)
function configurarMascarasEdit() {
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
