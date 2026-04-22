/**
 * LEVEMENTE - Evoluções
 */

document.addEventListener("DOMContentLoaded", () => {
    carregarCabecalhoEvolucao();
});

async function carregarCabecalhoEvolucao() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        alert("ID do paciente não informado.");
        window.location.href = "pacientes.html";
        return;
    }

    try {
        const res = await fetch(`http://localhost:3000/api/pacientes/${id}`);
        if (!res.ok) throw new Error('Erro ao buscar paciente');
        const p = await res.json();

        // Atualiza breadcrumb
        const linkPerfil = document.getElementById('link-perfil-paciente');
        if (linkPerfil) {
            linkPerfil.textContent = p.nome_completo.split(' ')[0]; // Apenas o primeiro nome, igual ao design original
            linkPerfil.href = `perfil-paciente.html?id=${id}`;
        }

        // TODO: Futuramente, aqui será feita outra requisição para carregar
        // a lista de evoluções deste paciente específico:
        // fetch(`http://localhost:3000/api/evolucoes/paciente/${id}`)
        
    } catch (err) {
        console.error(err);
        alert('Erro ao carregar dados do paciente.');
    }
}
