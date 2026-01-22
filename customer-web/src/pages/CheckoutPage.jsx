import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Check, Calendar, MapPin, CreditCard, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CheckoutPage = () => {
    const { cart, cartTotal } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [isRedeemingPoints, setIsRedeemingPoints] = useState(false);
    const [formData, setFormData] = useState({
        deliveryDate: '',
        deliveryType: 'pickup', // pickup or delivery
        address: '',
        contactName: 'Dehemi Nimshara',
        contactPhone: '077 123 4567',
        contactEmail: 'deheminimshara@gmail.com',
        paymentMethod: 'cod'
    });

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const maxRedeemablePoints = user?.loyaltyPoints ? Math.min(user.loyaltyPoints, cartTotal) : 0;
    const discountAmount = isRedeemingPoints ? maxRedeemablePoints : 0;
    const finalTotal = cartTotal - discountAmount;

    const getMinDate = () => {
        const date = new Date();
        date.setDate(date.getDate() + 3);
        return date.toISOString().split('T')[0];
    };

    const isDateValid = () => {
        if (!formData.deliveryDate) return false;
        return formData.deliveryDate >= getMinDate();
    };

    const isDetailsValid = () => {
        const { contactName, contactPhone, contactEmail, deliveryType, address } = formData;
        if (!contactName || !contactPhone || !contactEmail) return false;
        if (deliveryType === 'delivery' && !address) return false;
        return true;
    };

    const handleSubmitOrder = () => {
        // Mock API call to place order
        console.log('Order Placed:', {
            cart,
            subtotal: cartTotal,
            discount: discountAmount,
            total: finalTotal,
            details: formData
        });
        alert(`Order Placed Successfully! Your Order ID is #ORD-2025-001\nPaid: Rs. ${finalTotal}`);
        navigate('/orders'); // Redirect to orders page (to be implemented)
    };

    return (
        <div className="bg-gray-50 min-h-screen py-12 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

                {/* Progress Steps */}
                <div className="flex justify-center mb-12">
                    <div className="flex items-center w-full max-w-2xl">
                        {[
                            { id: 1, label: 'Delivery Date' },
                            { id: 2, label: 'Details' },
                            { id: 3, label: 'Payment' }
                        ].map((s, idx) => (
                            <React.Fragment key={s.id}>
                                <div className="flex flex-col items-center relative z-10">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= s.id ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                        {step > s.id ? <Check className="h-5 w-5" /> : s.id}
                                    </div>
                                    <span className={`text-xs mt-2 font-medium ${step >= s.id ? 'text-pink-600' : 'text-gray-400'}`}>{s.label}</span>
                                </div>
                                {idx < 2 && (
                                    <div className={`flex-1 h-1 mx-4 rounded-full ${step > idx + 1 ? 'bg-pink-600' : 'bg-gray-200'}`}></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Form Area */}
                    <div className="flex-1 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[500px]">

                        {/* Step 1: Delivery Date */}
                        {step === 1 && (
                            <div className="animate-fade-in">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Select Delivery Date</h2>
                                <div className="mb-8">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Date</label>
                                    <input
                                        type="date"
                                        min={getMinDate()}
                                        value={formData.deliveryDate}
                                        onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                                        className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">Please note: We require at least 3 days notice for standard orders.</p>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleNext}
                                        disabled={!isDateValid()}
                                        className="bg-pink-600 text-white px-8 py-3 rounded-full font-bold hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Continue
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Details */}
                        {step === 2 && (
                            <div className="animate-fade-in">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Delivery Details</h2>

                                <div className="mb-6">
                                    <h3 className="text-sm font-medium text-gray-700 mb-3">Delivery Method</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div
                                            onClick={() => setFormData({ ...formData, deliveryType: 'pickup' })}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.deliveryType === 'pickup' ? 'border-pink-500 bg-pink-50' : 'border-gray-100 hover:border-gray-200'}`}
                                        >
                                            <div className="flex items-center mb-2">
                                                <div className={`w-4 h-4 rounded-full border border-gray-400 mr-3 flex items-center justify-center ${formData.deliveryType === 'pickup' ? 'border-pink-500' : ''}`}>
                                                    {formData.deliveryType === 'pickup' && <div className="w-2 h-2 bg-pink-500 rounded-full"></div>}
                                                </div>
                                                <span className="font-bold text-gray-900">Pickup</span>
                                            </div>
                                            <p className="text-sm text-gray-500 ml-7">Pick up your order from our store <br />123 Galle Road, Colombo 03</p>
                                        </div>

                                        <div
                                            onClick={() => setFormData({ ...formData, deliveryType: 'delivery' })}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.deliveryType === 'delivery' ? 'border-pink-500 bg-pink-50' : 'border-gray-100 hover:border-gray-200'}`}
                                        >
                                            <div className="flex items-center mb-2">
                                                <div className={`w-4 h-4 rounded-full border border-gray-400 mr-3 flex items-center justify-center ${formData.deliveryType === 'delivery' ? 'border-pink-500' : ''}`}>
                                                    {formData.deliveryType === 'delivery' && <div className="w-2 h-2 bg-pink-500 rounded-full"></div>}
                                                </div>
                                                <span className="font-bold text-gray-900">Delivery</span>
                                            </div>
                                            <p className="text-sm text-gray-500 ml-7">We'll deliver to your address <br />Flat rate + distance fee</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                        <input
                                            type="text"
                                            value={formData.contactName}
                                            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                            className="w-full p-3 rounded-lg border border-gray-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                        <input
                                            type="tel"
                                            value={formData.contactPhone}
                                            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                            className="w-full p-3 rounded-lg border border-gray-200"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                        <input
                                            type="email"
                                            value={formData.contactEmail}
                                            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                            className="w-full p-3 rounded-lg border border-gray-200"
                                        />
                                    </div>
                                    {formData.deliveryType === 'delivery' && (
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Address</label>
                                            <textarea
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                className="w-full p-3 rounded-lg border border-gray-200"
                                                rows="3"
                                            ></textarea>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between mt-8">
                                    <button onClick={handleBack} className="text-gray-500 font-medium hover:text-gray-900">Back</button>
                                    <button
                                        onClick={handleNext}
                                        disabled={!isDetailsValid()}
                                        className="bg-pink-600 text-white px-8 py-3 rounded-full font-bold hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Continue
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Payment */}
                        {step === 3 && (
                            <div className="animate-fade-in">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Payment</h2>

                                <div className="mb-8">
                                    <h3 className="text-sm font-medium text-gray-700 mb-3">Select Payment Method</h3>
                                    <div className="space-y-3">
                                        <div
                                            onClick={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                                            className={`p-4 rounded-xl border-2 cursor-pointer flex items-center transition-all ${formData.paymentMethod === 'cod' ? 'border-pink-500 bg-pink-50' : 'border-gray-100 hover:border-gray-200'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border border-gray-400 mr-3 flex items-center justify-center ${formData.paymentMethod === 'cod' ? 'border-pink-500' : ''}`}>
                                                {formData.paymentMethod === 'cod' && <div className="w-2 h-2 bg-pink-500 rounded-full"></div>}
                                            </div>
                                            <span className="font-bold text-gray-900">Cash on Delivery</span>
                                        </div>

                                        <div
                                            onClick={() => setFormData({ ...formData, paymentMethod: 'bank_transfer' })}
                                            className={`p-4 rounded-xl border-2 cursor-pointer flex items-center transition-all ${formData.paymentMethod === 'bank_transfer' ? 'border-pink-500 bg-pink-50' : 'border-gray-100 hover:border-gray-200'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border border-gray-400 mr-3 flex items-center justify-center ${formData.paymentMethod === 'bank_transfer' ? 'border-pink-500' : ''}`}>
                                                {formData.paymentMethod === 'bank_transfer' && <div className="w-2 h-2 bg-pink-500 rounded-full"></div>}
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-900">Bank Transfer</span>
                                                <p className="text-xs text-gray-500">Transfer details will be shown after placement</p>
                                            </div>
                                        </div>
                                    </div>
                                    {formData.paymentMethod === 'bank_transfer' && (
                                        <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
                                            <strong>Bank Details:</strong><br />
                                            Account Name: KaviCakes<br />
                                            Bank: Commercial Bank<br />
                                            Account No: 123456789
                                        </div>
                                    )}
                                </div>

                                {user && user.loyaltyPoints > 0 && (
                                    <div className="bg-pink-50 border border-pink-200 p-6 rounded-xl mb-6">
                                        <h3 className="font-bold text-pink-900 mb-2">Loyalty Points</h3>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-pink-800">You have <strong>{user.loyaltyPoints}</strong> loyalty points.</p>
                                                <p className="text-xs text-pink-600">Redeem them for a discount.</p>
                                            </div>
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="redeemPoints"
                                                    checked={isRedeemingPoints}
                                                    onChange={(e) => setIsRedeemingPoints(e.target.checked)}
                                                    className="w-5 h-5 text-pink-600 focus:ring-pink-500 border-gray-300 rounded mr-2"
                                                />
                                                <label htmlFor="redeemPoints" className="text-sm font-medium text-gray-900 cursor-pointer">
                                                    Redeem Max (Rs. {maxRedeemablePoints})
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-gray-50 p-6 rounded-xl mb-8">
                                    <h4 className="font-bold text-gray-900 mb-4">Review Order Details</h4>
                                    <div className="text-sm text-gray-600 space-y-2">
                                        <p><span className="font-medium">Date:</span> {formData.deliveryDate}</p>
                                        <p><span className="font-medium">Method:</span> {formData.deliveryType === 'pickup' ? 'Store Pickup' : 'Home Delivery'}</p>
                                        <p><span className="font-medium">Contact:</span> {formData.contactName} ({formData.contactPhone})</p>
                                    </div>
                                </div>

                                <div className="flex justify-between mt-8">
                                    <button onClick={handleBack} className="text-gray-500 font-medium hover:text-gray-900">Back</button>
                                    <button
                                        onClick={handleSubmitOrder}
                                        className="bg-pink-600 text-white px-8 py-3 rounded-full font-bold hover:bg-pink-700 shadow-lg hover:shadow-xl transition-all w-full md:w-auto"
                                    >
                                        Place Order - Rs.{finalTotal.toLocaleString()}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:w-80 shrink-0">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
                            <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
                            <div className="space-y-3 mb-6">
                                {cart.map(item => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span className="text-gray-600 truncate max-w-[150px]">{item.productName} x{item.quantity}</span>
                                        <span className="font-medium">Rs.{item.price * item.quantity}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="h-px bg-gray-100 my-4"></div>

                            {isRedeemingPoints && (
                                <div className="flex justify-between items-center text-sm text-green-600 mb-2">
                                    <span>Discount (Points_</span>
                                    <span>-Rs.{discountAmount.toLocaleString()}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center font-bold text-lg">
                                <span>Total</span>
                                <span className="text-pink-600">Rs.{finalTotal.toLocaleString()}</span>
                            </div>
                            {step === 3 && (
                                <div className="mt-4 p-3 bg-pink-50 rounded-lg text-xs text-pink-700 text-center">
                                    You'll earn <strong>{Math.floor(cartTotal / 100)}</strong> loyalty points with this purchase!
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
