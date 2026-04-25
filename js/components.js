// js/components.js

/**
 * Retorna os headers necessários para as requisições autenticadas
 */
function getAuthHeaders() {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario || !usuario.id) {
        // Redireciona para o login se não houver usuário no localStorage
        window.location.href = '/';
        return {};
    }
    return {
        'Content-Type': 'application/json',
        'x-user-id': usuario.id
    };
}

document.addEventListener("DOMContentLoaded", function() {
    // Verificar autenticação em páginas protegidas (quase todas exceto a index)
    const currentPage = window.location.pathname.split("/").pop();
    if (currentPage !== 'index.html' && currentPage !== '') {
        const usuario = localStorage.getItem('usuario');
        if (!usuario) {
            window.location.href = '/';
            return;
        }
    }

    const sidebar = document.getElementById('sidebar-component');
    if (sidebar) {
        // Função auxiliar para verificar se é o link atual
        const isActive = (pageName) => currentPage === pageName ? 'active' : '';

        sidebar.innerHTML = `
            <div class="sidebar-logo">
                <h1 style="color: #db2777; padding: 20px; font-size: 1.5rem;">LEVEMENTE</h1>
            </div>
            <nav class="sidebar-nav" style="flex: 1;">
                <a href="dashboard.html" class="${isActive('dashboard.html')}">
                    <i class="fas fa-home"></i> Dashboard
                </a>
                <a href="agenda.html" class="${isActive('agenda.html')}">
                    <i class="fas fa-calendar-alt"></i> Agenda
                </a>
                <a href="pacientes.html" class="${isActive('pacientes.html')}">
                    <i class="fas fa-users"></i> Pacientes
                </a>
                <a href="evolucoes.html" class="${isActive('evolucoes.html')}">
                    <i class="fas fa-file-medical"></i> Evoluções
                </a>
                <a href="financeiro.html" class="${isActive('financeiro.html')}">
                    <i class="fas fa-wallet"></i> Financeiro
                </a>
                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 10px 0;">
                <a href="configuracoes.html" class="${isActive('configuracoes.html')}">
                    <i class="fas fa-cog"></i> Configurações
                </a>
                <a href="#" id="btn-logout" style="margin-top: auto; color: #ef4444;">
                    <i class="fas fa-sign-out-alt"></i> Sair da Conta
                </a>
            </nav>
        `;

        document.getElementById('btn-logout').addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Deseja realmente sair da plataforma?')) {
                localStorage.removeItem('usuario');
                window.location.href = '/';
            }
        });
    }
});

// Listener global para forçar letras maiúsculas em todos os campos de texto
document.addEventListener('input', function(e) {
    const el = e.target;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        const ignoredTypes = ['password', 'date', 'month', 'color', 'file', 'checkbox', 'radio'];
        
        // Exceção para campos de senha na página de configurações (mesmo quando o tipo muda para 'text')
        const isPasswordField = el.id && el.id.startsWith('pass-');
        const isInsidePasswordForm = el.closest('#password-form');

        if (!ignoredTypes.includes(el.type) && !isPasswordField && !isInsidePasswordForm) {
            el.value = el.value.toUpperCase();
        }
    }
});