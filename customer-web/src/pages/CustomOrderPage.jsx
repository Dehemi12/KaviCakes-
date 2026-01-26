import React, { useState } from 'react';
import { Upload, X, ChevronRight, Calendar, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const CustomOrderPage = () => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        // Basic Details
        cakeSize: '1 kg (Serves 10-12)',
        cakeShape: 'Round',
        flavor: 'Butterscotch',
        fillingType: 'Whipped Cream',
        frostingType: 'Buttercream',
        frostingColor: 'White',
        occasionDate: '2025-10-31',
        cakeCategory: 'Birthday Cake',

        // Design Details
        topDecoration: 'None',
        message: 'Happy Birthday Dad',
        designReference: null, // file
        instructions: 'not', // user typed 'not' in screenshot

        // Recipient
        recipientName: 'dehemi',
        recipientPhone: '0711515580',
        recipientEmail: 'deheminimshara@gmail.com'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleProceedToCheckout = () => {
        // Create a custom product object to add to cart
        const customProduct = {
            id: 'CUST-' + Date.now(),
            name: 'Custom Cake Order',
            description: `${formData.cakeSize}, ${formData.flavor}, ${formData.cakeShape}`,
            price: 5500, // Fixed mock price from screenshot
            image: 'https://images.unsplash.com/photo-1563729768-3980d7c74c6d?auto=format&fit=crop&q=80&w=300', // Generic placeholder
            isCustom: true,
            customDetails: formData
        };

        // Add to cart with a custom variant structure
        addToCart(customProduct, { label: 'Custom' }, 1);
        navigate('/checkout');
    };

    const steps = [
        { id: 1, label: 'Basic Details' },
        { id: 2, label: 'Design Details' },
        { id: 3, label: 'Review' }
    ];

    return (
        <div className="font-sans min-h-screen bg-gray-50 py-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Custom Cake Order</h1>
                    <p className="text-gray-500 mt-2">Design your dream cake for any special occasion</p>
                </div>

                {/* Stepper */}
                <div className="flex justify-center mb-12">
                    <div className="flex items-center w-full max-w-3xl px-4">
                        {steps.map((s, idx) => (
                            <React.Fragment key={s.id}>
                                <div className="flex flex-col items-center relative z-10">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${step >= s.id ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-500'
                                        }`}>
                                        {s.id}
                                    </div>
                                    <span className={`text-[10px] mt-2 font-medium uppercase tracking-wide ${step >= s.id ? 'text-pink-600' : 'text-gray-300'}`}>
                                        {s.label}
                                    </span>
                                </div>
                                {idx < 2 && (
                                    <div className={`flex-1 h-0.5 mx-4 ${step > idx + 1 ? 'bg-pink-600' : 'bg-gray-200'}`}></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Form Container */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden min-h-[600px] p-8 md:p-12 relative">

                    {/* Step 1: Basic Details */}
                    {step === 1 && (
                        <div className="animate-fade-in max-w-4xl mx-auto">
                            <h2 className="text-lg font-bold text-gray-900 mb-8 border-b pb-4">Basic Details</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-2">Cake Size</label>
                                    <select name="cakeSize" value={formData.cakeSize} onChange={handleChange} className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-pink-500 bg-transparent text-gray-900 font-medium text-sm">
                                        <option>1 kg (Serves 10-12)</option>
                                        <option>2 kg (Serves 20-25)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-2">Cake Shape</label>
                                    <select name="cakeShape" value={formData.cakeShape} onChange={handleChange} className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-pink-500 bg-transparent text-gray-900 font-medium text-sm">
                                        <option>Round</option>
                                        <option>Square</option>
                                        <option>Heart</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-2">Cake Flavor</label>
                                    <select name="flavor" value={formData.flavor} onChange={handleChange} className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-pink-500 bg-transparent text-gray-900 font-medium text-sm">
                                        <option>Butterscotch</option>
                                        <option>Chocolate</option>
                                        <option>Vanilla</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-2">Filling Type</label>
                                    <select name="fillingType" value={formData.fillingType} onChange={handleChange} className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-pink-500 bg-transparent text-gray-900 font-medium text-sm">
                                        <option>Whipped Cream</option>
                                        <option>Buttercream</option>
                                        <option>Ganache</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-2">Frosting Type</label>
                                    <select name="frostingType" value={formData.frostingType} onChange={handleChange} className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-pink-500 bg-transparent text-gray-900 font-medium text-sm">
                                        <option>Buttercream</option>
                                        <option>Fondant</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-2">Frosting Color</label>
                                    <select name="frostingColor" value={formData.frostingColor} onChange={handleChange} className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-pink-500 bg-transparent text-gray-900 font-medium text-sm">
                                        <option>White</option>
                                        <option>Pink</option>
                                        <option>Blue</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 mb-2">Occasion Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            name="occasionDate"
                                            value={formData.occasionDate}
                                            onChange={handleChange}
                                            className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-pink-500 bg-transparent text-gray-900 font-medium text-sm"
                                        />
                                        <Calendar className="absolute right-0 top-2 h-4 w-4 text-gray-400" />
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2">Date must be at least 5 days from today</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 mb-2">Cake Category</label>
                                    <select name="cakeCategory" value={formData.cakeCategory} onChange={handleChange} className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-pink-500 bg-transparent text-gray-900 font-medium text-sm">
                                        <option>Birthday Cake</option>
                                        <option>Wedding Cake</option>
                                        <option>Anniversary Cake</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-12 flex justify-end">
                                <button onClick={handleNext} className="bg-pink-500 text-white px-8 py-3 rounded-lg font-bold text-sm shadow-md hover:bg-pink-600 transition-colors">
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Design Details */}
                    {step === 2 && (
                        <div className="animate-fade-in max-w-4xl mx-auto">
                            <h2 className="text-lg font-bold text-gray-900 mb-8 border-b pb-4">Design Details</h2>

                            <div className="space-y-8">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-2">Top Decoration</label>
                                    <select name="topDecoration" value={formData.topDecoration} onChange={handleChange} className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-pink-500 bg-transparent text-gray-900 font-medium text-sm">
                                        <option>None</option>
                                        <option>Flowers</option>
                                        <option>Topper</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-2">Cake Message</label>
                                    <input
                                        type="text"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-pink-500 bg-transparent text-gray-900 font-medium text-sm"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">Leave blank if no message required</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-2">Design Reference (Optional)</label>
                                    <p className="text-sm font-medium text-gray-900">not</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-2">Special Instructions</label>
                                    <p className="text-sm font-medium text-gray-900">{formData.instructions}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-8 pt-4">
                                    <div className="col-span-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Recipient Details</div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Name</label>
                                        <input
                                            type="text"
                                            name="recipientName"
                                            value={formData.recipientName}
                                            onChange={handleChange}
                                            className="w-full border-none p-0 text-sm font-medium text-gray-900 focus:ring-0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Phone</label>
                                        <input
                                            type="text"
                                            name="recipientPhone"
                                            value={formData.recipientPhone}
                                            onChange={handleChange}
                                            className="w-full border-none p-0 text-sm font-medium text-gray-900 focus:ring-0"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                                        <input
                                            type="text"
                                            name="recipientEmail"
                                            value={formData.recipientEmail}
                                            onChange={handleChange}
                                            className="w-full border-none p-0 text-sm font-medium text-gray-900 focus:ring-0"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 flex justify-between">
                                <button onClick={handleBack} className="text-gray-500 font-medium text-sm hover:text-gray-900">Back</button>
                                <button onClick={handleNext} className="bg-pink-500 text-white px-8 py-3 rounded-lg font-bold text-sm shadow-md hover:bg-pink-600 transition-colors">
                                    Review Order
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Review */}
                    {step === 3 && (
                        <div className="animate-fade-in max-w-4xl mx-auto">
                            <h2 className="text-lg font-bold text-gray-900 mb-8 border-b pb-4">Review Your Custom Cake Order</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-6">Cake Specifications</h3>
                                    <div className="space-y-6">
                                        {[
                                            ['Cake Size', formData.cakeSize],
                                            ['Cake Flavor', formData.flavor],
                                            ['Frosting Type', formData.frostingType],
                                            ['Top Decoration', formData.topDecoration],
                                            ['Cake Category', formData.cakeCategory],
                                        ].map(([label, val]) => (
                                            <div key={label}>
                                                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                                                <p className="text-sm font-medium text-gray-900">{val}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-6 opacity-0 md:opacity-100">Details</h3>
                                    <div className="space-y-6">
                                        {[
                                            ['Cake Shape', formData.cakeShape],
                                            ['Filling Type', formData.fillingType],
                                            ['Frosting Color', formData.frostingColor],
                                            ['Occasion Date', formData.occasionDate],
                                        ].map(([label, val]) => (
                                            <div key={label}>
                                                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                                                <p className="text-sm font-medium text-gray-900">{val}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-12">
                                <h3 className="text-xs font-bold text-gray-500 uppercase mb-6">Design Details</h3>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-0.5">Cake Message</p>
                                        <p className="text-sm font-medium text-gray-900">{formData.message}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-0.5">Special Instructions</p>
                                        <p className="text-sm font-medium text-gray-900">{formData.instructions}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-0.5">Design Reference</p>
                                        <p className="text-sm font-medium text-gray-900">not</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h3 className="text-xs font-bold text-gray-500 uppercase mb-6">Contact Information</h3>
                                <div className="flex flex-wrap gap-12">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-0.5">Name</p>
                                        <p className="text-sm font-medium text-gray-900">{formData.recipientName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                                        <p className="text-sm font-medium text-gray-900">{formData.recipientPhone}</p>
                                    </div>
                                    <div className="w-full">
                                        <p className="text-xs text-gray-400 mb-0.5">Email</p>
                                        <p className="text-sm font-medium text-gray-900">{formData.recipientEmail}</p>
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-xs font-bold text-gray-900 mb-4">Total price</h3>
                            <div className="bg-pink-50 rounded-xl p-6 mb-8">
                                <p className="text-xs text-gray-500 mb-1">Based on your selections, the Order price is:</p>
                                <p className="text-2xl font-bold text-pink-600">Rs. 5,500</p>
                            </div>

                            <div className="flex justify-between items-center">
                                <button onClick={handleBack} className="text-gray-500 font-medium text-sm hover:text-gray-900">Back</button>
                                <button onClick={handleProceedToCheckout} className="bg-pink-500 text-white px-8 py-3 rounded-lg font-bold text-sm shadow-md hover:bg-pink-600 transition-colors">
                                    Proceed to Checkout
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default CustomOrderPage;
