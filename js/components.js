// js/components.js
document.addEventListener("DOMContentLoaded", function() {
    const sidebarHTML = `
        <div class="sidebar-header"><h2>LEVEMENTE</h2></div>
        <nav class="sidebar-nav">
            <a href="/index.html" id="nav-home"><i class="fas fa-home"></i> <span>Dashboard</span></a>
            <a href="/pages/agenda.html" id="nav-agenda"><i class="fas fa-calendar-alt"></i> <span>Agenda</span></a>
            <a href="/pages/pacientes.html" id="nav-pacientes"><i class="fas fa-users"></i> <span>Pacientes</span></a>
            <a href="/pages/financeiro.html" id="nav-financeiro"><i class="fas fa-wallet"></i> <span>Financeiro</span></a>
            <a href="/pages/configuracoes.html" id="nav-config"><i class="fas fa-cog"></i> <span>Configurações</span></a>
        </nav>
    `;

    const sidebarElement = document.getElementById("sidebar-component");
    if (sidebarElement) {
        sidebarElement.innerHTML = sidebarHTML;
        
        // Lógica para marcar o link ativo baseado na URL
        const currentPath = window.location.pathname;
        if (currentPath.includes("agenda")) document.getElementById("nav-agenda").classList.add("active");
        else if (currentPath.includes("pacientes")) document.getElementById("nav-pacientes").classList.add("active");
        // ... repetir para os outros
    }
});