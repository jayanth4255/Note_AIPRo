import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Just try to fetch the user on mount to see if they are logged in via cookie
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const response = await api.get('/api/auth/me');
            setUser(response.data);
        } catch (error) {
            console.error('Failed to fetch user:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await api.post('/api/auth/login', { email, password });
        setUser(response.data.user);
        return response.data;
    };

    const signup = async (name, email, password) => {
        const response = await api.post('/api/auth/signup', { name, email, password });
        setUser(response.data.user);
        return response.data;
    };

    const logout = async () => {
        try {
            await api.post('/api/auth/logout');
        } catch (error) {
            console.error('Logout failed:', error);
        }
        setUser(null);
    };

    const updateUser = async (userData) => {
        const response = await api.put('/api/auth/me', userData);
        setUser(response.data);
        return response.data;
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            signup,
            logout,
            updateUser,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
