import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Check, Calendar, MapPin, CreditCard, ChevronRight, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CheckoutPage = () => {
    const { cart, cartTotal } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [paymentType, setPaymentType] = useState('full'); // 'full' or 'advance'
    const [formData, setFormData] = useState({
        deliveryDate: '',
        deliveryType: 'pickup', // pickup or delivery
        address: '',
        distance: '',
        deliveryInstructions: '',
        contactName: 'Dehemi Nimshara',
        contactPhone: '077 123 4567',
        contactEmail: 'deheminimshara@gmail.com',
        paymentMethod: 'cod'
    });

    const [isUrgentOrder, setIsUrgentOrder] = useState(false);
    const [agreeUrgent, setAgreeUrgent] = useState(false);
    const URGENT_ORDER_COST = 500;
    const URGENT_ORDER_THRESHOLD = 1000;

    const { clearCart, loyaltyDiscount } = useCart();

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    // Delivery Fee Calculation
    const calculateDeliveryFee = () => {
        if (formData.deliveryType !== 'delivery') return 0;
        const dist = parseFloat(formData.distance) || 0;
        const baseFee = 300;
        const extraFee = dist > 5 ? (dist - 5) * 30 : 0;
        return baseFee + extraFee;
    };

    const deliveryFee = calculateDeliveryFee();

    // Available Points logic:
    // Total - Discount Used in Cart = Remaining pts for Urgent Fee
    const availablePoints = (user?.loyaltyPoints || 0) - loyaltyDiscount;

    // Validate inputs 
    const canAffordUrgent = availablePoints >= URGENT_ORDER_THRESHOLD;

    const finalTotal = cartTotal + deliveryFee - loyaltyDiscount;

    // Minimum date logic
    // Standard: 5 days
    // Urgent: 2 days (User said "within 3 days", usually implies > 48hrs notice)
    const getMinDateStandard = () => {
        const date = new Date();
        date.setDate(date.getDate() + 5);
        // Use local timezone offset adjustment to prevent 'yesterday' bugs
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
    };

    const getMinDateUrgent = () => {
        const date = new Date();
        date.setDate(date.getDate() + 2);
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
    };

    const isUrgentDate = (dateString) => {
        if (!dateString) return false;
        const selected = new Date(dateString);
        const standardMin = new Date();
        standardMin.setDate(standardMin.getDate() + 5);

        // Reset times for accurate comparison
        selected.setHours(0, 0, 0, 0);
        standardMin.setHours(0, 0, 0, 0);

        return selected < standardMin;
    };

    const handleDateChange = (e) => {
        const dateVal = e.target.value;
        const isUrgent = isUrgentDate(dateVal);
        setIsUrgentOrder(isUrgent);
        setFormData({ ...formData, deliveryDate: dateVal });
    };

    const isDateValid = () => {
        if (!formData.deliveryDate) return false;

        const minStandard = getMinDateStandard();
        const minUrgent = getMinDateUrgent();

        // If date is in urgent range (between minUrgent and minStandard)
        if (isUrgentOrder) {
            // Must have points and date must be >= minUrgent
            return canAffordUrgent && formData.deliveryDate >= minUrgent;
        }

        // Otherwise must be >= minStandard
        return formData.deliveryDate >= minStandard;
    };

    const isDetailsValid = () => {
        const { contactName, contactPhone, contactEmail, deliveryType, address } = formData;
        if (!contactName || !contactPhone || !contactEmail) return false;
        if (deliveryType === 'delivery' && !address) return false;
        return true;
    };

    const handleSubmitOrder = () => {
        // Mock API call to place order
        const newOrder = {
            id: 'KVC-' + Math.floor(100000 + Math.random() * 900000), // Random ID
            items: cart,
            subtotal: cartTotal,
            discount: loyaltyDiscount,
            deliveryFee,
            total: finalTotal,
            details: formData,
            // Map 'online' to 'bank_transfer' for consistency with tracking page logic
            paymentMethod: formData.paymentMethod === 'online' ? 'bank_transfer' : 'cod',
            date: new Date().toLocaleDateString('en-US'),
            status: 'Placed',
            trackingSteps: [
                { status: 'Placed', date: new Date().toLocaleString(), desc: 'Order received', completed: true, active: true }
            ]
        };

        const pointsMsg = isUrgentOrder ? `\n(Urgent Order Fee: ${URGENT_ORDER_COST} Points deducted)` : '';
        // alert(`Order Placed Successfully! Your Order ID is #${newOrder.id}\nPaid: Rs. ${finalTotal}${pointsMsg}`);

        // Check if order contains bulk item (check variant as context stores metadata there)
        const isBulk = cart.some(item => item.variant?.isBulk);

        clearCart();

        if (isBulk) {
            navigate('/bulk-request-sent', { state: { order: newOrder } });
        } else {
            navigate('/order-success', { state: { order: newOrder } });
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen py-12 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

                {/* Progress Steps */}
                <div className="flex justify-center mb-12">
                    <div className="flex items-center w-full max-w-3xl px-4">
                        {[
                            { id: 1, label: 'Delivery Date' },
                            { id: 2, label: 'Delivery Details' },
                            { id: 3, label: 'Payment' }
                        ].map((s, idx) => (
                            <React.Fragment key={s.id}>
                                <div className="flex flex-col items-center relative z-10">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${step >= s.id ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-500'
                                        }`}>
                                        {s.id}
                                    </div>
                                    <span className={`text-xs mt-2 font-medium ${step >= s.id ? 'text-pink-600' : 'text-gray-400'}`}>{s.label}</span>
                                </div>
                                {idx < 2 && (
                                    <div className={`flex-1 h-0.5 mx-4 ${step > idx + 1 ? 'bg-pink-600' : 'bg-gray-200'}`}></div>
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
                                <h2 className="text-xl font-bold text-gray-900 mb-8">Select Delivery Date</h2>

                                <div className="mb-8 max-w-md">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={formData.deliveryDate}
                                            onChange={handleDateChange}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900"
                                        />
                                        <Calendar className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                                        Please note: We require at least 5 days notice for all cake orders.
                                        {canAffordUrgent && " If you have 500 loyalty points, you can place order within 5 days ( use 500 points )"}
                                    </p>
                                </div>

                                {isUrgentOrder && (
                                    <div className="mb-8 p-4 bg-pink-50 rounded-xl border border-pink-100 flex items-start">
                                        <div className="mr-3 mt-0.5">⚡</div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Urgent Order</p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                This date requires <strong>{URGENT_ORDER_COST} Loyalty Points</strong>.
                                            </p>
                                            <label className="flex items-center mt-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={agreeUrgent}
                                                    onChange={(e) => setAgreeUrgent(e.target.checked)}
                                                    className="rounded text-pink-600 focus:ring-pink-500 mr-2"
                                                />
                                                <span className="text-xs font-medium">I agree to burn points</span>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end pt-8">
                                    <button
                                        onClick={handleNext}
                                        disabled={!isDateValid() || (isUrgentOrder && !agreeUrgent)}
                                        className="bg-pink-600 text-white px-10 py-3 rounded-xl font-bold hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Continue
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Details */}
                        {step === 2 && (
                            <div className="animate-fade-in">
                                <h2 className="text-xl font-bold text-gray-900 mb-8">Delivery Details</h2>

                                <div className="mb-10">
                                    <h3 className="text-sm font-bold text-gray-900 mb-4">Delivery Method</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Pickup Option */}
                                        <div
                                            onClick={() => setFormData({ ...formData, deliveryType: 'pickup' })}
                                            className={`p-6 rounded-xl cursor-pointer transition-all ${formData.deliveryType === 'pickup'
                                                ? 'bg-pink-50 border border-pink-100'
                                                : 'bg-white border border-gray-100 hover:border-pink-100'
                                                }`}
                                        >
                                            <div className="flex items-start">
                                                <div className={`w-5 h-5 rounded-full border mr-3 mt-0.5 flex items-center justify-center shrink-0 ${formData.deliveryType === 'pickup' ? 'border-pink-600' : 'border-gray-300'
                                                    }`}>
                                                    {formData.deliveryType === 'pickup' && <div className="w-2.5 h-2.5 bg-pink-600 rounded-full"></div>}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-gray-900 block mb-1">Pickup</span>
                                                    <p className="text-xs text-gray-500 mb-2">Pick up your order from our store</p>
                                                    {formData.deliveryType === 'pickup' && (
                                                        <div className="flex items-start text-xs text-gray-600 mt-2">
                                                            <MapPin className="w-3 h-3 mt-0.5 mr-1 text-gray-400" />
                                                            123 Cake Street, Colombo, Sri Lanka
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Delivery Option */}
                                        <div
                                            onClick={() => setFormData({ ...formData, deliveryType: 'delivery' })}
                                            className={`p-6 rounded-xl cursor-pointer transition-all ${formData.deliveryType === 'delivery'
                                                ? 'bg-pink-50 border border-pink-100'
                                                : 'bg-white border border-gray-100 hover:border-pink-100'
                                                }`}
                                        >
                                            <div className="flex items-start">
                                                <div className={`w-5 h-5 rounded-full border mr-3 mt-0.5 flex items-center justify-center shrink-0 ${formData.deliveryType === 'delivery' ? 'border-pink-600' : 'border-gray-300'
                                                    }`}>
                                                    {formData.deliveryType === 'delivery' && <div className="w-2.5 h-2.5 bg-pink-600 rounded-full"></div>}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-gray-900 block mb-1">Delivery</span>
                                                    <p className="text-xs text-gray-500 mb-2">We'll deliver to your address</p>
                                                    {formData.deliveryType === 'delivery' && (
                                                        <div className="text-[10px] text-gray-500 mt-1">
                                                            <span className="block flex items-center gap-1"><Truck className="w-3 h-3" /> Rs.300 base fee + Rs.30/km after 5km</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {formData.deliveryType === 'delivery' && (
                                    <div className="mb-10 space-y-6">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Delivery Address</label>
                                            <input
                                                type="text"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500 text-sm"
                                                placeholder="1/21/A, 1st lane, Colombo 8"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Approximate distance (km)</label>
                                            <div className="relative max-w-[100px]">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={formData.distance}
                                                    onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                                                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500 text-sm"
                                                    placeholder="3"
                                                />
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1">This helps us calculate the delivery fee</p>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Delivery Instructions (Optional)</label>
                                            <input
                                                type="text"
                                                value={formData.deliveryInstructions}
                                                onChange={(e) => setFormData({ ...formData, deliveryInstructions: e.target.value })}
                                                className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500 text-sm"
                                                placeholder="e.g. Leave at gate"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-6">
                                    <h4 className="text-sm font-medium text-gray-900">Recipient Details (if different from sender)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Name</label>
                                            <input
                                                type="text"
                                                value={formData.contactName}
                                                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                                className="w-full py-2 border-b border-gray-200 focus:border-pink-500 focus:outline-none bg-transparent text-sm font-medium text-gray-900 placeholder-gray-300"
                                                placeholder="Dehemi"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Phone</label>
                                            <input
                                                type="tel"
                                                value={formData.contactPhone}
                                                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                                className="w-full py-2 border-b border-gray-200 focus:border-pink-500 focus:outline-none bg-transparent text-sm font-medium text-gray-900 placeholder-gray-300"
                                                placeholder="0771234567"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs text-gray-500 mb-1">Email</label>
                                            <input
                                                type="email"
                                                value={formData.contactEmail}
                                                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                                className="w-full py-2 border-b border-gray-200 focus:border-pink-500 focus:outline-none bg-transparent text-sm font-medium text-gray-900 placeholder-gray-300"
                                                placeholder="email@example.com"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between mt-12 pt-6 border-t border-gray-50">
                                    <button onClick={handleBack} className="text-gray-500 font-bold text-sm hover:text-gray-900 px-4">Back</button>
                                    <button
                                        onClick={handleNext}
                                        disabled={!isDetailsValid()}
                                        className="bg-pink-600 text-white px-10 py-3 rounded-xl font-bold hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-pink-200"
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
                                    <h3 className="text-sm font-medium text-gray-700 mb-4">Payment Method</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div
                                            onClick={() => setFormData({ ...formData, paymentMethod: 'online' })}
                                            className={`p-6 rounded-xl border cursor-pointer transition-all relative ${formData.paymentMethod === 'online' ? 'border-pink-500 bg-pink-50/30' : 'border-gray-200 hover:border-pink-200'}`}
                                        >
                                            <div className="flex items-start">
                                                <div className={`w-5 h-5 rounded-full border mr-3 mt-1 flex items-center justify-center shrink-0 ${formData.paymentMethod === 'online' ? 'border-pink-500' : 'border-gray-300'}`}>
                                                    {formData.paymentMethod === 'online' && <div className="w-2.5 h-2.5 bg-pink-500 rounded-full"></div>}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-gray-900 block mb-1">Online Bank Payment</span>
                                                    <p className="text-xs text-gray-500">Pay securely with mobile banking app</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            onClick={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                                            className={`p-6 rounded-xl border cursor-pointer transition-all relative ${formData.paymentMethod === 'cod' ? 'border-pink-500 bg-pink-50/30' : 'border-gray-200 hover:border-pink-200'}`}
                                        >
                                            <div className="flex items-start">
                                                <div className={`w-5 h-5 rounded-full border mr-3 mt-1 flex items-center justify-center shrink-0 ${formData.paymentMethod === 'cod' ? 'border-pink-500' : 'border-gray-300'}`}>
                                                    {formData.paymentMethod === 'cod' && <div className="w-2.5 h-2.5 bg-pink-500 rounded-full"></div>}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-gray-900 block mb-1">Cash on Delivery</span>
                                                    <p className="text-xs text-gray-500">Pay cash when you receive your order</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex justify-center space-x-12">
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name="paymentType"
                                                checked={paymentType === 'advance'}
                                                onChange={() => setPaymentType('advance')}
                                                className="w-5 h-5 text-pink-600 focus:ring-pink-500 border-gray-300"
                                            />
                                            <span className="ml-3 text-sm font-medium text-gray-900">Advance Payment</span>
                                        </label>
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name="paymentType"
                                                checked={paymentType === 'full'}
                                                onChange={() => setPaymentType('full')}
                                                className="w-5 h-5 text-pink-600 focus:ring-pink-500 border-gray-300"
                                            />
                                            <span className="ml-3 text-sm font-medium text-gray-900">Full Payment</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Loyalty Burn Section Removed from Step 3 - Moved to Cart */}

                                <div className="flex justify-between mt-8">
                                    <button onClick={handleBack} className="text-gray-500 font-medium hover:text-gray-900">Back</button>
                                    <button
                                        onClick={handleSubmitOrder}
                                        className="bg-pink-600 text-white px-8 py-3 rounded-md font-medium hover:bg-pink-700 shadow-md hover:shadow-xl transition-all w-full md:w-auto"
                                    >
                                        Place Order
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
                                        <div className="flex flex-col">
                                            <span className="text-gray-800 font-medium">{item.productName}</span>
                                            <span className="text-xs text-gray-500">x{item.quantity}</span>
                                        </div>
                                        <span className="font-medium">Rs.{(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>Rs.{cartTotal.toLocaleString()}</span>
                                </div>

                                {loyaltyDiscount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Loyalty Discount</span>
                                        <span>-Rs.{loyaltyDiscount.toLocaleString()}</span>
                                    </div>
                                )}

                                {deliveryFee > 0 && (
                                    <div className="flex justify-between">
                                        <span>Delivery Fee</span>
                                        <span>Rs.{deliveryFee.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            <div className="h-px bg-gray-100 my-4"></div>

                            <div className="flex justify-between items-center font-bold text-lg mb-6">
                                <span>Total</span>
                                <span className="text-pink-600">Rs.{finalTotal.toLocaleString()}</span>
                            </div>

                            {formData.deliveryDate && (
                                <div className="mb-4">
                                    <div className="flex items-start text-xs text-gray-500 mb-2">
                                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                        <div>
                                            <span className="block font-medium text-gray-700">Delivery Date</span>
                                            {new Date(formData.deliveryDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                    </div>
                                    {formData.deliveryType === 'delivery' && formData.address && (
                                        <div className="flex items-start text-xs text-gray-500">
                                            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                            <div>
                                                <span className="block font-medium text-gray-700">Delivery Address</span>
                                                {formData.address}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-4 p-3 bg-pink-50 rounded-lg flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs">
                                    {Math.floor(cartTotal / 100)}
                                </div>
                                <div className="text-xs text-gray-600">
                                    You'll earn <strong className="text-gray-900">{Math.floor(cartTotal / 100)} loyalty points</strong> with this purchase!
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
