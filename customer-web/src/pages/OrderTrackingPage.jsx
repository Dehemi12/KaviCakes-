import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ChevronLeft, Clock, CheckCircle, Truck, Package,
    CreditCard, Calendar, MapPin, Mail, Phone, ShoppingBag, PenSquare, Upload, Star
} from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import FeedbackModal from '../components/FeedbackModal';
import toast from 'react-hot-toast';
import { XCircle, FileText } from 'lucide-react';
import InvoiceModal from '../components/InvoiceModal';

const OrderTrackingPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { replaceCart } = useCart();

    // State
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [paymentSelection, setPaymentSelection] = useState('full'); // Default safe, will adjust in effect
    const [error, setError] = useState('');
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({ deliveryDate: '', address: '', specialNotes: '' });
    const [invoiceData, setInvoiceData] = useState(null);
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
    const [fetchingInvoice, setFetchingInvoice] = useState(false);

    const handleViewInvoice = async () => {
        if (invoiceData) {
            setIsInvoiceOpen(true);
            return;
        }

        try {
            setFetchingInvoice(true);
            const response = await api.get(`/orders/${order.id}/invoice`);
            setInvoiceData(response.data);
            setIsInvoiceOpen(true);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load invoice.');
        } finally {
            setFetchingInvoice(false);
        }
    };

    const processOrderData = (data) => {
        // Map backend status to UI steps
        // Backend: NEW, CONFIRMED, PREPARING, ready, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
        const status = data.status;
        const createdDate = new Date(data.createdAt).toLocaleString();

        let trackingSteps = [
            {
                status: 'Placed',
                date: createdDate,
                desc: 'Order received and is pending confirmation',
                completed: true,
                active: status === 'NEW'
            }
        ];

        // Logic for "Confirmed" step
        if (['CONFIRMED', 'ADMIN_CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)) {
            trackingSteps.unshift({
                status: 'Confirmed',
                label: 'Confirmed by admin',
                date: new Date().toLocaleDateString(), // Mock date if real one missing
                desc: 'Your order has been accepted by the store.',
                completed: true,
                active: status === 'CONFIRMED'
            });
            // Re-sort so newest is top if we want timeline style, but screenshot shows single active line in stepper
        }

        return {
            ...data,
            date: new Date(data.createdAt).toLocaleDateString(),
            trackingSteps
        };
    };

    useEffect(() => {
        const fetchOrder = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');

                // If we have state data passed from "Order Success" page, we can show that immediately
                // ensuring the user doesn't get kicked out even if the token check fails initially.
                if (!token) {
                    if (location.state?.order) {
                        console.log("No token, but found state from previous page. Using that.");
                        setOrder(processOrderData(location.state.order));
                        setLoading(false);
                        return;
                    }

                    // Only redirect if we have absolutely NO data to show
                    navigate('/login');
                    return;
                }

                const response = await api.get(`/orders/${id}`);

                const fetchedOrder = response.data;
                const processedOrder = processOrderData(fetchedOrder);
                setOrder(processedOrder);

            } catch (err) {
                console.error("Failed to fetch order:", err);
                if (location.state?.order) {
                    setOrder(location.state.order);
                } else {
                    setError('Order not found or access denied.');
                }
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchOrder();
    }, [id, navigate, location.state]);

    // Auto-select payment type based on method
    useEffect(() => {
        if (order) {
            const isOnline = order.paymentMethod === 'ONLINE_PAYMENT' || order.paymentMethod === 'BANK_TRANSFER';
            setPaymentSelection(isOnline ? 'full' : 'advance');
        }
    }, [order]);

    if (loading) return <div className="p-12 text-center text-gray-500">Loading order details...</div>;
    if (error) return <div className="p-12 text-center text-red-500">{error}</div>;
    if (!order) return null;

    // Dynamic Label for Step 3 based on delivery method
    // Dynamic Label for Step 3 based on delivery method
    const deliveryMethod = order.delivery?.deliveryMethod || 'Standard';
    const isPickup = deliveryMethod === 'Pickup' || (!order.delivery?.address && !order.address);
    const deliveryStepLabel = isPickup ? 'Ready for Pickup' : 'Out for Delivery';

    // Define Steps for Horizontal Stepper
    let steps = [
        { id: 'placed', label: 'Placed', icon: Clock },
        { id: 'confirmed', label: 'Confirmed by admin', icon: CheckCircle },
        { id: 'preparing', label: 'Preparing', icon: Package },
        { id: 'out_for_delivery', label: deliveryStepLabel, icon: Truck },
        { id: 'delivered', label: 'Delivered', icon: CheckCircle }
    ];

    // Always insert 'Payment' step now since Advance is mandatory
    const isOnlinePayment = order.paymentMethod === 'ONLINE_PAYMENT' || order.paymentMethod === 'BANK_TRANSFER';
    steps.splice(2, 0, { id: 'payment', label: isOnlinePayment ? 'Full Payment' : 'Advance Payment', icon: CreditCard });

    // Determine Current Step Index for Progress Bar
    const getStatusIndex = (status) => {
        const s = status ? status.toUpperCase() : '';
        // const isOnline = order.paymentMethod === 'ONLINE_PAYMENT' || order.paymentMethod === 'BANK_TRANSFER';
        const isAdvancePaid = order.advanceStatus === 'APPROVED';
        const isAdvanceUploaded = order.advanceStatus === 'UPLOADED';

        if (s === 'NEW' || s === 'ORDER_PLACED') return 0;

        // Confirmed Step
        if (s === 'CONFIRMED' || s === 'ADMIN_CONFIRMED') {
            return 2; // We are ON Payment step (waiting for upload/approval). 
            // If Paid, it shows as Completed but next step (Preparing) is NOT active yet.
            // Wait, if 0 is Placed, 1 is Confirmed. Return 1 means 0 is checked, 1 is Active?
            // Usually simpler: 
            // 0: Placed (Active)
            // 1: Confirmed (Active)
            // 2: Payment (Active)
        }

        // 0:Placed, 1:Confirmed, 2:Payment, 3:Preparing, 4:Ready/Out, 5: Delivered

        if (s === 'PREPARING') return 3;
        if (s === 'READY' || s === 'OUT_FOR_DELIVERY') return 4;
        if (s === 'DELIVERED') return 5;

        return 0;
    };

    let currentStepIndex = getStatusIndex(order.status);
    if (order.status === 'CANCELLED') currentStepIndex = -1;

    // Special case: If status is just CONFIRMED but Payment IS Approved, effectively we are at Payment step.
    if ((order.status === 'CONFIRMED' || order.status === 'ADMIN_CONFIRMED') &&
        (order.paymentStatus === 'PAYMENT_APPROVED_BY_ADMIN' || order.paymentStatus === 'PAID') &&
        (order.paymentMethod === 'ONLINE_PAYMENT' || order.paymentMethod === 'BANK_TRANSFER')) {
        currentStepIndex = 2; // Force to Payment Step
    }

    // Actions
    const handleCancel = async () => {
        setIsCancelling(true);
        try {
            await api.put(`/orders/${order.id}/cancel`);
            toast.success('Order cancelled successfully.');
            navigate('/orders');
        } catch (e) {
            console.error(e);
            toast.error(e.response?.data?.error || 'Failed to cancel order.');
        } finally {
            setIsCancelling(false);
            setIsCancelModalOpen(false);
        }
    };

    const handleEditOrder = () => {
        if (!order) return;

        // Condition Verification logic matching backend
        const isCustomOrBulk = order.orderType === 'CUSTOM' || order.orderType === 'BULK' || order.isCustom || order.isBulk;
        const paymentStatus = order.paymentStatus;
        const status = order.status;
        const isEdited = order.isEdited;

        const deliveryDate = new Date(order.details?.deliveryDate || order.deliveryDate || order.expected || new Date());
        const today = new Date();
        deliveryDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24));

        if (!isCustomOrBulk || paymentStatus === 'PAID' || status === 'PREPARING' || status === 'OUT_FOR_DELIVERY' || status === 'DELIVERED' || status === 'CANCELLED' || diffDays < 2 || isEdited) {
            alert("This order cannot be edited. Orders can only be modified once, before payment, and at least 2 days before the delivery date.");
            return;
        }

        // Open modal
        const dDate = new Date(order.details?.deliveryDate || order.deliveryDate || new Date());
        const formattedDate = dDate.toISOString().split('T')[0];

        setEditFormData({
            deliveryDate: formattedDate,
            address: order.details?.address || order.address || order.delivery?.address || '',
            specialNotes: order.specialNotes || ''
        });
        setIsEditModalOpen(true);
    };

    const submitEditOrder = async (e) => {
        e.preventDefault();
        try {
            setUploading(true);
            const token = localStorage.getItem('token');
            const payload = {
                detailsOnly: true,
                items: order.items.map(i => ({
                    variantId: i.variant?.id || i.variantId || null,
                    quantity: i.quantity,
                    price: i.unitPrice
                })),
                total: order.total,
                discount: order.loyaltyDiscount || 0,
                deliveryFee: order.delivery?.deliveryFee || 0,
                paymentMethod: order.paymentMethod,
                orderType: order.orderType || (order.isCustom ? 'CUSTOM' : order.isBulk ? 'BULK' : 'REGULAR'),
                specialNotes: editFormData.specialNotes,
                details: {
                    name: order.customer?.name || order.details?.name,
                    phone: order.customer?.phone || order.details?.phone,
                    address: editFormData.address,
                    deliveryMethod: order.delivery?.deliveryMethod || 'Standard',
                    deliveryDate: editFormData.deliveryDate
                }
            };
            
            const response = await api.put(`/orders/${order.id}`, payload);
            alert("Order updated successfully!");
            setIsEditModalOpen(false);
            
            // Refresh
            const refreshed = await api.get(`/orders/${order.id}`);
            setOrder(processOrderData(refreshed.data));
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || "Failed to update order");
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
            alert("Only JPG, PNG and PDF allowed");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            // Assuming endpoint exists
            await api.post(`/orders/${order.id}/upload-slip`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert('Payment slip uploaded successfully. Waiting for admin approval.');
            // Refresh
            const response = await api.get(`/orders/${id}`);
            setOrder(processOrderData(response.data));
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    // ... (previous code) ...


    // ... (existing handlers) ...

    // UI Logic for Payment
    // Allowed: ORDER_PLACED/NEW, ADMIN_CONFIRMED, PREPARING, READY_FOR_DELIVERY
    const allowedPaymentStatuses = ['NEW', 'ORDER_PLACED', 'ADMIN_CONFIRMED', 'CONFIRMED', 'PREPARING', 'ready', 'OUT_FOR_DELIVERY'];
    const showPaymentButton = order &&
        (order.paymentMethod === 'ONLINE_PAYMENT' || order.paymentMethod === 'BANK_TRANSFER') &&
        allowedPaymentStatuses.includes(order.status) &&
        order.paymentStatus !== 'PAYMENT_APPROVED_BY_ADMIN' &&
        order.status !== 'DELIVERED' && order.status !== 'CANCELLED';

    // UI Logic for Feedback
    // Only if DELIVERED and no feedback yet. (Assuming API doesn't return existing feedback yet, checking logic if we should fetch it or just assume)
    // For now, if delivered, show button. If already submitted, modal or logic can handle.
    const showFeedbackButton = order && order.status === 'DELIVERED';

    // UI Logic for Edit/Cancel
    // Allowed: ORDER_PLACED/NEW, ADMIN_CONFIRMED
    const allowedEditStatuses = ['NEW', 'ORDER_PLACED', 'ADMIN_CONFIRMED', 'CONFIRMED'];
    const canEditOrCancel = order && allowedEditStatuses.includes(order.status);

    return (
        <div className="min-h-screen relative overflow-hidden bg-gray-50 font-sans pb-12">
            {/* Background Image Overlay - Modern Subtle Branding */}
            <div 
                className="absolute inset-0 z-0 pointer-events-none opacity-[0.06]"
                style={{ 
                    backgroundImage: 'url(/assets/tracking_bg.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed'
                }}
            />

            <div className="relative z-10">
            {/* Feedback Modal */}
            <FeedbackModal
                open={isFeedbackOpen}
                onClose={() => setIsFeedbackOpen(false)}
                orderId={order.id}
                onSuccess={() => {
                    // Refresh order to maybe hide button if we track that
                }}
            />

            {/* Invoice Modal */}
            <InvoiceModal
                isOpen={isInvoiceOpen}
                onClose={() => setIsInvoiceOpen(false)}
                invoiceData={invoiceData}
            />

            {/* Edit Order Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
                        <div className="bg-gradient-to-r from-pink-500 to-orange-400 p-6 text-white text-center">
                            <h3 className="text-xl font-bold">Edit Order Details</h3>
                            <p className="opacity-90 text-sm mt-1">Modify delivery information and notes</p>
                        </div>
                        <form onSubmit={submitEditOrder} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Delivery Date</label>
                                <input
                                    type="date"
                                    required
                                    min={new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().split('T')[0]}
                                    value={editFormData.deliveryDate}
                                    onChange={e => setEditFormData({ ...editFormData, deliveryDate: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Delivery Address</label>
                                <textarea
                                    required
                                    rows="2"
                                    value={editFormData.address}
                                    onChange={e => setEditFormData({ ...editFormData, address: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none transition"
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Special Notes</label>
                                <textarea
                                    rows="2"
                                    value={editFormData.specialNotes}
                                    onChange={e => setEditFormData({ ...editFormData, specialNotes: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none transition"
                                ></textarea>
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
                                    Cancel
                                </button>
                                <button type="submit" disabled={uploading} className={`flex-1 py-3 text-sm font-bold text-white bg-pink-600 rounded-xl transition ${uploading ? 'opacity-50' : 'hover:bg-pink-700 shadow-lg shadow-pink-200'}`}>
                                    {uploading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Cancel Order Confirmation Modal */}
            {isCancelModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="bg-red-500 p-6 text-white text-center">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <XCircle className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold">Cancel Order?</h3>
                            <p className="opacity-90 text-sm mt-1">This action cannot be undone.</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <p className="text-xs font-black text-amber-800 uppercase tracking-wide mb-1">⚠️ No Refund Policy</p>
                                <p className="text-sm text-amber-700 leading-relaxed">
                                    Cancellations are <strong>only allowed before any payment is made.</strong> Once a payment slip is uploaded, orders cannot be cancelled. There are <strong>no refunds</strong> for this service.
                                </p>
                            </div>
                            <p className="text-sm text-gray-600 text-center">
                                Are you sure you want to cancel <strong>Order #{order?.id}</strong>?
                            </p>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCancelModalOpen(false)}
                                    disabled={isCancelling}
                                    className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                                >
                                    Keep Order
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    disabled={isCancelling}
                                    className="flex-1 py-3 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition shadow-lg shadow-red-200 disabled:opacity-50"
                                >
                                    {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">


                {/* Back Link */}
                <button onClick={() => navigate('/orders')} className="flex items-center text-pink-600 font-bold hover:underline mb-2 text-sm">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back to Orders
                </button>

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">Order Tracking</h1>

                    {/* Header Info */}
                    <div className="flex justify-between items-start mb-12">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-bold text-gray-900">Order # {order.id}</h2>
                                <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                    {order.status === 'NEW' ? 'Placed' : order.status}
                                </span>
                            </div>
                            <p className="text-gray-500 text-sm mt-1">Placed on {order.date}</p>
                        </div>
                    </div>

                    {/* Stepper Logic */}
                    {order.status !== 'CANCELLED' && (
                        <div className="relative mb-16">
                            {/* Gray Background Line */}
                            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-100 rounded-full mx-10 -z-0"></div>

                            {/* Pink Progress Line */}
                            <div
                                className="absolute top-5 left-0 h-1 bg-pink-500 rounded-full mx-10 -z-0 transition-all duration-500"
                                style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100 - 5}%` }}
                            ></div>

                            {/* Steps */}
                            <div className="flex justify-between items-start relative z-10 w-full px-4">
                                {steps.map((step, idx) => {
                                    const Icon = step.icon;
                                    const isActive = idx === currentStepIndex;
                                    const isCompleted = idx <= currentStepIndex;

                                    return (
                                        <div key={step.id} className="flex flex-col items-center w-24 text-center">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-all duration-300 border-2 ${isActive
                                                ? 'bg-pink-500 border-pink-500 text-white shadow-lg scale-110'
                                                : isCompleted
                                                    ? 'bg-white border-pink-500 text-pink-500'
                                                    : 'bg-white border-gray-200 text-gray-300'
                                                }`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <p className={`text-[10px] font-bold uppercase tracking-wider ${isCompleted ? 'text-gray-800' : 'text-gray-400'
                                                }`}>
                                                {step.label}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Order Updates Section */}
                    {/* PAYMENT SECTION - MANDATORY ADVANCE */}
                    {/* Logic: 
                        1. If status is NEW: Show "Pending Confirmation" notice.
                        2. If status is CONFIRMED and advanceStatus is PENDING/REJECTED: Show Pay Button. 
                        3. If advanceStatus is UPLOADED: Show "Waiting for Approval".
                    */}
                    {order.status === 'NEW' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8 flex items-start gap-3">
                            <span className="text-xl">⏳</span>
                            <div>
                                <h3 className="font-bold text-yellow-800">Order Waiting for Confirmation</h3>
                                <p className="text-sm text-yellow-700 mt-1">
                                    Our team will review your order shortly. Once confirmed, you will be able to pay the <strong>{(order.paymentMethod === 'ONLINE_PAYMENT' || order.paymentMethod === 'BANK_TRANSFER') ? 'Full Payment' : 'Mandatory Advance (30%)'}</strong> here to start processing.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Show Pay Button or Status if Confirmed */}
                    {/* PAYMENT LOGIC & UI */}
                    {(() => {
                        const deliveryDate = order.deliveryDate ? new Date(order.deliveryDate) : new Date();
                        deliveryDate.setDate(deliveryDate.getDate() - 2); // Deadline is 2 days before
                        const isDeadlinePassed = new Date() > deliveryDate;
                        const isOnline = order.paymentMethod === 'ONLINE_PAYMENT' || order.paymentMethod === 'BANK_TRANSFER';
                        const isFullyPaid = order.paymentStatus === 'PAID';
                        const isAdvanceApproved = order.advanceStatus === 'APPROVED';
                        const isUploaded = order.advanceStatus === 'UPLOADED';

                        let statusTitle = isOnline ? '⚠️ Full Payment Required Before Prepare' : '⚠️ Mandatory Advance Payment Required';
                        let containerClass = 'bg-pink-50 border-pink-200 shadow-sm';
                        let titleColor = 'text-pink-900';

                        if (isFullyPaid) {
                            statusTitle = '✅ Payment Completed';
                            containerClass = 'bg-green-50 border-green-200';
                            titleColor = 'text-green-900';
                        } else if (isAdvanceApproved) {
                            if (isOnline) {
                                statusTitle = '⚠️ Balance Payment Required';
                                containerClass = 'bg-orange-50 border-orange-200';
                                titleColor = 'text-orange-900';
                            } else {
                                statusTitle = '✅ Advance Payment Approved';
                                containerClass = 'bg-green-50 border-green-200';
                                titleColor = 'text-green-900';
                            }
                        } else if (isUploaded) {
                            statusTitle = '⏳ Slip Uploaded - Waiting for Approval';
                            containerClass = 'bg-blue-50 border-blue-200';
                            titleColor = 'text-blue-900';
                        }

                        // Render
                        if (order.status === 'CONFIRMED' || order.status === 'ADMIN_CONFIRMED' || order.status === 'PREPARING') {
                            return (
                                <div className={`rounded-xl p-6 mb-8 border ${containerClass}`}>
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div>
                                            <h3 className={`font-bold ${titleColor}`}>{statusTitle}</h3>

                                            {isFullyPaid || (isAdvanceApproved && !isOnline) ? (
                                                <p className="text-sm text-green-700 mt-1">
                                                    Thank you! Your order is now being prepared. <br />
                                                    {isOnline ? 'Full payment received.' : `Balance to Pay: Rs.${(order.balanceAmount || (order.total * 0.7)).toLocaleString()} via Cash on Delivery.`}
                                                </p>
                                            ) : (
                                                <div className="mt-2 space-y-2">
                                                    <p className="text-sm text-gray-700">
                                                        {isAdvanceApproved
                                                            ? "Advance accepted. Please pay the remaining balance on delivery."
                                                            : (isOnline
                                                                ? "Payment required: Please pay the Full Amount to confirm your order."
                                                                : "Please pay the Advance Amount to confirm your order.")
                                                        }
                                                    </p>

                                                    {/* Amount Cards */}
                                                    <div className="flex gap-4 text-sm mt-1">
                                                        {/* Advance Card - ONLY FOR COD */}
                                                        {!isOnline && !isAdvanceApproved && (
                                                            <div
                                                                onClick={() => setPaymentSelection('advance')}
                                                                className={`px-4 py-3 rounded-lg border transition-all relative cursor-pointer ${paymentSelection === 'advance'
                                                                    ? 'bg-pink-100 border-pink-600 ring-2 ring-pink-500 ring-offset-1'
                                                                    : 'bg-pink-50 border-pink-200 hover:bg-pink-100'
                                                                    }`}
                                                            >
                                                                {paymentSelection === 'advance' && (
                                                                    <div className="absolute -top-2 -right-2 bg-pink-600 text-white rounded-full p-0.5 shadow-sm">
                                                                        <CheckCircle className="w-4 h-4" />
                                                                    </div>
                                                                )}
                                                                <span className="block text-xs uppercase font-bold text-pink-700">Advance (30%)</span>
                                                                <span className="font-bold text-pink-900 text-lg">Rs. {(order.total * 0.3).toLocaleString()}</span>
                                                            </div>
                                                        )}

                                                        {/* Full Amount Card - ONLY FOR ONLINE */}
                                                        {isOnline && !isFullyPaid && (
                                                            <div
                                                                onClick={() => setPaymentSelection('full')}
                                                                className={`px-4 py-3 rounded-lg border transition-all relative cursor-pointer ${paymentSelection === 'full'
                                                                    ? 'bg-green-100 border-green-600 ring-2 ring-green-500 ring-offset-1'
                                                                    : 'bg-green-50 border-green-200 hover:bg-green-100'
                                                                    }`}
                                                            >
                                                                {paymentSelection === 'full' && (
                                                                    <div className="absolute -top-2 -right-2 bg-green-600 text-white rounded-full p-0.5 shadow-sm">
                                                                        <CheckCircle className="w-4 h-4" />
                                                                    </div>
                                                                )}
                                                                <span className="block text-xs uppercase font-bold text-green-700">
                                                                    Full Amount (100%)
                                                                </span>
                                                                <span className="font-bold text-green-900 text-lg">
                                                                    Rs. {order.total.toLocaleString()}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="text-xs text-gray-600 bg-white/50 p-2 rounded mt-2">
                                                        <p><strong>Bank:</strong> Commercial Bank</p>
                                                        <p><strong>A/C:</strong> 1234 5678 9000 (Kavi Cakes)</p>
                                                    </div>
                                                </div>
                                            )}

                                            {order.bankSlip && (
                                                <a href={order.bankSlip} target="_blank" rel="noreferrer" className="text-xs font-bold underline mt-2 block hover:text-pink-600">
                                                    View Last Uploaded Slip
                                                </a>
                                            )}
                                        </div>

                                        {/* Upload Button */}
                                        {(!isFullyPaid && (!isAdvanceApproved || isOnline)) && (
                                            <div className="shrink-0 text-center">
                                                <label className={`flex items-center gap-2 px-6 py-3 bg-pink-600 text-white font-bold rounded-xl cursor-pointer hover:bg-pink-700 transition shadow-lg shadow-pink-200 ${uploading ? 'opacity-50' : ''}`}>
                                                    <Upload className="w-4 h-4" />
                                                    <span>
                                                        {uploading ? 'Uploading...'
                                                            : isUploaded ? 'Re-upload Slip'
                                                                : isAdvanceApproved ? 'Upload Balance Slip'
                                                                    : 'Pay Now'}
                                                    </span>
                                                    <input type="file" className="hidden" onChange={handleFileChange} disabled={uploading} accept=".jpg,.jpeg,.png,.pdf" />
                                                </label>
                                                <p className="text-[10px] text-pink-400 mt-2 font-medium">Upload Bank Slip (JPG/PDF)</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })()}

                    <div className="mt-8">
                        <h3 className="font-bold text-gray-900 mb-4 text-sm">Order Updates</h3>
                        <div className="flex flex-col md:flex-row justify-between items-start gap-8">

                            {/* Timeline */}
                            <div className="space-y-6 flex-1">
                                <div className="flex gap-4 relative">
                                    <div className="mt-1.5 relative z-10">
                                        <div className="w-3 h-3 rounded-full bg-pink-500 ring-4 ring-pink-50"></div>
                                    </div>
                                    {/* Vertical Line if needed later */}
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1 font-medium">{order.date}, {new Date(order.createdAt).toLocaleTimeString()}</p>
                                        <p className="font-bold text-sm text-gray-900">
                                            {order.status === 'NEW' ? 'Placed' :
                                                order.status === 'CONFIRMED' ? 'Confirmed by Admin' :
                                                    order.status}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                            {order.status === 'NEW' ? 'Order received and is pending confirmation' :
                                                order.status === 'CONFIRMED' ? 'Your order has been accepted by the store.' :
                                                    'Status updated.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 shrink-0 self-start md:self-end">
                                {canEditOrCancel && (
                                    <>
                                        <button
                                            onClick={handleCancel}
                                            className="px-6 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors text-sm shadow-sm"
                                        >
                                            Cancel Order
                                        </button>
                                        {(order.isCustom || order.isBulk || order.orderType === 'CUSTOM' || order.orderType === 'BULK') && (
                                            <button
                                                onClick={handleEditOrder}
                                                className="px-6 py-2 bg-orange-400 text-white font-bold rounded-lg hover:bg-orange-500 transition-colors text-sm shadow-sm"
                                            >
                                                Edit Order
                                            </button>
                                        )}
                                    </>
                                )}

                                {showFeedbackButton && (
                                    <>
                                        <button
                                            onClick={handleViewInvoice}
                                            disabled={fetchingInvoice}
                                            className="px-6 py-2 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-700 transition-colors text-sm shadow-sm flex items-center gap-2"
                                        >
                                            <FileText className="w-4 h-4" />
                                            {fetchingInvoice ? 'Loading...' : 'View Invoice'}
                                        </button>
                                        <button
                                            onClick={() => setIsFeedbackOpen(true)}
                                            className="px-6 py-2 bg-yellow-400 text-white font-bold rounded-lg hover:bg-yellow-500 transition-colors text-sm shadow-sm flex items-center gap-2"
                                        >
                                            <Star className="w-4 h-4 fill-white" />
                                            Rate Order
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Order Items & Info */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left: Order Items */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 h-full">
                            <h3 className="font-bold text-gray-900 mb-6 text-sm">Order Items</h3>
                            <div className="space-y-6">
                                {order.items?.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 items-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                                            <img src={item.image || "https://via.placeholder.com/150"} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                                            <p className="text-xs text-gray-500 mt-1">Quantity: {item.quantity}</p>
                                        </div>
                                        <div className="text-right font-bold text-gray-900 text-sm">
                                            Rs.{item.price ? (item.price * item.quantity).toLocaleString() : '0'}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-50 space-y-3">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Subtotal</span>
                                    <span>Rs.{(order.total - (order.deliveryFee || 300)).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Delivery Fee</span>
                                    <span>Rs.{order.deliveryFee || 300}</span>
                                </div>
                                <div className="flex justify-between text-base font-bold text-gray-900 pt-2">
                                    <span>Total</span>
                                    <span>Rs.{order.total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Info Sidebar */}
                    <div className="space-y-6">
                        {/* Delivery Info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-gray-900 mb-4 text-sm">Delivery Information</h3>
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <Calendar className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide">Delivery Date</p>
                                        <p className="text-xs font-bold text-gray-900">
                                            {order.delivery?.deliveryDate
                                                ? new Date(order.delivery.deliveryDate).toLocaleDateString()
                                                : order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'N/A'
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide">Delivery Address</p>
                                        <p className="text-xs font-bold text-gray-900 leading-relaxed">{order.details?.address || order.address || order.delivery?.address || 'Pickup'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <CreditCard className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide">Payment Method</p>
                                        <p className="text-xs font-bold text-gray-900">
                                            {order.paymentMethod === 'cod' || order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Bank Transfer'}
                                        </p>
                                        <p className="text-[10px] text-orange-500 font-bold mt-1">Payment Pending</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-gray-900 mb-4 text-sm">Contact Information</h3>
                            <div className="space-y-3">
                                <div className="flex gap-2 items-center">
                                    <span className="text-xs text-gray-400 w-10">Name:</span>
                                    <span className="text-xs font-bold text-gray-900">{order.customer?.name || order.details?.name}</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <span className="text-xs text-gray-400 w-10">Email:</span>
                                    <span className="text-xs font-bold text-gray-900 truncate">{order.customer?.email || order.details?.email}</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <span className="text-xs text-gray-400 w-10">Phone:</span>
                                    <span className="text-xs font-bold text-gray-900">{order.customer?.phone || order.details?.phone}</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-50">
                                <p className="text-xs font-bold text-gray-900 mb-2">Need Help?</p>
                                <p className="text-[10px] text-gray-500 mb-3 leading-relaxed">
                                    Contact our customer service if you have any questions about your order.
                                </p>
                                <button className="w-full py-2 bg-pink-500 text-white rounded-lg text-xs font-bold hover:bg-pink-600 transition">
                                    Contact Support
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);
};

export default OrderTrackingPage;
