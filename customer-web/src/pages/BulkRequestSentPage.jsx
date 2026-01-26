import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, ShoppingBag, ArrowRight } from 'lucide-react';

const BulkRequestSentPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const order = location.state?.order;

    // Use mock data if no order state is present
    // Order data from checkout
    const orderDetails = order;

    if (!orderDetails) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">Order details not found.</div>;
    }

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
                                <p className="font-bold text-gray-900">
                                    {orderDetails.details?.deliveryDate || orderDetails.deliveryDate}
                                </p>
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
                                <p className="font-bold text-orange-500">{orderDetails.status}</p>
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

                    <div className="space-y-4">
                        <button
                            onClick={() => navigate(`/bulk-order-review/${orderDetails.id}`, { state: { order: orderDetails } })}
                            className="w-full bg-pink-500 text-white py-3.5 px-4 rounded-xl font-bold shadow-md hover:opacity-90 transition-opacity flex items-center justify-center"
                        >
                            Confirmation <ArrowRight className="w-4 h-4 ml-2" />
                        </button>

                        <button
                            onClick={() => navigate('/cakes')}
                            className="block w-full text-pink-500 font-bold hover:underline transition-colors text-center text-sm"
                        >
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkRequestSentPage;
