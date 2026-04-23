/**
 * LEVEMENTE - Nova Evolução
 */

let pacienteId = null;

document.addEventListener("DOMContentLoaded", () => {
    carregarCabecalho();
    configurarFormulario();
});

async function carregarCabecalho() {
    const params = new URLSearchParams(window.location.search);
    pacienteId = params.get('id');

    if (!pacienteId) {
        alert("ID do paciente não informado.");
        window.location.href = "pacientes.html";
        return;
    }

    // Configura data padrão para hoje
    document.getElementById('data_sessao').value = new Date().toISOString().split('T')[0];

    // Configura botões de voltar
    document.getElementById('btnCancelar').onclick = () => {
        window.location.href = `evolucao.html?id=${pacienteId}`;
    };

    try {
        const res = await fetch(`http://localhost:3000/api/pacientes/${pacienteId}`);
        if (!res.ok) throw new Error('Erro ao buscar paciente');
        const p = await res.json();

        // Atualiza breadcrumb
        const linkPerfil = document.getElementById('link-evolucao-paciente');
        if (linkPerfil) {
            linkPerfil.textContent = p.nome_completo;
            linkPerfil.href = `evolucao.html?id=${pacienteId}`;
        }

        // Atualiza banner
        document.getElementById('banner-nome').textContent = p.nome_completo;
        document.getElementById('banner-cpf').textContent = `CPF: ${p.cpf || 'Não informado'}`;

    } catch (err) {
        console.error(err);
        alert('Erro ao carregar dados do paciente.');
    }
}

function configurarFormulario() {

    const form = document.getElementById('formNovaEvolucao');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btnSalvar = document.getElementById('btnSalvar');
        btnSalvar.disabled = true;
        btnSalvar.textContent = 'Salvando...';

        const payload = {
            id_paciente: pacienteId,
            data_sessao: document.getElementById('data_sessao').value,
            tipo_sessao: document.getElementById('tipo_sessao').value,
            tags: document.getElementById('tags').value.trim(),
            texto_evolucao: document.getElementById('texto_evolucao').value.trim()
        };

        try {
            const res = await fetch('http://localhost:3000/api/evolucoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                alert(data.erro || 'Erro ao salvar evolução.');
                return;
            }

            // Sucesso, volta para a lista
            window.location.href = `evolucao.html?id=${pacienteId}`;

        } catch (err) {
            console.error(err);
            alert('Não foi possível conectar ao servidor.');
        } finally {
            btnSalvar.disabled = false;
            btnSalvar.textContent = 'Salvar Evolução';
        }
    });
}
