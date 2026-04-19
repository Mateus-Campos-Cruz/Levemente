// js/pacientes.js
document.addEventListener("DOMContentLoaded", function() {
    const inputBusca = document.getElementById('inputBusca');
    const tabela = document.getElementById('tabelaPacientes');

    // Verifica se os elementos existem para evitar erros no console
    if (inputBusca && tabela) {
        inputBusca.addEventListener('input', function() {
            const termo = inputBusca.value.toLowerCase();
            const linhas = tabela.getElementsByClassName('paciente-row');

            // Transforma a coleção de linhas em Array para percorrer
            Array.from(linhas).forEach(linha => {
                const textoLinha = linha.textContent.toLowerCase();
                
                // Se o termo digitado estiver no texto da linha, mostra. Caso contrário, esconde.
                if (textoLinha.includes(termo)) {
                    linha.style.display = "";
                } else {
                    linha.style.display = "none";
                }
            });
        });
    }
});

function openModal(modalId) {
    document.getElementById(modalId).style.display = "block";
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

// Fechar se o usuário clicar fora da caixa branca
window.onclick = function(event) {
    if (event.target.className === 'modal') {
        event.target.style.display = "none";
    }
}