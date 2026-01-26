import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ChevronLeft, Clock, CheckCircle, Truck, Package,
    CreditCard, Calendar, MapPin, Mail, Phone, ShoppingBag
} from 'lucide-react';

const OrderTrackingPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Mock data - In real app, fetch from API based on ID
    const [order, setOrder] = useState(null);

    useEffect(() => {
        // Use state if available (from success page), else mock
        if (location.state?.order) {
            setOrder({
                ...location.state.order,
                // Add missing mock fields if passed from success page
                items: location.state.order.items || [
                    { name: 'Chocolate Fudge Cake', quantity: 1, price: 4500, image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=200' },
                ],
                deliveryFee: 111,
                customer: {
                    name: 'dehemi',
                    email: 'deheminimshara@gmail.com',
                    phone: '0711515580',
                    address: '1/21/A, 1st lane, Colombo 8'
                },
                trackingSteps: [
                    { status: 'Placed', date: '10/20/2025, 6:59:07 PM', desc: 'Order received and is pending confirmation', completed: true, active: true },
                    { status: 'Confirmed', label: 'Confirmed by admin', completed: false },
                    // Dynamic steps will be injected
                ]
            });
        } else {
            // Mock fallback based on ID to simulate different types
            const isBank = id?.toUpperCase().includes('BANK');
            // Default mock
            setOrder({
                id: id || 'KVC-795189',
                date: '10/20/2025',
                status: 'Placed',
                paymentMethod: isBank ? 'bank_transfer' : 'cod',
                total: 4611,
                deliveryDate: '10/27/2025',
                items: [
                    { name: 'Chocolate Fudge Cake', quantity: 1, price: 4500, image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=200' }
                ],
                deliveryFee: 111,
                customer: {
                    name: 'dehemi',
                    email: 'deheminimshara@gmail.com',
                    phone: '0711515580',
                    address: '1/21/A, 1st lane, Colombo 8'
                },
                trackingSteps: [
                    { status: 'Placed', date: '10/20/2025, 6:59:07 PM', desc: 'Order received and is pending confirmation', completed: true, active: true },
                ]
            });
        }
    }, [id, location.state]);

    if (!order) return <div className="p-12 text-center">Loading...</div>;

    // Define Steps based on Payment Method
    const isBank = order.paymentMethod === 'bank_transfer' || order.paymentMethod === 'Bank Payment';

    const steps = isBank
        ? [
            { id: 'placed', label: 'Placed', icon: Clock },
            { id: 'confirmed', label: 'Confirmed by admin', icon: CheckCircle },
            { id: 'payment', label: 'Payment', icon: CreditCard },
            { id: 'preparing', label: 'Preparing', icon: Package },
            { id: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
            { id: 'delivered', label: 'Delivered', icon: CheckCircle }
        ]
        : [
            { id: 'placed', label: 'Placed', icon: Clock },
            { id: 'confirmed', label: 'Confirmed by admin', icon: CheckCircle },
            { id: 'preparing', label: 'Preparing', icon: Package },
            { id: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
            { id: 'delivered', label: 'Delivered', icon: CheckCircle }
        ];

    // Simple status check logic for demo (assuming 'Placed' is current)
    const getCurrentStepIndex = () => 0;
    const currentStepIndex = getCurrentStepIndex();

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Breadcrumb */}
                <button onClick={() => navigate('/orders')} className="flex items-center text-pink-500 font-bold hover:underline mb-2 text-sm">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back to Orders
                </button>

                {/* Main Card: Order Header + Stepper */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">Order Tracking</h1>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-lg font-bold text-gray-900">Order # {order.id}</h2>
                                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                    {order.status}
                                </span>
                            </div>
                            <p className="text-gray-500 text-sm">Placed on {order.date}</p>
                        </div>
                    </div>

                    {/* Stepper */}
                    <div className="relative mb-4">
                        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-100 rounded-full mx-8 -z-0"></div>
                        {/* Dynamic Progress Bar Implementation could go here */}

                        <div className="flex justify-between items-start relative z-10 w-full px-4">
                            {steps.map((step, idx) => {
                                const Icon = step.icon;
                                const isCompleted = idx <= currentStepIndex;
                                const isActive = idx === currentStepIndex;

                                return (
                                    <div key={step.id} className="flex flex-col items-center w-24 text-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-all duration-300 ${isActive
                                                ? 'bg-pink-500 text-white shadow-md scale-110'
                                                : isCompleted
                                                    ? 'bg-gray-900 text-white'
                                                    : 'bg-white border-2 border-gray-200 text-gray-300'
                                            }`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <p className={`text-xs font-bold leading-tight ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                            {step.label}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Actions & Updates */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            <h3 className="font-bold text-gray-900 mb-6">Order Updates</h3>

                            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                                {/* Timeline */}
                                <div className="space-y-8 flex-1">
                                    {order.trackingSteps?.map((step, idx) => (
                                        <div key={idx} className="flex gap-4">
                                            <div className="mt-1.5">
                                                <div className="w-3 h-3 rounded-full bg-pink-500 ring-4 ring-pink-50"></div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 mb-1 font-medium">{step.date}</p>
                                                <p className="font-bold text-gray-900 text-sm">{step.status}</p>
                                                {step.desc && <p className="text-sm text-gray-500 mt-1 leading-relaxed">{step.desc}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Buttons */}
                                <div className="flex flex-wrap gap-3 shrink-0 self-start md:self-end">
                                    {isBank && (
                                        <button className="px-5 py-2.5 bg-sky-400 text-white font-bold rounded-lg shadow-sm hover:bg-sky-500 transition-colors text-sm">
                                            Do payment
                                        </button>
                                    )}
                                    <button className="px-5 py-2.5 bg-red-500 text-white font-bold rounded-lg shadow-sm hover:bg-red-600 transition-colors text-sm">
                                        Cancel Order
                                    </button>
                                    <button className="px-5 py-2.5 bg-yellow-400 text-white font-bold rounded-lg shadow-sm hover:bg-yellow-500 transition-colors text-sm">
                                        Edit Order
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            <h3 className="font-bold text-gray-900 mb-6">Order Items</h3>
                            <div className="space-y-6">
                                {order.items?.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 items-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900">{item.name}</h4>
                                            <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                                        </div>
                                        <div className="text-right font-bold text-gray-900">
                                            Rs.{item.price ? item.price.toLocaleString() : '0'}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Subtotal</span>
                                    <span>Rs.{(order.total - (order.deliveryFee || 0)).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Delivery Fee</span>
                                    <span>Rs.{order.deliveryFee}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2">
                                    <span>Total</span>
                                    <span>Rs.{order.total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Information */}
                    <div className="space-y-8">
                        {/* Delivery Info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Delivery Information</h3>
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <Calendar className="w-5 h-5 text-gray-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-400 mb-0.5">Delivery Date</p>
                                        <p className="text-sm font-bold text-gray-900">{order.deliveryDate}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-400 mb-0.5">Delivery Address</p>
                                        <p className="text-sm font-bold text-gray-900">{order.customer?.address}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <CreditCard className="w-5 h-5 text-gray-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-400 mb-0.5">Payment Method</p>
                                        <p className="text-sm font-bold text-gray-900">
                                            {isBank ? 'Bank Payment' : 'Cash on Delivery'}
                                        </p>
                                        <p className="text-xs text-orange-500 font-bold mt-1">Payment Pending</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Contact Information</h3>
                            <div className="space-y-4">
                                <div className="flex gap-3 items-center">
                                    <span className="text-xs text-gray-400 w-12">Name:</span>
                                    <span className="text-sm font-bold text-gray-900">{order.customer?.name}</span>
                                </div>
                                <div className="flex gap-3 items-center">
                                    <span className="text-xs text-gray-400 w-12">Email:</span>
                                    <span className="text-sm font-bold text-gray-900 truncate">{order.customer?.email}</span>
                                </div>
                                <div className="flex gap-3 items-center">
                                    <span className="text-xs text-gray-400 w-12">Phone:</span>
                                    <span className="text-sm font-bold text-gray-900">{order.customer?.phone}</span>
                                </div>
                            </div>
                        </div>

                        {/* Need Help */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-gray-900 mb-2">Need Help?</h3>
                            <p className="text-xs text-gray-500 mb-4">
                                Contact our customer service if you have any questions about your order.
                            </p>
                            <button className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl transition-colors text-sm">
                                Contact Support
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderTrackingPage;
