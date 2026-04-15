import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const storedUser = localStorage.getItem('user');
                    if (storedUser) {
                        setUser(JSON.parse(storedUser));
                    }
                } catch (error) {
                    console.error("Failed to load user", error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
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

            // Prevent cart bleed-over between accounts by wiping local cache boundary
            localStorage.removeItem('kavicakes_cart');

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            return user;
        } catch (error) {
            console.error("Login failed", error);
            throw error; // Let the component handle the error display
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('kavicakes_cart'); // Wipe cart on logout
        setUser(null);
        // Force reload to clear any memory states in other components if needed
        window.location.href = '/login';
    };

    const register = async (userData) => {
        const response = await api.post('/auth/register', { ...userData, role: 'CUSTOMER' });
        return response.data;
    };

    const refreshUser = async () => {
        try {
            const res = await api.get('/auth/profile');
            const updatedUser = res.data;
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser)); // Keep strictly in sync
            return updatedUser;
        } catch (error) {
            console.error("Failed to refresh user:", error);
        }
    };

    const value = {
        user,
        loading,
        login,
        logout,
        register,
        refreshUser
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
