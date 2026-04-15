import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

const FloatingCart = () => {
    const { cartCount, finalTotal } = useCart();
    const navigate = useNavigate();
    const location = useLocation();

    // Hide the floating cart if we are already on the cart page or checkout page
    if (location.pathname === '/cart' || location.pathname === '/checkout') {
        return null;
    }

    if (cartCount === 0) return null; // Only show if there are items

    return (
        <div className="fixed right-6 bottom-24 z-50 flex flex-col items-end gap-2 animate-in fade-in slide-in-from-right-4 duration-500">
            <button
                onClick={() => navigate('/cart')}
                className="group relative flex items-center bg-pink-600 hover:bg-pink-700 text-white shadow-[0_8px_30px_rgb(233,30,99,0.3)] hover:shadow-[0_8px_30px_rgb(233,30,99,0.5)] rounded-2xl p-4 transition-all duration-300 transform hover:-translate-y-1"
            >
                <div className="relative">
                    <ShoppingBag className="w-6 h-6" />
                    <span className="absolute -top-3 -right-3 bg-white text-pink-600 font-bold text-xs h-6 w-6 flex items-center justify-center rounded-full shadow-md">
                        {cartCount}
                    </span>
                </div>
                
                <div className="flex flex-col items-start ml-4 pl-4 border-l border-pink-400 overflow-hidden">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-pink-100">View Cart</span>
                    <span className="font-bold whitespace-nowrap">Rs. {finalTotal.toLocaleString()}</span>
                </div>
            </button>
        </div>
    );
};

export default FloatingCart;
