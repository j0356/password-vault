/**
 * ============================================
 * PASSWORD VAULT - MAIN APPLICATION
 * ============================================
 * Handles UI interactions and application state
 * 
 * ⚠️ WARNING: This is a university assignment project
 * with intentional security vulnerabilities.
 * DO NOT use for storing real passwords!
 */

// Security warning in console
console.warn(
    '%c⚠️ SECURITY WARNING',
    'color: red; font-size: 20px; font-weight: bold;'
);
console.warn(
    '%cThis site is created for a university assignment and contains intentional security vulnerabilities.\nDo NOT use it as your actual password manager!',
    'color: orange; font-size: 14px;'
);

// ============================================
// STATE
// ============================================
let isLoginMode = true;
let currentUser = null;
let currentUserId = null;
let credentialsCache = [];

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    checkExistingSession();
    setupEventListeners();
});

function setupEventListeners() {
    // Auth form submission
    document.getElementById('authForm').addEventListener('submit', handleAuthSubmit);
    
    // Modal close on outside click
    document.getElementById('credentialModal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
}

// ============================================
// AUTHENTICATION
// ============================================
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('authTitle');
    const subtitle = document.getElementById('authSubtitle');
    const btnText = document.getElementById('authBtnText');
    const toggleText = document.getElementById('toggleText');
    const toggleLink = document.getElementById('toggleLink');

    if (isLoginMode) {
        title.textContent = 'Welcome back';
        subtitle.textContent = 'Enter your credentials to access your vault';
        btnText.textContent = 'Unlock Vault';
        toggleText.textContent = "Don't have an account?";
        toggleLink.textContent = 'Create one';
    } else {
        title.textContent = 'Create Account';
        subtitle.textContent = 'Set up your secure vault';
        btnText.textContent = 'Create Vault';
        toggleText.textContent = 'Already have an account?';
        toggleLink.textContent = 'Sign in';
    }
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('authUsername').value.trim();
    const password = document.getElementById('authPassword').value;
    const submitBtn = document.getElementById('authBtn');

    if (!username || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    // Disable button during request
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';

    try {
        if (isLoginMode) {
            // LOGIN
            const response = await AuthAPI.login(username, password);
            
            currentUser = response.user.username;
            currentUserId = response.user.id;
            AuthAPI.storeUser(response.user);
            
            showDashboard();
            showToast('Welcome back, ' + currentUser + '!', 'success');
        } else {
            // REGISTER
            if (password.length < 6) {
                showToast('Password must be at least 6 characters', 'error');
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                return;
            }

            const response = await AuthAPI.register(username, password);
            
            currentUser = response.user.username;
            currentUserId = response.user.id;
            AuthAPI.storeUser(response.user);
            
            showDashboard();
            showToast('Account created successfully!', 'success');
        }
    } catch (error) {
        showToast(error.message || 'Authentication failed', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
    }
}

async function checkExistingSession() {
    const token = getAuthToken();
    const user = AuthAPI.getStoredUser();
    
    if (token && user) {
        currentUser = user.username;
        currentUserId = user.id;
        
        try {
            // Verify token is still valid
            await AuthAPI.verify();
            showDashboard();
        } catch (error) {
            // Token invalid, clear storage
            AuthAPI.clearStoredUser();
            currentUser = null;
            currentUserId = null;
        }
    }
}

function showDashboard() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('dashboard').classList.add('active');
    document.getElementById('displayUsername').textContent = currentUser;
    document.getElementById('userAvatar').textContent = currentUser.charAt(0).toUpperCase();
    document.getElementById('authUsername').value = '';
    document.getElementById('authPassword').value = '';
    loadCredentials();
}

async function logout() {
    await AuthAPI.logout();
    
    // Clear local state
    currentUser = null;
    currentUserId = null;
    credentialsCache = [];
    
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('dashboard').classList.remove('active');
    isLoginMode = true;
    showToast('Logged out successfully', 'success');
}

// ============================================
// CREDENTIALS MANAGEMENT
// ============================================
async function loadCredentials() {
    try {
        credentialsCache = await CredentialsAPI.getAll();
        renderCredentials();
    } catch (error) {
        showToast('Failed to load credentials', 'error');
        credentialsCache = [];
        renderCredentials();
    }
}

function getCredentials() {
    return credentialsCache;
}

function renderCredentials() {
    const credentials = getCredentials();
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filtered = credentials.filter(c => 
        c.site_name.toLowerCase().includes(searchTerm) || 
        c.username.toLowerCase().includes(searchTerm)
    );

    const list = document.getElementById('credentialsList');
    
    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔐</div>
                <div class="empty-title">${credentials.length === 0 ? 'No credentials yet' : 'No results found'}</div>
                <div>${credentials.length === 0 ? 'Add your first password to get started' : 'Try a different search term'}</div>
            </div>
        `;
    } else {
        list.innerHTML = filtered.map(cred => `
            <div class="credential-item" data-id="${cred.id}">
                <div class="credential-icon">${getIcon(cred.site_name)}</div>
                <div class="credential-info">
                    <div class="credential-site">${escapeHtml(cred.site_name)}</div>
                    <div class="credential-username">${escapeHtml(cred.username)}</div>
                </div>
                <div class="credential-actions">
                    <button class="btn btn-secondary btn-icon" onclick="copyPassword(${cred.id})" title="Copy password">
                        📋
                    </button>
                    <button class="btn btn-secondary btn-icon" onclick="editCredential(${cred.id})" title="Edit">
                        ✏️
                    </button>
                    <button class="btn btn-danger btn-icon" onclick="deleteCredential(${cred.id})" title="Delete">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateStats(credentials);
}

function updateStats(credentials) {
    document.getElementById('totalCredentials').textContent = credentials.length;
    const strong = credentials.filter(c => checkPasswordStrength(c.password) === 'strong').length;
    document.getElementById('strongPasswords').textContent = strong;
    document.getElementById('weakPasswords').textContent = credentials.length - strong;
}

function filterCredentials() {
    renderCredentials();
}

// ============================================
// MODAL FUNCTIONS
// ============================================
function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add Credential';
    document.getElementById('credentialId').value = '';
    document.getElementById('credSite').value = '';
    document.getElementById('credUsername').value = '';
    document.getElementById('credPassword').value = '';
    document.getElementById('strengthBar').className = 'password-strength-bar';
    document.getElementById('credentialModal').classList.add('active');
}

function editCredential(id) {
    const cred = credentialsCache.find(c => c.id === id);
    if (!cred) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Credential';
    document.getElementById('credentialId').value = id;
    document.getElementById('credSite').value = cred.site_name;
    document.getElementById('credUsername').value = cred.username;
    document.getElementById('credPassword').value = cred.password;
    updateStrengthIndicator();
    document.getElementById('credentialModal').classList.add('active');
}

function closeModal() {
    document.getElementById('credentialModal').classList.remove('active');
}

async function saveCredential() {
    const site = document.getElementById('credSite').value.trim();
    const username = document.getElementById('credUsername').value.trim();
    const password = document.getElementById('credPassword').value;
    const id = document.getElementById('credentialId').value;

    if (!site || !username || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    const credentialData = {
        site_name: site,
        username: username,
        password: password
    };

    try {
        if (id) {
            // Update existing
            await CredentialsAPI.update(parseInt(id), credentialData);
            showToast('Credential updated!', 'success');
        } else {
            // Create new
            await CredentialsAPI.create(credentialData);
            showToast('Credential added!', 'success');
        }
        
        await loadCredentials();
        closeModal();
    } catch (error) {
        showToast(error.message || 'Failed to save credential', 'error');
    }
}

async function deleteCredential(id) {
    if (confirm('Are you sure you want to delete this credential?')) {
        try {
            await CredentialsAPI.delete(id);
            await loadCredentials();
            showToast('Credential deleted', 'success');
        } catch (error) {
            showToast(error.message || 'Failed to delete credential', 'error');
        }
    }
}

function copyPassword(id) {
    const cred = credentialsCache.find(c => c.id === id);
    if (!cred) return;
    
    navigator.clipboard.writeText(cred.password).then(() => {
        showToast('Password copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy password', 'error');
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function getIcon(site) {
    const s = site.toLowerCase();
    if (s.includes('google')) return '🔵';
    if (s.includes('facebook') || s.includes('meta')) return '📘';
    if (s.includes('twitter') || s.includes('x.com')) return '🐦';
    if (s.includes('github')) return '🐙';
    if (s.includes('netflix')) return '🎬';
    if (s.includes('amazon')) return '📦';
    if (s.includes('apple')) return '🍎';
    if (s.includes('microsoft')) return '🪟';
    if (s.includes('spotify')) return '🎵';
    if (s.includes('discord')) return '💬';
    if (s.includes('bank') || s.includes('finance')) return '🏦';
    return '🌐';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
    } else {
        input.type = 'password';
        btn.textContent = '👁️';
    }
}

function checkPasswordStrength(password) {
    if (!password) return '';
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    const length = password.length;

    const score = (hasLower ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecial ? 1 : 0);
    
    if (length >= 12 && score >= 3) return 'strong';
    if (length >= 8 && score >= 2) return 'medium';
    return 'weak';
}

function updateStrengthIndicator() {
    const password = document.getElementById('credPassword').value;
    const strength = checkPasswordStrength(password);
    const bar = document.getElementById('strengthBar');
    bar.className = 'password-strength-bar';
    if (strength) {
        bar.classList.add('strength-' + strength);
    }
}

function generatePassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}';
    let password = '';
    for (let i = 0; i < 16; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('credPassword').value = password;
    updateStrengthIndicator();
    showToast('Strong password generated!', 'success');
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${type === 'success' ? '✓' : '✕'}</span>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}