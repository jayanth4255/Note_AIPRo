import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    // Set auth token in axios headers
    useEffect(() => {
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            localStorage.setItem('token', token);
            fetchUser();
        } else {
            delete api.defaults.headers.common['Authorization'];
            localStorage.removeItem('token');
            setLoading(false);
        }
    }, [token]);

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
        setToken(response.data.access_token);
        setUser(response.data.user);
        return response.data;
    };

    const signup = async (name, email, password) => {
        const response = await api.post('/api/auth/signup', { name, email, password });
        setToken(response.data.access_token);
        setUser(response.data.user);
        return response.data;
    };

    const logout = () => {
        setToken(null);
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
