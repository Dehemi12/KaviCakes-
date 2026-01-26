import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const CartPage = () => {
    const cartContext = useCart();

    // Fallback if context is missing (though it shouldn't be with proper wrapping)
    if (!cartContext) {
        return <div className="p-8 text-center text-red-600">Error: Cart Context connection failed. Please refresh.</div>;
    }

    const { cart, removeFromCart, updateQuantity, cartTotal, clearCart, loyaltyDiscount, setLoyaltyDiscount } = cartContext;
    const { user } = useAuth();
    const navigate = useNavigate();
    const [pointsToBurn, setPointsToBurn] = React.useState(loyaltyDiscount || 0);

    // Debugging
    console.log('CartPage render. Cart:', cart);

    if (!cart) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <p className="text-gray-500">Loading cart...</p>
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center font-sans">
                <img src="https://placehold.co/200x200/fecaca/db2777?text=Empty+Cart" alt="Empty Cart" className="mb-6 rounded-full opacity-50" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
                <p className="text-gray-500 mb-8">Looks like you haven't added any sweet treats yet.</p>
                <Link to="/cakes" className="bg-pink-600 text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-pink-700 transition-colors">
                    Start Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-12 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart</h1>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Cart Items List */}
                    <div className="flex-1 space-y-4">
                        {Array.isArray(cart) && cart.filter(item => item && item.id).map(item => (
                            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                    <img src={item.productImage} alt={item.productName || 'Product'} className="w-full h-full object-cover" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg text-gray-900 truncate">{item?.productName || 'Unknown Item'}</h3>
                                    <div className="text-sm text-gray-500 space-y-1">
                                        <p>
                                            {item?.variant?.size?.label || item?.variant?.size || 'Standard'} • {item?.variant?.flavor?.label || item?.variant?.flavor || 'Standard'} • {item?.variant?.shape?.label || item?.variant?.shape || 'Round'}
                                        </p>
                                        {item?.instructions && <p className="italic text-gray-400 truncate">Note: {item.instructions}</p>}
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 mt-4 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
                                    <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-2 py-1">
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-pink-600"
                                            disabled={item.quantity <= 1}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </button>
                                        <span className="font-medium text-gray-900 w-4 text-center">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-pink-600"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="text-right min-w-[80px]">
                                        <p className="font-bold text-pink-600">Rs.{(item.price || 0) * (item.quantity || 1)}</p>
                                    </div>

                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors p-2"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Loyalty UI Removed - Moved to Checkout */}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:w-96 shrink-0">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>Rs.{cartTotal.toLocaleString()}</span>
                                </div>

                                {loyaltyDiscount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Loyalty Discount</span>
                                        <span>-Rs.{loyaltyDiscount.toLocaleString()}</span>
                                    </div>
                                )}

                                <div className="h-px bg-gray-100 my-4"></div>
                                <div className="flex justify-between text-xl font-bold text-gray-900">
                                    <span>Total</span>
                                    <span className="text-pink-600">Rs.{(cartTotal - loyaltyDiscount).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Loyalty Points Section */}
                            <div className="mb-6 bg-pink-50 p-4 rounded-xl border border-pink-100">
                                <h3 className="font-bold text-gray-900 mb-2 flex items-center text-sm">
                                    <span className="mr-2">💎</span> Loyalty Points
                                </h3>

                                {user ? (
                                    user.loyaltyPoints > 0 ? (
                                        <>
                                            <div className="text-xs text-gray-600 mb-2">
                                                Available: <strong>{user.loyaltyPoints}</strong> (1 Point = Rs. 1)
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={Math.min(user.loyaltyPoints, cartTotal)}
                                                    value={pointsToBurn}
                                                    onChange={(e) => {
                                                        const val = Math.min(Math.max(0, Number(e.target.value)), Math.min(user.loyaltyPoints, cartTotal));
                                                        setPointsToBurn(val);
                                                    }}
                                                    className="flex-1 rounded-lg border-gray-300 text-sm p-2 border"
                                                    placeholder="Points"
                                                />
                                                <button
                                                    onClick={() => setLoyaltyDiscount(pointsToBurn)}
                                                    className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-gray-800"
                                                >
                                                    Apply
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-xs text-gray-600">
                                            You have 0 loyalty points. Earn points with this order!
                                        </p>
                                    )
                                ) : (
                                    <div className="text-xs text-gray-600">
                                        <Link to="/login" className="font-bold text-pink-600 hover:underline">Log in</Link> to redeem loyalty points.
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => {
                                    if (user) {
                                        navigate('/checkout');
                                    } else {
                                        navigate('/login', { state: { from: { pathname: '/checkout' } } });
                                    }
                                }}
                                className="w-full bg-pink-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-pink-700 transition-colors flex items-center justify-center mb-4"
                            >
                                Proceed to Checkout <ArrowRight className="ml-2 h-5 w-5" />
                            </button>

                            <button
                                onClick={() => navigate('/cakes')}
                                className="w-full py-3 rounded-xl text-pink-600 font-medium hover:bg-pink-50 transition-colors text-center"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
