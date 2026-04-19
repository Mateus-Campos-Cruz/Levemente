// js/components.js
document.addEventListener("DOMContentLoaded", function() {
    const sidebar = document.getElementById('sidebar-component');
    if (sidebar) {
        // Pega o nome do arquivo atual (ex: financeiro.html)
        const currentPage = window.location.pathname.split("/").pop();

        // Função auxiliar para verificar se é o link atual
        const isActive = (pageName) => currentPage === pageName ? 'active' : '';

        sidebar.innerHTML = `
            <div class="sidebar-logo">
                <h1 style="color: #db2777; padding: 20px; font-size: 1.5rem;">LEVEMENTE</h1>
            </div>
            <nav class="sidebar-nav">
                <a href="dashboard.html" class="${isActive('dashboard.html')}">
                    <i class="fas fa-home"></i> Dashboard
                </a>
                <a href="agenda.html" class="${isActive('agenda.html')}">
                    <i class="fas fa-calendar-alt"></i> Agenda
                </a>
                <a href="pacientes.html" class="${isActive('pacientes.html')}">
                    <i class="fas fa-users"></i> Pacientes
                </a>
                <a href="financeiro.html" class="${isActive('financeiro.html')}">
                    <i class="fas fa-wallet"></i> Financeiro
                </a>
                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 10px 0;">
                <a href="configuracoes.html" class="${isActive('configuracoes.html')}">
                    <i class="fas fa-cog"></i> Configurações
                </a>
            </nav>
        `;
    }
});