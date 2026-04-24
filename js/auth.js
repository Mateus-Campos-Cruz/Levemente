/**
 * LEVEMENTE - Autenticação
 */

const API_AUTH_LOGIN = 'http://localhost:3000/api/auth/login';
const API_AUTH_REGISTER = 'http://localhost:3000/api/auth/register';

document.addEventListener('DOMContentLoaded', () => {
    configurarFormularios();
    configurarValidacoesSenha();
    configurarMascaraCRP();
});

function toggleAuth(type) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');

    if (type === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
    }
}

/**
 * Alterna visibilidade da senha (olhinho)
 */
function togglePassword(inputId) {
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
 * Máscara para CRP (Ex: 06/123456)
 */
function configurarMascaraCRP() {
    const inputCRP = document.getElementById('reg-crp');
    if (!inputCRP) return;

    inputCRP.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
        if (v.length > 2) {
            v = v.substring(0, 2) + '/' + v.substring(2, 8);
        }
        e.target.value = v.substring(0, 9);
    });
}

/**
 * Validação de critérios de senha em tempo real
 */
function configurarValidacoesSenha() {
    const pass = document.getElementById('reg-password');
    const confirm = document.getElementById('reg-password-confirm');
    if (!pass || !confirm) return;

    const validar = () => {
        const val = pass.value;
        const valConfirm = confirm.value;

        // Critérios
        const hasLength = val.length >= 6;
        const hasUpper = /[A-Z]/.test(val);
        const hasNumber = /[0-9]/.test(val);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(val);
        const matches = val === valConfirm && val !== '';

        // Atualiza UI
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
        el.querySelector('i').classList.remove('fa-circle');
        el.querySelector('i').classList.add('fa-check-circle');
    } else {
        el.classList.remove('valid');
        el.classList.add('invalid');
        el.querySelector('i').classList.remove('fa-check-circle');
        el.querySelector('i').classList.add('fa-circle');
    }
}

function configurarFormularios() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // LOGIN
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const senha = document.getElementById('password').value;

        try {
            const res = await fetch(API_AUTH_LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.erro || 'Erro ao realizar login');

            localStorage.setItem('usuario', JSON.stringify(data));
            window.location.href = '/pages/dashboard.html';

        } catch (err) {
            alert(err.message);
        }
    });

    // CADASTRO
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const senha = document.getElementById('reg-password').value;
        const confirmacao = document.getElementById('reg-password-confirm').value;

        // Validação extra antes de enviar
        if (senha !== confirmacao) {
            alert('As senhas não coincidem!');
            return;
        }

        const payload = {
            nome: document.getElementById('reg-nome').value,
            email: document.getElementById('reg-email').value,
            registro_profissional: document.getElementById('reg-crp').value,
            senha: senha
        };

        try {
            const res = await fetch(API_AUTH_REGISTER, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.erro || 'Erro ao cadastrar');

            alert('Cadastro realizado com sucesso! Agora você pode entrar.');
            toggleAuth('login');
            
        } catch (err) {
            alert(err.message);
        }
    });
}
