import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('customerToken');
            if (token) {
                try {
                    // Verify token and get profile? For now just simulate/check
                    // In a real app we'd hit /auth/me or /customers/profile
                    // const response = await api.get('/customers/profile');
                    // setUser(response.data);
                    // For now, if token exists, we assume logged in until we implement the profile endpoint
                    setUser({ name: 'Customer', loyaltyPoints: 500 });
                } catch (error) {
                    console.error("Failed to load user", error);
                    localStorage.removeItem('customerToken');
                }
            }
            setLoading(false);
        };

        loadUser();
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password, role: 'CUSTOMER' });
        const { token, user } = response.data;
        localStorage.setItem('customerToken', token);
        setUser(user);
        return user;
    };

    const logout = () => {
        localStorage.removeItem('customerToken');
        setUser(null);
    };

    const register = async (userData) => {
        const response = await api.post('/auth/register', { ...userData, role: 'CUSTOMER' });
        return response.data;
    };

    const value = {
        user,
        loading,
        login,
        logout,
        register
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
