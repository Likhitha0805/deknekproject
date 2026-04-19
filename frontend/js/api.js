const API_URL = 'https://deknekproject-production.up.railway.app/api';

class ApiService {
    static getToken() {
        return localStorage.getItem('token');
    }

    static setToken(token, user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    }

    static logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }

    static getUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    static isAuthenticated() {
        return !!this.getToken();
    }

    static async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        if (!response.ok) {
            let error = 'API Request Failed';
            try {
                const errData = await response.json();
                error = errData.message || error;
            } catch (e) {}
            throw new Error(error);
        }

        // Return JSON if there is a response body
        if (response.status !== 204) {
             const text = await response.text();
             return text ? JSON.parse(text) : {};
        }
        return null;
    }
}

// Global UI handling for auth state
document.addEventListener('DOMContentLoaded', () => {
    const navLogin = document.getElementById('nav-login');
    const navDashboard = document.getElementById('nav-dashboard');
    const navLogout = document.getElementById('nav-logout');

    if (ApiService.isAuthenticated()) {
        if(navLogin) navLogin.style.display = 'none';
        if(navDashboard) navDashboard.style.display = 'inline-block';
        if(navLogout) navLogout.style.display = 'inline-block';
    }

    if (navLogout) {
        navLogout.addEventListener('click', () => ApiService.logout());
    }
});
