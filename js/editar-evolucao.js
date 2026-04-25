/**
 * LEVEMENTE - Editar Evolução
 */

let evolucaoId = null;
let pacienteId = null;

document.addEventListener("DOMContentLoaded", () => {
    carregarEvolucao();
    configurarFormulario();
});

async function carregarEvolucao() {
    const params = new URLSearchParams(window.location.search);
    evolucaoId = params.get('id');

    if (!evolucaoId) {
        alert("ID da evolução não informado.");
        window.history.back();
        return;
    }

    try {
        // Busca a evolução
        const resEv = await fetch(`http://localhost:3000/api/evolucoes/${evolucaoId}`, { headers: getAuthHeaders() });
        if (!resEv.ok) throw new Error('Erro ao buscar evolução');
        const ev = await resEv.json();

        pacienteId = ev.id_paciente;

        // Preenche o formulário
        document.getElementById('data_sessao').value = ev.data_sessao; // A API já devolve YYYY-MM-DD
        document.getElementById('tipo_sessao').value = ev.tipo_sessao || 'Individual';
        document.getElementById('status').value = ev.status || 'Finalizado';
        document.getElementById('tags').value = ev.tags || '';
        document.getElementById('texto_evolucao').value = ev.texto_evolucao || '';

        // Configura botão cancelar
        document.getElementById('btnCancelar').onclick = () => {
            window.location.href = `evolucao.html?id=${pacienteId}`;
        };

        // Agora busca o paciente para preencher o banner
        const resPac = await fetch(`http://localhost:3000/api/pacientes/${pacienteId}`, { headers: getAuthHeaders() });
        if (resPac.ok) {
            const p = await resPac.json();
            
            // Atualiza breadcrumb
            const linkPerfil = document.getElementById('link-evolucao-paciente');
            if (linkPerfil) {
                linkPerfil.textContent = p.nome_completo;
                linkPerfil.href = `evolucao.html?id=${pacienteId}`;
            }

            // Atualiza banner
            document.getElementById('banner-nome').textContent = p.nome_completo;
            document.getElementById('banner-cpf').textContent = `CPF: ${p.cpf || 'Não informado'}`;
        }

    } catch (err) {
        console.error(err);
        alert('Erro ao carregar os dados para edição.');
    }
}

function configurarFormulario() {
    const form = document.getElementById('formEditarEvolucao');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btnSalvar = document.getElementById('btnSalvar');
        btnSalvar.disabled = true;
        btnSalvar.textContent = 'Salvando...';

        const payload = {
            data_sessao: document.getElementById('data_sessao').value,
            tipo_sessao: document.getElementById('tipo_sessao').value,
            status: document.getElementById('status').value,
            tags: document.getElementById('tags').value.trim(),
            texto_evolucao: document.getElementById('texto_evolucao').value.trim()
        };

        try {
            const res = await fetch(`http://localhost:3000/api/evolucoes/${evolucaoId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                alert(data.erro || 'Erro ao salvar alterações.');
                return;
            }

            // Sucesso, volta para a lista
            window.location.href = `evolucao.html?id=${pacienteId}`;

        } catch (err) {
            console.error(err);
            alert('Não foi possível conectar ao servidor.');
        } finally {
            btnSalvar.disabled = false;
            btnSalvar.textContent = 'Salvar Alterações';
        }
    });
}
