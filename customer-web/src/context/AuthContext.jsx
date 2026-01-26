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
                    // Start: Persist session if token matches demo token
                    if (token === 'demo-token-123') {
                        setUser({
                            name: 'Kavindi Ratnayake',
                            email: 'user@demo.com',
                            phone: '077 123 4567',
                            loyaltyPoints: 500,
                            id: 'C001'
                        });
                    } else {
                        // Invalid token
                        localStorage.removeItem('customerToken');
                    }
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
        // Hardcoded validation for Demo
        if (email === 'user@demo.com' && password === '123456') { // Simple hardcoded check
            const mockUser = {
                name: 'Kavindi Ratnayake',
                email: 'user@demo.com',
                phone: '077 123 4567',
                loyaltyPoints: 500,
                id: 'C001'
            };
            const mockToken = 'demo-token-123';

            localStorage.setItem('customerToken', mockToken);
            setUser(mockUser);
            return mockUser;
        } else {
            // Simulate API error structure
            throw { response: { data: { error: 'Invalid email or password' } } };
        }
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
