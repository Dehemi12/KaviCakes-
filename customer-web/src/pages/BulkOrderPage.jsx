import React, { useState } from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import { useNavigate }
    from 'react-router-dom';
import { useCart } from '../context/CartContext';

const BulkOrderPage = () => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [pricingRules, setPricingRules] = useState([]);

    const [formData, setFormData] = useState({
        eventName: 'Annual Gathering',
        organization: 'Company ABC',
        quantity: 200,
        cakeType: 'Cupcakes',
        cakeFlavor: 'Chocolate',
        instructions: 'Use Blue and white Color theme'
    });

    // Fetch Bulk Pricing on Mount
    React.useEffect(() => {
        const fetchPricing = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/bulk-pricing');
                if (res.ok) {
                    const data = await res.json();
                    setPricingRules(data);
                }
            } catch (err) {
                console.error("Failed to fetch bulk pricing:", err);
            }
        };
        fetchPricing();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleProcessToCheckout = (e) => {
        e.preventDefault();

        // Basic Validation
        if (formData.quantity < 50) {
            alert("Minimum order quantity is 50.");
            return;
        }

        // Calculate Price based on rules or fallback
        let unitPrice = 250;
        const rule = pricingRules.find(r => r.categoryLabel === formData.cakeType);

        if (rule) {
            // Apply Database Logic
            if (formData.quantity >= rule.bulkThreshold) {
                unitPrice = parseFloat(rule.bulkPrice);
            } else {
                unitPrice = parseFloat(rule.basePrice);
            }
        } else {
            // Fallback Logic
            if (formData.quantity >= 100) unitPrice = 220;
        }

        const totalPrice = unitPrice * formData.quantity;

        const bulkItem = {
            id: 'BULK-' + Date.now(),
            name: `Bulk Order: ${formData.cakeType}`,
            description: `${formData.eventName} (${formData.quantity} items) - ${formData.cakeFlavor}`,
            price: totalPrice,
            image: 'https://images.unsplash.com/photo-1612203985729-ca8a88d7ad56?auto=format&fit=crop&q=80&w=300',
            quantity: 1
        };

        addToCart(bulkItem, { label: 'Bulk', isBulk: true, bulkDetails: formData }, 1);
        navigate('/checkout');
    };

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
                    <h2 className="text-lg font-bold text-gray-900 mb-8">Event Details</h2>

                    <form onSubmit={handleProcessToCheckout} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">

                            {/* Event Name */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-2">Event Name</label>
                                <input
                                    type="text"
                                    name="eventName"
                                    value={formData.eventName}
                                    onChange={handleChange}
                                    className="w-full py-2 border-b border-gray-200 focus:border-pink-500 focus:outline-none bg-transparent text-sm font-medium text-gray-900"
                                    placeholder="e.g. Annual Gathering"
                                />
                            </div>

                            {/* Organization */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-2">Organization</label>
                                <input
                                    type="text"
                                    name="organization"
                                    value={formData.organization}
                                    onChange={handleChange}
                                    className="w-full py-2 border-b border-gray-200 focus:border-pink-500 focus:outline-none bg-transparent text-sm font-medium text-gray-900"
                                    placeholder="Company Name"
                                />
                            </div>

                            {/* Quantity */}
                            <div className="col-span-1">
                                <label className="block text-xs font-medium text-gray-500 mb-2">Quantity</label>
                                <input
                                    type="number"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    className="w-full py-2 border-b border-gray-200 focus:border-pink-500 focus:outline-none bg-transparent text-sm font-medium text-gray-900"
                                    placeholder="200"
                                />
                                <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                                    Minimum order of 50 cakes. Orders of 100+ receive special pricing.
                                </p>
                            </div>

                            {/* Cake Type */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-2">Cake Type</label>
                                <select
                                    name="cakeType"
                                    value={formData.cakeType}
                                    onChange={handleChange}
                                    className="w-full py-2 border-b border-gray-200 focus:border-pink-500 focus:outline-none bg-transparent text-sm font-medium text-gray-900"
                                >
                                    <option>Cupcakes</option>
                                    <option>Mini Cakes</option>
                                    <option>Jar Cakes</option>
                                    <option>Brownies</option>
                                </select>
                            </div>

                            {/* Flavor */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-2">Cake Flavor</label>
                                <select
                                    name="cakeFlavor"
                                    value={formData.cakeFlavor}
                                    onChange={handleChange}
                                    className="w-full py-2 border-b border-gray-200 focus:border-pink-500 focus:outline-none bg-transparent text-sm font-medium text-gray-900"
                                >
                                    <option>Chocolate</option>
                                    <option>Vanilla</option>
                                    <option>Red Velvet</option>
                                    <option>Coffee</option>
                                </select>
                            </div>

                            {/* Instructions */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-500 mb-2">Special Instructions</label>
                                <textarea
                                    name="instructions"
                                    value={formData.instructions}
                                    onChange={handleChange}
                                    rows="1"
                                    className="w-full py-2 border-b border-gray-200 focus:border-pink-500 focus:outline-none bg-transparent text-sm font-medium text-gray-900 resize-none"
                                    placeholder="Any specific theme or branding requirements..."
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex justify-end pt-8">
                            <button
                                type="submit"
                                className="bg-pink-500 text-white px-8 py-3 rounded-lg font-bold text-sm shadow-md hover:bg-pink-600 transition-colors"
                            >
                                Process to checkout
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BulkOrderPage;
