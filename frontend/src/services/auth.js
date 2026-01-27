// src/services/auth.js
/**
 * Authentication service
 */
import api from './api';

export const authService = {
    /**
     * Register a new user
     */
    signup: async (name, email, password) => {
        const response = await api.post('/api/auth/signup', { name, email, password });
        if (response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    /**
     * Login user
     */
    login: async (email, password) => {
        const response = await api.post('/api/auth/login', { email, password });
        if (response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    /**
     * Logout user
     */
    logout: async () => {
        try {
            await api.post('/api/auth/logout');
        } catch (error) {
            console.error('Logout failed:', error);
        }
        localStorage.removeItem('user');
    },

    /**
     * Get current user
     */
    getCurrentUser: async () => {
        const response = await api.get('/api/auth/me');
        localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
    },

    /**
     * Update user profile
     */
    updateProfile: async (data) => {
        const response = await api.put('/api/auth/me', data);
        localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
    },

    /**
     * Request password reset
     */
    forgotPassword: async (email) => {
        const response = await api.post('/api/auth/forgot-password', { email });
        return response.data;
    },

    /**
     * Reset password
     */
    resetPassword: async (token, newPassword) => {
        const response = await api.post('/api/auth/reset-password', {
            token,
            new_password: newPassword,
        });
        return response.data;
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated: () => {
        return !!localStorage.getItem('user');
    },

    /**
     * Get stored user
     */
    getStoredUser: () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },
};

export default authService;
