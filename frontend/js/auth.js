const API_URL = '/api';

// Toast function
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Check authentication and redirect
const token = localStorage.getItem('access_token');
const currentPage = window.location.pathname.split('/').pop();

if (token && currentPage === 'index.html') {
    window.location.href = 'dashboard.html';
}

if (!token && currentPage === 'dashboard.html') {
    window.location.href = 'index.html';
}

// Login form handler
const loginForm = document.getElementById('login');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('username', data.username);
                localStorage.setItem('user_id', data.user_id);
                showToast(`Welcome back, ${username}!`, 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 500);
            } else {
                showToast(data.detail || 'Login failed', 'error');
            }
        } catch (error) {
            showToast('Connection error. Make sure backend is running on port 8000', 'error');
        }
    });
}

// Register form handler
const registerForm = document.getElementById('register');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showToast('Registration successful! Redirecting to login...', 'success');
                setTimeout(() => {
                    showLogin();
                    document.getElementById('registerForm').reset();
                }, 1500);
            } else {
                showToast(data.detail || 'Registration failed', 'error');
            }
        } catch (error) {
            showToast('Connection error', 'error');
        }
    });
}

function showRegister() {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.add('active');
}

function showLogin() {
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('loginForm').classList.add('active');
}