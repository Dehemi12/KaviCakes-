import React, { useState, useEffect } from 'react';
import { Upload, X, ChevronRight, Calendar, Check, Link as LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../services/api';

const CustomOrderPage = () => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [step, setStep] = useState(1);
    const [price, setPrice] = useState(2500);

    const [formData, setFormData] = useState({
        // Basic Details
        cakeSize: '1 kg (Serves 10-12)',
        cakeShape: 'Round',
        flavor: 'Butterscotch',
        fillingType: 'Whipped Cream',
        frostingType: 'Buttercream',
        frostingColor: 'White',
        cakeCategory: 'Birthday Cake',

        // Design Details
        topDecoration: 'None',
        message: '',
        designLink: '',
        instructions: '',

        // Recipient
        recipientName: 'dehemi',
        recipientPhone: '0711515580',
        recipientEmail: 'deheminimshara@gmail.com'
    });

    const [designFile, setDesignFile] = useState(null);

    const [masterData, setMasterData] = useState({ sizes: [], shapes: [], flavors: [], categories: [] });
    const [loadingData, setLoadingData] = useState(true);

    // Fetch Master Data
    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await api.get('/cakes/master-data');
                setMasterData(res.data);

                // Set defaults if data loaded
                setFormData(prev => ({
                    ...prev,
                    cakeCategory: res.data.categories?.length ? res.data.categories[0].id : prev.cakeCategory,
                    cakeSize: res.data.sizes?.length ? res.data.sizes[0].label : prev.cakeSize,
                    cakeShape: res.data.shapes?.length ? res.data.shapes[0].label : prev.cakeShape,
                    flavor: res.data.flavors?.length ? res.data.flavors[0].label : prev.flavor
                }));
            } catch (err) {
                console.error("Failed to load pricing data", err);
            } finally {
                setLoadingData(false);
            }
        };
        loadData();
    }, []);

    // Price Calculation
    useEffect(() => {
        if (loadingData) return;

        let total = 0;

        // 1. Base Price from Category
        const cat = masterData.categories.find(c => String(c.id) === String(formData.cakeCategory) || c.name === formData.cakeCategory);
        if (cat) total += Number(cat.basePrice || 0);

        // 2. Modifiers
        const size = masterData.sizes.find(s => s.label === formData.cakeSize);
        if (size) total += Number(size.price || 0);

        const shape = masterData.shapes.find(s => s.label === formData.cakeShape);
        if (shape) total += Number(shape.price || 0);

        const flavor = masterData.flavors.find(f => f.label === formData.flavor);
        if (flavor) total += Number(flavor.price || 0);

        // Manual helpers for other decorations
        const DECORATION_PRICES = { 'None': 0, 'Flowers': 500, 'Topper': 300, 'Gold Leaf': 600 };
        total += DECORATION_PRICES[formData.topDecoration] || 0;

        setPrice(total);
    }, [formData, masterData, loadingData]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadedImageUrl, setUploadedImageUrl] = useState('');

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setDesignFile(file);
        setUploadingImage(true);

        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            // Check Env or default
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
            const res = await fetch(`${baseUrl}/upload`, {
                method: 'POST',
                body: uploadData
            });
            const data = await res.json();
            if (data.url) {
                setUploadedImageUrl(data.url);
            } else {
                alert('Upload failed: No URL returned');
            }
        } catch (error) {
            console.error(error);
            alert('Image upload failed. Please try again.');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleProceedToCheckout = () => {
        const selectedCat = masterData.categories.find(c => String(c.id) === String(formData.cakeCategory) || c.name === formData.cakeCategory);
        const selectedSize = masterData.sizes.find(s => s.label === formData.cakeSize);
        const selectedShape = masterData.shapes.find(s => s.label === formData.cakeShape);
        const selectedFlavor = masterData.flavors.find(f => f.label === formData.flavor);

        const customProduct = {
            id: 'CUST-' + Date.now(),
            name: 'Custom Cake Order',
            description: `${formData.cakeSize}, ${formData.flavor} (Custom Design)`,
            price: price,
            image: uploadedImageUrl || 'https://images.unsplash.com/photo-1563729768-3980d7c74c6d?auto=format&fit=crop&q=80&w=300',
            isCustom: true,
            customDetails: {
                ...formData,
                categoryId: selectedCat?.id,
                sizeId: selectedSize?.id,
                shapeId: selectedShape?.id,
                flavorId: selectedFlavor?.id,
                decorationPrice: ({ 'None': 0, 'Flowers': 500, 'Topper': 300, 'Gold Leaf': 600 })[formData.topDecoration] || 0,
                designImage: uploadedImageUrl,
                designFileName: designFile?.name
            }
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
                                        {masterData.sizes.map(s => (
                                            <option key={s.id} value={s.label}>{s.label} (+Rs.{s.price})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-2">Cake Shape</label>
                                    <select name="cakeShape" value={formData.cakeShape} onChange={handleChange} className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-pink-500 bg-transparent text-gray-900 font-medium text-sm">
                                        {masterData.shapes.map(s => (
                                            <option key={s.id} value={s.label}>{s.label} (+Rs.{s.price})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-2">Cake Flavor</label>
                                    <select name="flavor" value={formData.flavor} onChange={handleChange} className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-pink-500 bg-transparent text-gray-900 font-medium text-sm">
                                        {masterData.flavors.map(f => (
                                            <option key={f.id} value={f.label}>{f.label} (+Rs.{f.price})</option>
                                        ))}
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
                                        <option>Custom (Specify in instructions)</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 mb-2">Cake Category (Determines Base Price)</label>
                                    <select name="cakeCategory" value={formData.cakeCategory} onChange={handleChange} className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-pink-500 bg-transparent text-gray-900 font-medium text-sm">
                                        {masterData.categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} (Base: Rs.{c.basePrice})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-8 bg-blue-50 p-4 rounded-lg text-sm text-blue-800 flex items-center">
                                <Calendar className="w-5 h-5 mr-3 text-blue-500" />
                                Please note: Custom orders require at least 5 days notice. You will select the delivery date at checkout.
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
                                        <option>Gold Leaf</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-2">Cake Message</label>
                                    <input
                                        type="text"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        placeholder="e.g., Happy Birthday John"
                                        className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-pink-500 bg-transparent text-gray-900 font-medium text-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-2">Upload Reference Image</label>
                                        <div className="relative border-2 border-dashed border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors text-center cursor-pointer">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                            <p className="text-xs text-gray-500">{designFile ? designFile.name : 'Click to Upload Image'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-2">Or Paste Image Link</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="designLink"
                                                value={formData.designLink}
                                                onChange={handleChange}
                                                placeholder="https://pinterest.com/..."
                                                className="w-full border-b border-gray-200 py-2 pl-8 focus:outline-none focus:border-pink-500 bg-transparent text-gray-900 font-medium text-sm"
                                            />
                                            <LinkIcon className="absolute left-0 top-2 h-4 w-4 text-gray-400" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-2">Special Instructions</label>
                                    <textarea
                                        name="instructions"
                                        value={formData.instructions}
                                        onChange={handleChange}
                                        rows="4"
                                        placeholder="Describe your design, specific colors, or any other details..."
                                        className="w-full border rounded-lg p-3 focus:outline-none focus:border-pink-500 bg-white text-gray-900 text-sm"
                                    ></textarea>
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
                                            className="w-full border-b border-gray-200 py-1 text-sm font-medium text-gray-900 focus:outline-none focus:border-pink-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Phone</label>
                                        <input
                                            type="text"
                                            name="recipientPhone"
                                            value={formData.recipientPhone}
                                            onChange={handleChange}
                                            className="w-full border-b border-gray-200 py-1 text-sm font-medium text-gray-900 focus:outline-none focus:border-pink-500"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                                        <input
                                            type="text"
                                            name="recipientEmail"
                                            value={formData.recipientEmail}
                                            onChange={handleChange}
                                            className="w-full border-b border-gray-200 py-1 text-sm font-medium text-gray-900 focus:outline-none focus:border-pink-500"
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
                                        <p className="text-sm font-medium text-gray-900">{formData.message || 'None'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-0.5">Special Instructions</p>
                                        <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap">{formData.instructions || 'None'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-0.5">Design Reference</p>
                                        {designFile ? (
                                            <p className="text-sm font-medium text-pink-600 flex items-center">
                                                <Check className="w-4 h-4 mr-1" /> File Uploaded: {designFile.name}
                                            </p>
                                        ) : formData.designLink ? (
                                            <a href={formData.designLink} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline truncate block">
                                                {formData.designLink}
                                            </a>
                                        ) : (
                                            <p className="text-sm font-medium text-gray-900">None</p>
                                        )}
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

                            <div className="bg-pink-50 rounded-xl p-6 mb-8 flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-gray-500">Total Price:</p>
                                </div>
                                <p className="text-3xl font-bold text-pink-600">Rs. {price.toLocaleString()}</p>
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
            </div >
        </div >
    );
};

export default CustomOrderPage;
