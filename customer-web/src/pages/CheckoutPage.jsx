import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Check, Calendar, MapPin, CreditCard, ChevronRight, Truck } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const CheckoutPage = () => {
    // Destructure editingOrderId from CartContext
    const { cart, cartTotal, clearCart, loyaltyDiscount, setLoyaltyDiscount, editingOrderId, setEditingOrderId } = useCart();
    const { user, loading, refreshUser } = useAuth();
    const navigate = useNavigate();

    // Fresh User Profile for Points
    const [userProfile, setUserProfile] = useState(null);
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/auth/profile');
                setUserProfile(res.data);
            } catch (err) {
                console.error("Failed to fetch profile", err);
            }
        };
        fetchProfile();
    }, []);

    const currentUser = userProfile || user;
    const availablePointsRaw = currentUser?.loyaltyPoints || 0;

    // ... (rest of state)

    const [step, setStep] = useState(1);
    const [paymentType, setPaymentType] = useState('advance'); // Default 'advance' for COD. Will switch to 'full' for Online.
    const [formData, setFormData] = useState({
        deliveryDate: '',
        deliveryType: 'pickup', // pickup or delivery
        address: '',
        distance: '',
        deliveryInstructions: '',
        contactName: 'Dehemi Nimshara',
        contactPhone: '077 123 4567',
        contactEmail: 'deheminimshara@gmail.com',
        paymentMethod: 'cod',
        bankSlip: '' // URL of uploaded slip
    });

    const [isUrgentOrder, setIsUrgentOrder] = useState(false);
    const [agreeUrgent, setAgreeUrgent] = useState(false);
    const URGENT_ORDER_COST = 500;
    const URGENT_ORDER_THRESHOLD = 500;

    // Reject guest users
    useEffect(() => {
        if (!loading && !user) {
            // alert("Please login to proceed to checkout.");
            navigate('/login', { state: { from: '/checkout' } });
        }
    }, [user, loading, navigate]);

    // Distance Calculation Logic
    const [isCalculating, setIsCalculating] = useState(false);
    const [geoError, setGeoError] = useState('');
    const [isDistanceManual, setIsDistanceManual] = useState(false);

    // Upload Logic
    const [isUploading, setIsUploading] = useState(false);

    const SHOP_COORDS = { lat: 7.0014, lon: 79.9499 }; // Kadawatha Store Location

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert('File size exceeds 5MB');
            return;
        }

        setIsUploading(true);
        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            // Use direct fetch or axios. Assuming api base url is configurable.
            // Using standard fetch to relative path if proxy is set, or full path.
            // Since api.js uses VITE_API_BASE_URL, let's use that.
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
            const response = await fetch(`${baseUrl}/upload`, {
                method: 'POST',
                body: uploadData,
                // Do NOT set Content-Type header for FormData, browser sets it with boundary
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            setFormData(prev => ({ ...prev, bankSlip: data.url }));
        } catch (error) {
            console.error('Upload Error:', error);
            alert('Failed to upload slip. please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleAddressChange = (e) => {
        setFormData(prev => ({ ...prev, address: e.target.value }));
        setGeoError('');
        if (isDistanceManual) {
            setIsDistanceManual(false);
            setFormData(prev => ({ ...prev, distance: '' }));
        }
    };

    const calculateDistance = async () => {
        const address = formData.address;
        if (!address || address.length < 5) return;

        // Get the last phase of the address
        const addressParts = address.split(',');
        const lastPart = addressParts[addressParts.length - 1].trim();
        if (!lastPart) return;

        setIsCalculating(true);
        setGeoError('');

        try {
            // Using OpenStreetMap Nominatim API (Free)
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(lastPart + ', Sri Lanka')}`);
            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                const dist = getDistanceFromLatLonInKm(SHOP_COORDS.lat, SHOP_COORDS.lon, parseFloat(lat), parseFloat(lon));

                // Round to 2 decimals
                const roundedDist = Math.round(dist * 100) / 100;
                setFormData(prev => ({ ...prev, distance: roundedDist }));
                setIsDistanceManual(false);
            } else {
                setGeoError(`Could not auto-locate '${lastPart}'. Please enter distance manually.`);
                setIsDistanceManual(true);
            }
        } catch (error) {
            console.error("Geocoding error:", error);
            setGeoError('Connection error. Please enter distance manually.');
            setIsDistanceManual(true);
        } finally {
            setIsCalculating(false);
        }
    };

    // Haversine Formula
    const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2 - lat1);
        var dLon = deg2rad(lon2 - lon1);
        var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c; // Distance in km
        return d;
    }

    const deg2rad = (deg) => {
        return deg * (Math.PI / 180)
    }

    // Pre-fill user data if available and defaults are empty/generic
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                contactName: user.name || prev.contactName,
                contactEmail: user.email || prev.contactEmail,
                contactPhone: user.phone || prev.contactPhone,
                address: user.address || prev.address
            }));
        }
    }, [user]);

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
    // Note: If toggle is ON, loyaltyDiscount is > 0.
    const availablePointsForUrgent = availablePointsRaw - loyaltyDiscount;

    // Validate inputs 
    const canAffordUrgent = availablePointsForUrgent >= URGENT_ORDER_THRESHOLD;

    const finalTotal = cartTotal + deliveryFee - loyaltyDiscount;

    // Toggle Handler
    const handleLoyaltyToggle = () => {
        if (loyaltyDiscount > 0) {
            setLoyaltyDiscount(0);
        } else {
            const maxDiscount = Math.min(availablePointsRaw, cartTotal);
            setLoyaltyDiscount(maxDiscount);
        }
    };

    // Check for Bulk items
    const hasBulkItem = cart.some(item => item.variant?.isBulk || item.isBulk);

    // Minimum date logic
    // Bulk: 30 days
    // Standard: 5 days
    // Urgent: 2 days (Not applicable for Bulk)
    const getMinDateStandard = () => {
        const date = new Date();
        // If bulk, add 30 days. Else add 5 days.
        const daysToAdd = hasBulkItem ? 30 : 5;
        date.setDate(date.getDate() + daysToAdd);

        // Use local timezone offset adjustment
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
    };

    const getMinDateUrgent = () => {
        if (hasBulkItem) return null; // No urgent for bulk
        const date = new Date();
        date.setDate(date.getDate() + 2);
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
    };

    const isUrgentDate = (dateString) => {
        if (!dateString) return false;
        if (hasBulkItem) return false; // Bulk cannot be urgent

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

        // Bulk logic
        if (hasBulkItem) {
            return formData.deliveryDate >= minStandard;
        }

        const minUrgent = getMinDateUrgent();

        // If date is in urgent range (between minUrgent and minStandard)
        if (isUrgentOrder) {
            // Must have points and date must be >= minUrgent
            return canAffordUrgent && formData.deliveryDate >= minUrgent;
        }

        // Otherwise must be >= minStandard
        return formData.deliveryDate >= minStandard;
    };

    const isValidPhone = (phone) => {
        // Sri Lankan phone number validation: allows formats like 0712345678, +94712345678, 071 234 5678, etc.
        const phoneRegex = /^(?:0|0094|\+94)?(?:7\d{8}|[1-9]\d{8})$/;
        // Strip spaces before checking
        const strippedPhone = phone.replace(/\s+/g, '');
        return phoneRegex.test(strippedPhone);
    };

    const isDetailsValid = () => {
        const { contactName, contactPhone, contactEmail, deliveryType, address } = formData;
        if (!contactName || !contactPhone || !contactEmail) return false;
        
        if (!isValidPhone(contactPhone)) return false;

        if (deliveryType === 'delivery' && !address) return false;
        return true;
    };

    const calculateEarnedPoints = () => {
        return Math.floor(finalTotal / 100);
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmitOrder = async () => {
        if (!user) {
            alert("You must be logged in to place an order.");
            navigate('/login', { state: { from: '/checkout' } });
            return;
        }

        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            // Map formData to backend expectation with correct keys
            const detailsPayload = {
                name: formData.contactName,
                phone: formData.contactPhone,
                address: formData.address,
                method: formData.deliveryType === 'delivery' ? 'Standard' : 'Pickup',
                deliveryDate: formData.deliveryDate,
                email: formData.contactEmail,
                instructions: formData.deliveryInstructions
            };

            const orderPayload = {
                items: cart.map(item => ({
                    variantId: item.variant?.id || item.variantId || null, // Handle structure safely
                    quantity: item.quantity,
                    price: item.price,
                    name: item.productName || item.name || 'Unknown Item',
                    image: item.productImage || item.image || null,
                    // Metadata for Backend Validation
                    isCustom: item.isCustom,
                    customDetails: item.customDetails,
                    isBulk: item.isBulk,
                    bulkDetails: item.bulkDetails
                })),
                subtotal: cartTotal,
                discount: loyaltyDiscount,
                deliveryFee,
                total: finalTotal,
                details: detailsPayload,
                paymentMethod: formData.paymentMethod === 'online' ? 'ONLINE_PAYMENT' : 'COD',
                paymentType,
                bankSlip: formData.bankSlip, // Pass uploaded slip URL
                orderType: isUrgentOrder ? 'URGENT' : (hasBulkItem ? 'BULK' : 'REGULAR'),
                specialNotes: formData.deliveryInstructions
            };

            let res;
            if (editingOrderId) {
                console.log("Updating existing order:", editingOrderId);
                // Update existing order
                res = await api.put(`/orders/${editingOrderId}`, orderPayload);
            } else {
                console.log("Creating new order");
                // Create new order
                res = await api.post('/orders', orderPayload);
            }

            if (res.status === 201 || res.status === 200) {
                const newOrder = res.data.order;

                // Sync User State (Points Deducted)
                await refreshUser();

                // Navigation Logic
                if (hasBulkItem) {
                    navigate('/order-success', { state: { order: newOrder, type: 'bulk', message: editingOrderId ? 'Order updated successfully' : 'Order placed successfully' } });
                } else {
                    navigate('/order-success', { state: { order: newOrder, message: editingOrderId ? 'Order updated successfully' : 'Order placed successfully' } });
                }
                clearCart();
                // Clear edit state
                if (editingOrderId) {
                    setEditingOrderId(null);
                    localStorage.removeItem('kavicakes_editing_order_id');
                }
            }
        } catch (e) {
            console.error("Order submission error:", e);
            if (e.response && (e.response.status === 401 || e.response.status === 403)) {
                // Handled by interceptor (redirect to login)
                return;
            }
            const errorMsg = e.response?.data?.error || "Failed to place order. Please try again.";
            alert(errorMsg);
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
    );

    return (
        <div className="bg-gray-50 min-h-screen py-12 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
                    {editingOrderId && (
                        <div className="flex items-center gap-4 bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200">
                            <span className="text-sm text-yellow-800 font-medium">Editing Order #{editingOrderId}</span>
                            <button
                                onClick={() => {
                                    setEditingOrderId(null);
                                    localStorage.removeItem('kavicakes_editing_order_id');
                                    window.location.reload(); // Hard refresh to ensure state is clean
                                }}
                                className="text-xs bg-white text-gray-600 px-3 py-1 rounded border border-gray-200 hover:text-red-600 hover:border-red-200"
                            >
                                Cancel Edit
                            </button>
                        </div>
                    )}
                </div>

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
                                            min={new Date().toISOString().split('T')[0]}
                                            value={formData.deliveryDate}
                                            onChange={handleDateChange}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900"
                                        />
                                        <Calendar className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                                        Please note: We require at least 5 days notice for all cake orders.
                                        {hasBulkItem && (
                                            <span className="block text-pink-600 font-bold mt-1">
                                                Bulk orders require at least 30 days notice.
                                            </span>
                                        )}
                                        {!hasBulkItem && canAffordUrgent && " If you have 500 loyalty points, you can place order within 5 days ( use 500 points )"}
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

                                {!isDateValid() && formData.deliveryDate && !isUrgentOrder && (
                                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-xs flex items-center">
                                        <span className="mr-2">⚠️</span>
                                        {hasBulkItem
                                            ? "Bulk orders require at least 30 days notice."
                                            : "Please select a date at least 5 days from today."
                                        }
                                    </div>
                                )}

                                {isUrgentOrder && !canAffordUrgent && (
                                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-xs flex items-center">
                                        <span className="mr-2">⚠️</span>
                                        You do not have enough loyalty points (500 required) for this urgent order date.
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
                                                onChange={handleAddressChange}
                                                onBlur={calculateDistance}
                                                className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500 text-sm"
                                                placeholder="1/21/A, 1st lane, Colombo 8"
                                            />
                                            {isCalculating && <p className="text-[10px] text-pink-500 mt-1 animate-pulse">Calculating distance...</p>}
                                            {geoError && <p className="text-[10px] text-red-500 mt-1">{geoError}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Calculated Distance (km)</label>
                                            <div className="relative max-w-[100px]">
                                                <input
                                                    type="number"
                                                    value={formData.distance || ''}
                                                    readOnly={!isDistanceManual}
                                                    onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                                                    className={`w-full p-3 rounded-xl border focus:outline-none text-sm ${isDistanceManual ? 'border-pink-500 bg-white' : 'border-gray-200 bg-gray-50 text-gray-500'}`}
                                                    placeholder="0"
                                                />
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                {formData.distance > 0 ? `Fee calculated based on ${formData.distance} km` : 'Enter address to calculate'}
                                            </p>
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
                                    <h4 className="text-sm font-medium text-gray-900">Recipient Details</h4>
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
                                                className={`w-full py-2 border-b focus:outline-none bg-transparent text-sm font-medium text-gray-900 placeholder-gray-300 ${formData.contactPhone && !isValidPhone(formData.contactPhone) ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'}`}
                                                placeholder="0771234567"
                                            />
                                            {formData.contactPhone && !isValidPhone(formData.contactPhone) && (
                                                <p className="text-[10px] text-red-500 mt-1">Please enter a valid Sri Lankan phone number (e.g. 0771234567).</p>
                                            )}
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
                                    <h3 className="text-sm font-medium text-gray-700 mb-4">Select Payment Method for Balance</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div
                                            onClick={() => {
                                                setFormData({ ...formData, paymentMethod: 'online' });
                                                setPaymentType('full');
                                            }}
                                            className={`p-6 rounded-xl border cursor-pointer transition-all relative ${formData.paymentMethod === 'online' ? 'border-pink-500 bg-pink-50/30' : 'border-gray-200 hover:border-pink-200'}`}
                                        >
                                            <div className="flex items-start">
                                                <div className={`w-5 h-5 rounded-full border mr-3 mt-1 flex items-center justify-center shrink-0 ${formData.paymentMethod === 'online' ? 'border-pink-500' : 'border-gray-300'}`}>
                                                    {formData.paymentMethod === 'online' && <div className="w-2.5 h-2.5 bg-pink-500 rounded-full"></div>}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-gray-900 block mb-1">Online Bank Payment</span>
                                                    <p className="text-xs text-gray-500">Full Amount or Balance via Transfer</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            onClick={() => {
                                                setFormData({ ...formData, paymentMethod: 'cod' });
                                                setPaymentType('advance');
                                            }}
                                            className={`p-6 rounded-xl border cursor-pointer transition-all relative ${formData.paymentMethod === 'cod' ? 'border-pink-500 bg-pink-50/30' : 'border-gray-200 hover:border-pink-200'}`}
                                        >
                                            <div className="flex items-start">
                                                <div className={`w-5 h-5 rounded-full border mr-3 mt-1 flex items-center justify-center shrink-0 ${formData.paymentMethod === 'cod' ? 'border-pink-500' : 'border-gray-300'}`}>
                                                    {formData.paymentMethod === 'cod' && <div className="w-2.5 h-2.5 bg-pink-500 rounded-full"></div>}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-gray-900 block mb-1">Cash on Delivery</span>
                                                    <p className="text-xs text-gray-500">Pay Balance Cash on Delivery</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* DYNAMIC PAYMENT NOTICE */}
                                    <div className={`mt-8 p-6 rounded-xl border animate-fade-in ${formData.paymentMethod === 'online' ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'}`}>
                                        <div className="flex items-start gap-3 mb-4">
                                            <span className="text-xl">ℹ️</span>
                                            <div>
                                                <h4 className="font-bold text-gray-900">
                                                    {formData.paymentMethod === 'online' ? 'Online Payment Terms' : 'COD Payment Process'}
                                                </h4>
                                                <p className="text-sm text-gray-700 mt-1">
                                                    {formData.paymentMethod === 'online'
                                                        ? "For Online Bank Payments, no advance is required. However, the full amount must be paid 2 days before the delivery date."
                                                        : "To ensure quality and commitment, we require an Advance Payment (30%) for all COD orders."}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 rounded-lg border border-opacity-50 mb-4">
                                            <h5 className="font-semibold text-gray-800 text-sm mb-3">How it works:</h5>
                                            <ol className="list-decimal list-inside space-y-2 text-xs text-gray-600">
                                                <li>Place your order simply by selecting your preferred method.</li>
                                                <li>Our team will review and <strong>Confirm</strong> your order availability.</li>
                                                {formData.paymentMethod === 'online' ? (
                                                    <li>Once confirmed, you will be notified to pay the <strong>Full Amount (Rs.{finalTotal.toLocaleString()})</strong> via the Order Tracking page at least 2 days before delivery.</li>
                                                ) : (
                                                    <li>Once confirmed, you will be notified to pay the <strong>Advance Amount (Rs.{(finalTotal * 0.30).toLocaleString()})</strong> via the Order Tracking page to start processing.</li>
                                                )}
                                                <li>Order preparation begins only after {formData.paymentMethod === 'online' ? 'full payment' : 'advance payment'} validation.</li>
                                            </ol>
                                        </div>
                                    </div>

                                    <div className="flex justify-between mt-8">
                                        <button onClick={handleBack} className="text-gray-500 font-medium hover:text-gray-900">Back</button>
                                        <button
                                            onClick={handleSubmitOrder}
                                            disabled={isSubmitting}
                                            className="bg-pink-600 text-white px-8 py-3 rounded-md font-medium hover:bg-pink-700 shadow-md hover:shadow-xl transition-all w-full md:w-auto disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Processing...
                                                </>
                                            ) : (
                                                'Place Order'
                                            )}
                                        </button>
                                    </div>
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

                            {/* Loyalty Points Toggle */}
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">Use Loyalty Points</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={loyaltyDiscount > 0}
                                            onChange={handleLoyaltyToggle}
                                            disabled={availablePointsRaw === 0}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                                    </label>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Available: {availablePointsRaw} points</span>
                                    {loyaltyDiscount > 0 && <span className="text-pink-600 font-bold">-{loyaltyDiscount} applied</span>}
                                </div>
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
