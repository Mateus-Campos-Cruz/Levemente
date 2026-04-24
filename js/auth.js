/**
 * LEVEMENTE - Autenticação
 */

const API_AUTH_LOGIN = 'http://localhost:3000/api/auth/login';
const API_AUTH_REGISTER = 'http://localhost:3000/api/auth/register';

document.addEventListener('DOMContentLoaded', () => {
    configurarFormularios();
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

            // Salva dados no localStorage
            localStorage.setItem('usuario', JSON.stringify(data));
            
            // Redireciona para o Dashboard
            window.location.href = '/pages/dashboard.html';

        } catch (err) {
            alert(err.message);
        }
    });

    // CADASTRO
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            nome: document.getElementById('reg-nome').value,
            email: document.getElementById('reg-email').value,
            registro_profissional: document.getElementById('reg-crp').value,
            senha: document.getElementById('reg-password').value
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
