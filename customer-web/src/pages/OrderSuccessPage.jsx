import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, ShoppingBag, ArrowRight } from 'lucide-react';

const OrderSuccessPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const order = location.state?.order;

    // Use mock data if no order state is present (for development/testing)
    const orderDetails = order || {
        id: 'ORD-MOCK-001',
        date: new Date().toLocaleDateString(),
        deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        total: 4611,
        paymentMethod: 'Cash on Delivery',
        status: 'Pending'
    };

    return (
        <div className="min-h-screen bg-pink-50/30 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="p-8 text-center">
                    <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed!</h1>
                    <p className="text-gray-600 mb-8">
                        Thank you for your order. We've received your request and will process it shortly.
                    </p>

                    <div className="bg-gray-50 rounded-2xl p-6 text-left mb-8">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Order Details</h2>

                        <div className="grid grid-cols-2 gap-y-4 text-sm">
                            <div>
                                <p className="text-gray-500 mb-1">Order Number</p>
                                <p className="font-bold text-gray-900">{orderDetails.id}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Order Date</p>
                                <p className="font-bold text-gray-900">{orderDetails.date}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Delivery Date</p>
                                <p className="font-bold text-gray-900">{orderDetails.deliveryDate}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Payment Method</p>
                                <p className="font-bold text-gray-900">
                                    {orderDetails.paymentMethod === 'cod' ? 'Cash on Delivery' :
                                        orderDetails.paymentMethod === 'bank_transfer' ? 'Bank Transfer' :
                                            orderDetails.paymentMethod}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Admin Status</p>
                                <p className="font-bold text-yellow-600">{orderDetails.status}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Total Amount</p>
                                <p className="font-bold text-gray-900">Rs.{orderDetails.total.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-pink-50 rounded-xl p-4 flex items-start text-left mb-8">
                        <ShoppingBag className="w-5 h-5 text-pink-600 mt-1 mr-3 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm">What happens next?</h3>
                            <p className="text-xs text-gray-600 mt-1">
                                Our team will prepare your order according to your specifications. You'll receive email updates as your order progresses. You can also track your order status anytime.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => navigate(`/track-order/${orderDetails.id}`, { state: { order: orderDetails } })}
                            className="w-full bg-pink-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-pink-700 transition-colors flex items-center justify-center"
                        >
                            Track Order
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </button>

                        <Link
                            to="/cakes"
                            className="block w-full bg-white text-pink-600 border border-pink-200 py-3 px-4 rounded-xl font-bold hover:bg-pink-50 transition-colors"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccessPage;
