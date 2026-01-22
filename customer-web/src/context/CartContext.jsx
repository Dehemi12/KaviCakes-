import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('kavicakes_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    useEffect(() => {
        localStorage.setItem('kavicakes_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product, variant, quantity, instructions) => {
        setCart(prevCart => {
            const existingItemIndex = prevCart.findIndex(item =>
                item.productId === product.id &&
                JSON.stringify(item.variant) === JSON.stringify(variant) &&
                item.instructions === instructions
            );

            if (existingItemIndex > -1) {
                const newCart = [...prevCart];
                newCart[existingItemIndex].quantity += quantity;
                return newCart;
            } else {
                return [...prevCart, {
                    id: Date.now() + Math.random(), // Simple unique ID
                    productId: product.id,
                    productName: product.name,
                    productImage: product.image || product.imageUrl, // Handle both naming conventions
                    variant,
                    price: variant.price,
                    quantity,
                    instructions
                }];
            }
        });
    };

    const removeFromCart = (itemId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== itemId));
    };

    const updateQuantity = (itemId, newQuantity) => {
        if (newQuantity < 1) return;
        setCart(prevCart =>
            prevCart.map(item =>
                item.id === itemId ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    const clearCart = () => {
        setCart([]);
    };

    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal }}>
            {children}
        </CartContext.Provider>
    );
};
