document.addEventListener('DOMContentLoaded', () => {
    if (ApiService.isAuthenticated()) {
        window.location.href = 'dashboard.html';
        return;
    }

    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');
    const errorMsg = document.getElementById('auth-error');
    const subtitle = document.getElementById('auth-subtitle');

    showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        subtitle.innerText = "Create an account to start collaborating.";
        errorMsg.innerText = '';
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        subtitle.innerText = "Welcome back! Please enter your details.";
        errorMsg.innerText = '';
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const data = await ApiService.request('/auth/signin', {
                method: 'POST',
                body: JSON.stringify({
                    email: document.getElementById('login-email').value,
                    password: document.getElementById('login-password').value
                })
            });
            ApiService.setToken(data.token, { id: data.id, email: data.email });
            window.location.href = 'dashboard.html';
        } catch (err) {
            errorMsg.innerText = err.message;
        }
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await ApiService.request('/auth/signup', {
                method: 'POST',
                body: JSON.stringify({
                    name: document.getElementById('signup-name').value,
                    email: document.getElementById('signup-email').value,
                    password: document.getElementById('signup-password').value
                })
            });
            // Auto login after signup setup
            document.getElementById('login-email').value = document.getElementById('signup-email').value;
            document.getElementById('login-password').value = document.getElementById('signup-password').value;
            showLogin.click();
            errorMsg.innerText = "Account created! Please sign in.";
            errorMsg.style.color = "var(--primary)";
        } catch (err) {
            errorMsg.style.color = "var(--error)";
            errorMsg.innerText = err.message;
        }
    });
});
