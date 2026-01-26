import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

const DEFAULT_CART_STATE = [];

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        try {
            const savedCart = localStorage.getItem('kavicakes_cart');
            if (!savedCart) return DEFAULT_CART_STATE;

            const parsed = JSON.parse(savedCart);
            // Validation: Ensure it's an array and items have IDs
            if (Array.isArray(parsed)) {
                return parsed.filter(item => item && typeof item === 'object' && item.id);
            }
            return DEFAULT_CART_STATE;
        } catch (e) {
            console.error("Failed to parse cart from storage", e);
            return DEFAULT_CART_STATE;
        }
    });

    useEffect(() => {
        localStorage.setItem('kavicakes_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product, variant, quantity, instructions) => {
        if (!product || !variant) {
            console.error("Attempted to add invalid item to cart", { product, variant });
            return;
        }

        setCart(prevCart => {
            // Defensive: ensure prevCart is an array
            const currentCart = Array.isArray(prevCart) ? prevCart : [];

            const existingItemIndex = currentCart.findIndex(item =>
                item.productId === product.id &&
                JSON.stringify(item.variant) === JSON.stringify(variant) &&
                item.instructions === instructions
            );

            if (existingItemIndex > -1) {
                const newCart = [...currentCart];
                newCart[existingItemIndex].quantity += quantity;
                return newCart;
            } else {
                return [...currentCart, {
                    id: Date.now() + Math.random(), // Simple unique ID
                    productId: product.id,
                    productName: product.name,
                    productImage: product.image || product.imageUrl, // Handle both naming conventions
                    variant,
                    price: variant.price || 0,
                    quantity,
                    instructions: instructions || ''
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

    const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);

    const clearCart = () => {
        setCart([]);
        setLoyaltyDiscount(0);
    };

    const safeCart = Array.isArray(cart) ? cart : [];

    const cartCount = safeCart.reduce((total, item) => total + (item?.quantity || 0), 0);
    const cartTotal = safeCart.reduce((total, item) => {
        const price = Number(item?.price) || 0;
        const qty = Number(item?.quantity) || 0;
        return total + (price * qty);
    }, 0);
    const finalTotal = Math.max(0, cartTotal - loyaltyDiscount);

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartCount,
            cartTotal,
            loyaltyDiscount,
            setLoyaltyDiscount,
            finalTotal
        }}>
            {children}
        </CartContext.Provider>
    );
};
