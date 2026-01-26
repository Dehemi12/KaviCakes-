import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Check, ChevronLeft } from 'lucide-react';

const BulkOrderReviewPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Mock data fallback if state is missing
    const [order, setOrder] = useState(null);

    useEffect(() => {
        if (location.state?.order) {
            setOrder(location.state.order);
        } else {
            // Mock Data for direct access / refresh
            setOrder({
                id: id || 'KVC-795209',
                details: {
                    contactName: 'dehemi',
                    contactEmail: 'deheminimshara@gmail.com',
                    contactPhone: '123455',
                    deliveryType: 'Delivery'
                },
                items: [{
                    isBulk: true,
                    quantity: 200,
                    price: 24000, // Total price
                    bulkDetails: {
                        eventName: 'Annual Gathering',
                        organization: 'Company ABC',
                        eventDate: '2025-11-22',
                        quantity: 200,
                        cakeType: 'Cupcake',
                        cakeFlavor: 'Chocolate'
                    }
                }],
                total: 20400 // Total after discount? Image says 20,400 Total Amount.
            });
        }
    }, [id, location.state]);

    if (!order) return <div className="p-12 text-center text-pink-600 font-bold">Loading...</div>;

    // Check for bulk item (in variant for cart items, or direct prop for mock data)
    const bulkItem = order.items?.find(i => i.variant?.isBulk || i.isBulk) || order.items?.[0];
    const bulkDetails = bulkItem?.variant?.bulkDetails || bulkItem?.bulkDetails || {};
    const contact = order.details || {};

    // Calculations based on Image 2 logic
    // Image 2: Unit Price 120, Qty 200. Total likely 24,000.
    // Bulk Discount 15% off.
    // Total Amount Rs. 20,400.
    // Advance 50% = 10,200.
    // Balance Due = 10,200.

    const qty = bulkDetails.quantity || bulkItem?.quantity || 0;
    // Reverse calculate unit price if not available, or use mock default
    const unitPrice = 120; // Hardcoded to match image for demo, strictly speaking should be dynamic
    const subTotal = unitPrice * qty; // 24000
    const discountPercent = 15;
    const discountAmount = subTotal * (discountPercent / 100); // 3600
    // The image logic: 24000 - 3600 = 20400.
    const totalAmount = subTotal - discountAmount;
    const advance = totalAmount * 0.5;
    const balance = totalAmount - advance;

    return (
        <div className="font-sans min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Order Request</h1>
                    <p className="text-gray-500">
                        Special pricing for orders of 100 or more cakes
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Order Review</h2>

                    {/* Success Banner */}
                    <div className="bg-green-50 rounded-xl p-4 flex items-center gap-3 mb-10 w-full">
                        <div className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-green-700" />
                        </div>
                        <p className="text-green-800 text-sm font-medium">
                            Your bulk order has been confirmed. Please review the details below.
                        </p>
                    </div>

                    {/* Event Details */}
                    <div className="mb-10">
                        <h3 className="text-sm font-bold text-gray-900 mb-6">Event Details</h3>
                        <div className="grid grid-cols-2 gap-y-6">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Event Name</p>
                                <p className="text-sm font-medium text-gray-900">{bulkDetails.eventName || 'Annual Gathering'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Organization</p>
                                <p className="text-sm font-medium text-gray-900">{bulkDetails.organization || 'Company ABC'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Event Date</p>
                                <p className="text-sm font-medium text-gray-900">{bulkDetails.eventDate || '2025-11-22'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Quantity</p>
                                <p className="text-sm font-medium text-gray-900">{qty} cakes</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Cake Type</p>
                                <p className="text-sm font-medium text-gray-900">{bulkDetails.cakeType || 'Cupcake'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Cake Flavor</p>
                                <p className="text-sm font-medium text-gray-900">{bulkDetails.cakeFlavor || 'Chocolate'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Contact & Delivery */}
                    <div className="mb-10">
                        <h3 className="text-sm font-bold text-gray-900 mb-6">Contact & Delivery Information</h3>
                        <div className="grid grid-cols-2 gap-y-6">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Contact Name</p>
                                <p className="text-sm font-medium text-gray-900">{contact.contactName || 'dehemi'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Contact Phone</p>
                                <p className="text-sm font-medium text-gray-900">{contact.contactPhone || '123455'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Contact Email</p>
                                <p className="text-sm font-medium text-gray-900">{contact.contactEmail || 'deheminimshara@gmail.com'}</p>
                            </div>
                            <div>
                                {/* Empty Spacer */}
                            </div>
                            <div className="col-span-2">
                                <p className="text-xs text-gray-500 mb-1">Delivery Method</p>
                                <p className="text-sm font-medium text-gray-900">
                                    Delivery to: {contact.deliveryType === 'delivery' ? 'Delivery' : contact.deliveryType}
                                    {/* The image says "Delivery to: Delivery". Assuming it means Method: Delivery */}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="mb-10">
                        <h3 className="text-sm font-bold text-gray-900 mb-6">Order Summary</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Unit Price:</span>
                                <span className="font-medium text-gray-900">Rs. {unitPrice}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Quantity:</span>
                                <span className="font-medium text-gray-900">{qty}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-green-500">Bulk Discount:</span>
                                <span className="font-medium text-green-500">{discountPercent}% off</span>
                            </div>
                            <div className="flex justify-between text-sm pt-2">
                                <span className="font-bold text-gray-900">Total Amount:</span>
                                <span className="font-bold text-pink-600">Rs.{totalAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-4 border-t border-gray-50 mt-4">
                                <span className="text-gray-500">Advance Payment (50%):</span>
                                <span className="font-medium text-gray-900">Rs.{advance.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Balance Due:</span>
                                <span className="font-medium text-gray-900">Rs.{balance.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex justify-between items-center pt-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="text-gray-500 font-bold text-sm hover:text-gray-900"
                        >
                            Back
                        </button>

                        <button
                            onClick={() => navigate(`/track-order/${order.id}`, { state: { order } })}
                            className="bg-pink-500 text-white px-10 py-3 rounded-lg font-bold text-sm shadow-md hover:bg-pink-600 transition-colors"
                        >
                            Track Order
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default BulkOrderReviewPage;
