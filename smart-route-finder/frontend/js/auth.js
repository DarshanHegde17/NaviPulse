// Authentication JavaScript

// Register Form Handler
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validation
        if (password !== confirmPassword) {
            showMessage('authMessage', 'Passwords do not match', 'error');
            return;
        }
        
        if (password.length < 6) {
            showMessage('authMessage', 'Password must be at least 6 characters', 'error');
            return;
        }
        
        try {
            const response = await API.register(username, email, password);
            showMessage('authMessage', 'Registration successful! Redirecting to login...', 'success');
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } catch (error) {
            showMessage('authMessage', error.message || 'Registration failed', 'error');
        }
    });
}

// Login Form Handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        try {
            const response = await API.login(email, password);
            
            // Store user data and token
            setCurrentUser(response.user);
            setAuthToken(response.token);
            
            showMessage('authMessage', 'Login successful! Redirecting...', 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } catch (error) {
            showMessage('authMessage', error.message || 'Login failed', 'error');
        }
    });
}

// Logout Function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        clearAuth();
        window.location.href = '../index.html';
    }
}

// Check Authentication on Protected Pages
function checkAuth() {
    const protectedPages = ['dashboard.html', 'history.html', 'traffic.html', 'profile.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage) && !isAuthenticated()) {
        window.location.href = 'login.html';
    }
}

// Run auth check on page load
document.addEventListener('DOMContentLoaded', checkAuth);
