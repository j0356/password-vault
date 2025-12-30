/**
 * ============================================
 * PASSWORD VAULT - API SERVICE
 * ============================================
 * Handles all communication with the backend API
 */

// Always use relative URL - Nginx proxies /api to backend
const API_BASE_URL = '/api';

// Store auth token
let authToken = localStorage.getItem('vault_token') || null;

/**
 * Set the auth token
 */
function setAuthToken(token) {
    authToken = token;
    if (token) {
        localStorage.setItem('vault_token', token);
    } else {
        localStorage.removeItem('vault_token');
    }
}

/**
 * Get the current auth token
 */
function getAuthToken() {
    return authToken;
}

/**
 * Base API request handler
 */
async function apiRequest(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include'
    };

    // Add auth token if available
    if (authToken) {
        options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'API request failed');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ============================================
// AUTH API
// ============================================

const AuthAPI = {
    /**
     * Register a new user
     */
    async register(username, password) {
        const response = await apiRequest('/auth/register', 'POST', { username, password });
        if (response.token) {
            setAuthToken(response.token);
        }
        return response;
    },

    /**
     * Login user
     */
    async login(username, password) {
        const response = await apiRequest('/auth/login', 'POST', { username, password });
        if (response.token) {
            setAuthToken(response.token);
        }
        return response;
    },

    /**
     * Verify current token
     */
    async verify() {
        return await apiRequest('/auth/verify', 'GET');
    },

    /**
     * Logout user
     */
    async logout() {
        try {
            await apiRequest('/auth/logout', 'POST');
        } catch (error) {
            // Ignore logout errors
        }
        setAuthToken(null);
        localStorage.removeItem('vault_user');
    },

    /**
     * Get stored user data
     */
    getStoredUser() {
        const user = localStorage.getItem('vault_user');
        return user ? JSON.parse(user) : null;
    },

    /**
     * Store user data
     */
    storeUser(user) {
        localStorage.setItem('vault_user', JSON.stringify(user));
    },

    /**
     * Clear stored user data
     */
    clearStoredUser() {
        localStorage.removeItem('vault_user');
        localStorage.removeItem('vault_token');
    }
};

// ============================================
// CREDENTIALS API
// ============================================

const CredentialsAPI = {
    /**
     * Get all credentials for current user
     */
    async getAll() {
        const response = await apiRequest('/credentials', 'GET');
        return response.credentials || [];
    },

    /**
     * Get single credential by ID
     */
    async getById(id) {
        const response = await apiRequest(`/credentials/${id}`, 'GET');
        return response.credential;
    },

    /**
     * Create new credential
     */
    async create(credentialData) {
        const response = await apiRequest('/credentials', 'POST', credentialData);
        return response.credential;
    },

    /**
     * Update existing credential
     */
    async update(id, credentialData) {
        const response = await apiRequest(`/credentials/${id}`, 'PUT', credentialData);
        return response.credential;
    },

    /**
     * Delete credential
     */
    async delete(id) {
        await apiRequest(`/credentials/${id}`, 'DELETE');
    }
};

// Export for use in other files
window.API_BASE_URL = API_BASE_URL;
window.AuthAPI = AuthAPI;
window.CredentialsAPI = CredentialsAPI;
window.setAuthToken = setAuthToken;
window.getAuthToken = getAuthToken;