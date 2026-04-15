import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, ShoppingBag, ArrowRight } from 'lucide-react';

const OrderSuccessPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const order = location.state?.order;

    // Safe date formatter: parses YYYY-MM-DD without timezone shifting
    const formatDate = (rawDate) => {
        if (!rawDate) return '—';
        // Strip time portion if ISO string (e.g. 2026-04-13T00:00:00.000Z → 2026-04-13)
        const datePart = typeof rawDate === 'string' ? rawDate.split('T')[0] : rawDate;
        const [year, month, day] = datePart.split('-').map(Number);
        if (!year || !month || !day) return rawDate;
        // Build with UTC parts to avoid timezone shifting
        const d = new Date(Date.UTC(year, month - 1, day));
        return d.toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' });
    };

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

                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{location.state?.message || "Order Placed!"}</h1>
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
                                    {formatDate(orderDetails.details?.deliveryDate || orderDetails.deliveryDate)}
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

                    {/* Bank Transfer Instructions */}
                    {orderDetails.paymentMethod === 'bank_transfer' && (
                        <div className="bg-blue-50 rounded-xl p-6 text-left mb-8 border border-blue-100">
                            <h3 className="font-bold text-blue-900 mb-4 flex items-center">
                                <span className="mr-2">🏦</span> Bank Transfer Details
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-blue-800 mb-6">
                                <div><span className="block text-xs text-blue-500">Bank</span>Commercial Bank</div>
                                <div><span className="block text-xs text-blue-500">Account No</span>1234 5678 9000</div>
                                <div><span className="block text-xs text-blue-500">Account Name</span>Kavi Cakes</div>
                                <div><span className="block text-xs text-blue-500">Branch</span>Colombo 7</div>
                            </div>

                            <div className="border-t border-blue-200 pt-4">
                                <label className="block text-sm font-medium text-blue-900 mb-2">Upload Payment Slip</label>
                                <div className="flex gap-2">
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg"
                                        className="block w-full text-sm text-blue-500
                                          file:mr-4 file:py-2 file:px-4
                                          file:rounded-full file:border-0
                                          file:text-xs file:font-semibold
                                          file:bg-blue-100 file:text-blue-700
                                          hover:file:bg-blue-200
                                        "
                                    />
                                    <button className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors">
                                        Upload
                                    </button>
                                </div>
                                <p className="text-[10px] text-blue-500 mt-2 font-bold animate-pulse">📸 Please upload a clear JPG image of your slip.</p>
                                <p className="text-[10px] text-blue-400 mt-1">* You can also upload this later from the Order Tracking page.</p>
                            </div>
                        </div>
                    )}

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
                            onClick={() => navigate(`/track-order/${orderDetails.id}`, { state: { order: orderDetails } })}
                            style={{ backgroundColor: '#F43F96' }}
                            className="w-full text-white py-3.5 px-4 rounded-xl font-bold shadow-md hover:opacity-90 transition-opacity flex items-center justify-center"
                        >
                            Track Order
                            <ArrowRight className="w-4 h-4 ml-2" />
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

export default OrderSuccessPage;
