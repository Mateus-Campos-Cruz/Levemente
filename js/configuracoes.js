/**
 * LEVEMENTE - Configurações
 */

const API_USER_ME = 'http://localhost:3000/api/usuario/me';
const API_UPDATE_PROFILE = 'http://localhost:3000/api/usuario/me';
const API_UPDATE_PASSWORD = 'http://localhost:3000/api/usuario/me/senha';

document.addEventListener('DOMContentLoaded', () => {
    verificarAutenticacao();
    carregarDadosUsuario();
    configurarForms();
    configurarValidacaoSenha();
    configurarMascaras();
});

/**
 * Máscara para CRP
 */
function configurarMascaras() {
    const inputCRP = document.getElementById('prof-crp');

    // Máscara CRP (Ex: 06/123456)
    if (inputCRP) {
        inputCRP.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, ''); 
            if (v.length > 2) {
                v = v.substring(0, 2) + '/' + v.substring(2, 8);
            }
            e.target.value = v.substring(0, 9);
        });
    }
}

/**
 * Garante que o ID do usuário esteja presente nos headers
 */
function getHeaders() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    return {
        'Content-Type': 'application/json',
        'x-user-id': usuario.id || ''
    };
}

function verificarAutenticacao() {
    const usuario = localStorage.getItem('usuario');
    if (!usuario) {
        window.location.href = '/pages/index.html';
    }
}

/**
 * Alterna entre as abas de configuração
 */
function showTab(tabId, event) {
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    
    if (event) {
        event.currentTarget.classList.add('active');
    }
}

/**
 * Busca dados do usuário logado e preenche os campos
 */
async function carregarDadosUsuario() {
    try {
        const res = await fetch(API_USER_ME, { headers: getHeaders() });
        const data = await res.json();

        if (!res.ok) throw new Error(data.erro || 'Erro ao carregar dados');

        document.getElementById('prof-nome').value = data.nome || '';
        document.getElementById('prof-crp').value = data.registro_profissional || '';
        document.getElementById('prof-email').value = data.email || '';
        document.getElementById('prof-especialidade').value = data.especialidade || '';

        // Atualiza avatar se houver (opcional)
        const avatar = document.querySelector('.avatar');
        if (avatar && data.nome) {
            avatar.textContent = data.nome.charAt(0).toUpperCase();
        }

    } catch (err) {
        console.error('Erro ao carregar perfil:', err);
    }
}

/**
 * Alterna visibilidade da senha
 */
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

/**
 * Validação de critérios de senha em tempo real
 */
function configurarValidacaoSenha() {
    const pass = document.getElementById('pass-new');
    const confirm = document.getElementById('pass-confirm');
    
    const validar = () => {
        const val = pass.value;
        const valConfirm = confirm.value;

        const hasLength = val.length >= 6;
        const hasUpper = /[A-Z]/.test(val);
        const hasNumber = /[0-9]/.test(val);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(val);
        const matches = val === valConfirm && val !== '';

        updateCrit('crit-length', hasLength);
        updateCrit('crit-upper', hasUpper);
        updateCrit('crit-number', hasNumber);
        updateCrit('crit-special', hasSpecial);
        updateCrit('crit-match', matches);

        return hasLength && hasUpper && hasNumber && hasSpecial && matches;
    };

    pass.addEventListener('input', validar);
    confirm.addEventListener('input', validar);
}

function updateCrit(id, isValid) {
    const el = document.getElementById(id);
    if (isValid) {
        el.classList.remove('invalid');
        el.classList.add('valid');
        el.querySelector('i').className = 'fas fa-check-circle';
    } else {
        el.classList.remove('valid');
        el.classList.add('invalid');
        el.querySelector('i').className = 'fas fa-circle';
    }
}

/**
 * Configura submissão dos formulários com Modal
 */
function configurarForms() {
    const profileForm = document.getElementById('profile-form');
    const passwordForm = document.getElementById('password-form');

    // PERFIL
    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        abrirModal('Salvar Alterações', 'Deseja realmente atualizar os dados do seu perfil?', async () => {
            await salvarPerfil();
        });
    });

    // SENHA
    passwordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Validação extra antes de abrir modal
        const val = document.getElementById('pass-new').value;
        const valConfirm = document.getElementById('pass-confirm').value;
        
        const isValid = val.length >= 6 && /[A-Z]/.test(val) && /[0-9]/.test(val) && /[!@#$%^&*(),.?":{}|<>]/.test(val) && val === valConfirm;
        
        if (!isValid) {
            alert('A nova senha não atende aos critérios de segurança.');
            return;
        }

        abrirModal('Redefinir Senha', 'Tem certeza que deseja alterar sua senha de acesso?', async () => {
            await atualizarSenha();
        });
    });
}

async function salvarPerfil() {
    const payload = {
        nome: document.getElementById('prof-nome').value,
        registro_profissional: document.getElementById('prof-crp').value,
        especialidade: document.getElementById('prof-especialidade').value
    };

    try {
        const res = await fetch(API_UPDATE_PROFILE, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.erro || 'Erro ao salvar perfil');

        alert('Perfil atualizado com maestria!');
        closeModal();
        carregarDadosUsuario();
        
        // Atualiza nome no localStorage para manter consistência
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        usuario.nome = payload.nome;
        localStorage.setItem('usuario', JSON.stringify(usuario));

    } catch (err) {
        alert(err.message);
    }
}

async function atualizarSenha() {
    const payload = {
        senhaAtual: document.getElementById('pass-current').value,
        novaSenha: document.getElementById('pass-new').value
    };

    try {
        const res = await fetch(API_UPDATE_PASSWORD, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.erro || 'Erro ao atualizar senha');

        alert('Senha redefinida com segurança!');
        closeModal();
        document.getElementById('password-form').reset();
        
        // Reset critérios
        document.querySelectorAll('.password-criteria li').forEach(li => {
            li.classList.remove('valid');
            li.classList.add('invalid');
            li.querySelector('i').className = 'fas fa-circle';
        });

    } catch (err) {
        alert(err.message);
    }
}

/**
 * Lógica do Modal
 */
let modalAction = null;

function abrirModal(title, message, action) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    modalAction = action;
    
    const modal = document.getElementById('confirm-modal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}

function closeModal() {
    const modal = document.getElementById('confirm-modal');
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 300);
    modalAction = null;
}

document.getElementById('modal-confirm-btn').addEventListener('click', () => {
    if (modalAction) modalAction();
});

// Fecha modal ao clicar fora
window.addEventListener('click', (e) => {
    const modal = document.getElementById('confirm-modal');
    if (e.target === modal) closeModal();
});
