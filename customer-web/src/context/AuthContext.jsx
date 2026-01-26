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
                    const storedUser = localStorage.getItem('customerData');
                    if (storedUser) {
                        setUser(JSON.parse(storedUser));
                    }
                } catch (error) {
                    console.error("Failed to load user", error);
                    localStorage.removeItem('customerToken');
                    localStorage.removeItem('customerData');
                }
            }
            setLoading(false);
        };

        loadUser();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password, role: 'CUSTOMER' });
            const { token, user } = response.data;

            localStorage.setItem('customerToken', token);
            localStorage.setItem('customerData', JSON.stringify(user));
            setUser(user);
            return user;
        } catch (error) {
            console.error("Login failed", error);
            throw error; // Let the component handle the error display
        }
    };

    const logout = () => {
        localStorage.removeItem('customerToken');
        localStorage.removeItem('customerData');
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
