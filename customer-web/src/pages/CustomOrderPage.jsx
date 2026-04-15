import React, { useState, useEffect } from 'react';
import { Upload, Calendar, Check, ImageIcon, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import toast from 'react-hot-toast';

// Reusable select field
const SelectField = ({ label, name, value, onChange, children }) => (
    <div className="relative group">
        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider ml-1">
            {label}
        </label>
        <div className="relative">
            <select
                name={name}
                value={value}
                onChange={onChange}
                className="block w-full pl-4 pr-10 py-3.5 text-sm border-2 border-gray-100 rounded-xl bg-gray-50 hover:bg-white focus:bg-white focus:border-pink-400 focus:outline-none transition-all appearance-none font-medium text-gray-900 shadow-sm cursor-pointer"
            >
                {children}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400 group-hover:text-pink-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </div>
    </div>
);

const CustomOrderPage = () => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [step, setStep] = useState(1);
    const [price, setPrice] = useState(0);

    const [formData, setFormData] = useState({
        cakeCategory: '',
        cakeSizeId: '',
        flavorId: '',
        message: '',
        instructions: '',
    });

    const [designFile, setDesignFile] = useState(null);
    const [uploadedImageUrl, setUploadedImageUrl] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');

    const [masterData, setMasterData] = useState({ sizes: [], shapes: [], flavors: [], categories: [] });
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await api.get('/cakes/master-data');
                setMasterData(res.data);
            } catch (err) {
                console.error('Failed to load pricing data', err);
            } finally {
                setLoadingData(false);
            }
        };
        loadData();
    }, []);

    // Price Calculation: (Category * Size Multiplier) + Flavor
    useEffect(() => {
        if (loadingData) return;
        
        const selectedCatId = formData.cakeCategory;
        const selectedSizeId = formData.cakeSizeId;
        const selectedFlavorId = formData.flavorId;

        const cat = masterData.categories.find(c => String(c.id) === String(selectedCatId));
        const size = masterData.sizes.find(s => String(s.id) === String(selectedSizeId));
        const flavor = masterData.flavors.find(f => String(f.id) === String(selectedFlavorId));

        const catBase = cat ? Number(cat.basePrice || 0) : 0;
        
        // Multiplier Logic: 
        // If size has a price (multiplier), use it. 
        // If it's 0 or empty, fallback to 1.0 (1x the price)
        const sizePrice = size ? Number(size.price) : 1;
        const sizeMultiplier = sizePrice > 0 ? sizePrice : 1;

        const flavorPremium = flavor ? Number(flavor.price || 0) : 0;

        // Formula: (Base * Weight) + Premium
        const total = (catBase * sizeMultiplier) + flavorPremium;

        console.log("Pricing Calculation Debug:", {
            catBase,
            sizeMultiplier,
            flavorPremium,
            total,
            selectedSize: size?.label,
            sizeStoredPrice: size?.price
        });

        setPrice(total);
    }, [formData, masterData, loadingData]);

    const handleChange = e => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = async e => {
        const file = e.target.files[0];
        if (!file) return;

        setDesignFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setUploadingImage(true);

        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
            const res = await fetch(`${baseUrl}/upload`, { method: 'POST', body: uploadData });
            const data = await res.json();
            if (data.url) {
                setUploadedImageUrl(data.url);
                toast.success('Image uploaded successfully!');
            } else {
                toast.error('Upload failed — please try again.');
            }
        } catch {
            toast.error('Image upload failed. Please try again.');
        } finally {
            setUploadingImage(false);
        }
    };

    const removeImage = () => {
        setDesignFile(null);
        setUploadedImageUrl('');
        setPreviewUrl('');
    };

    const handleNext = () => {
        if (step === 1) {
            if (!designFile && !uploadedImageUrl) {
                toast.error('Please upload a reference image of your design.');
                return;
            }
            if (!formData.cakeCategory) {
                toast.error('Please select a category.');
                return;
            }
            if (!formData.cakeSizeId) {
                toast.error('Please select a cake size.');
                return;
            }
            if (!formData.flavorId) {
                toast.error('Please select a flavor.');
                return;
            }
        }
        setStep(prev => prev + 1);
    };

    const handleBack = () => setStep(prev => prev - 1);

    const handleProceedToCheckout = () => {
        const selectedCat = masterData.categories.find(
            c => String(c.id) === String(formData.cakeCategory)
        );
        const selectedSize = masterData.sizes.find(s => String(s.id) === String(formData.cakeSizeId));
        const selectedFlavor = masterData.flavors.find(f => String(f.id) === String(formData.flavorId));

        const customProduct = {
            id: 'CUST-' + Date.now(),
            name: 'Custom Cake Order',
            description: `${selectedSize?.label || 'Custom'}, ${selectedFlavor?.label || 'Custom'} (Custom Design)`,
            price,
            image: uploadedImageUrl || 'https://images.unsplash.com/photo-1563729768-3980d7c74c6d?auto=format&fit=crop&q=80&w=300',
            isCustom: true,
            customDetails: {
                ...formData,
                categoryId: selectedCat?.id,
                sizeId: selectedSize?.id,
                flavorId: selectedFlavor?.id,
                designImage: uploadedImageUrl,
                designFileName: designFile?.name,
            },
        };

        addToCart(customProduct, { label: 'Custom' }, 1);
        navigate('/checkout');
    };

    const steps = [
        { id: 1, label: 'Your Order' },
        { id: 2, label: 'Review' },
    ];

    const selectedCategoryName =
        masterData.categories.find(c => String(c.id) === String(formData.cakeCategory))?.name || '—';

    return (
        <div className="font-sans min-h-screen relative overflow-hidden bg-gray-50 py-12">
            {/* Background Image Overlay - Modern Subtle Branding */}
            <div 
                className="absolute inset-0 z-0 pointer-events-none opacity-[0.15]"
                style={{ 
                    backgroundImage: 'url(/assets/custom_bg.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed'
                }}
            />

            <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Hero Header */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900">Custom Cake Order</h1>
                    <p className="text-gray-500 mt-2 text-sm">Upload your reference, pick your specs — we'll handle the magic.</p>
                </div>

                {/* Stepper */}
                <div className="flex justify-center mb-10">
                    <div className="flex items-center w-full max-w-xs">
                        {steps.map((s, idx) => (
                            <React.Fragment key={s.id}>
                                <div className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${step >= s.id ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                        {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                                    </div>
                                    <span className={`text-[10px] mt-1.5 font-semibold uppercase tracking-wide ${step >= s.id ? 'text-pink-600' : 'text-gray-300'}`}>
                                        {s.label}
                                    </span>
                                </div>
                                {idx < steps.length - 1 && (
                                    <div className={`flex-1 h-0.5 mx-3 mb-3 transition-colors ${step > idx + 1 ? 'bg-pink-600' : 'bg-gray-200'}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Form Container */}
                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">

                    {/* ── STEP 1: Order Details ── */}
                    {step === 1 && (
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 border-b pb-4 mb-8">Your Custom Order</h2>
                            </div>

                            {/* 1. Upload Reference Image — FIRST & PROMINENT */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider ml-1">
                                    Reference Image <span className="text-pink-500">*</span>
                                </label>

                                {!previewUrl ? (
                                    <label className="relative flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center cursor-pointer hover:border-pink-400 hover:bg-pink-50 transition-all bg-gray-50 group">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-pink-200 transition-colors">
                                            <ImageIcon className="w-8 h-8 text-pink-500" />
                                        </div>
                                        <p className="font-bold text-gray-700 text-sm group-hover:text-pink-600 transition-colors">
                                            {uploadingImage ? 'Uploading...' : 'Click or drag to upload your design'}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP — your reference photo helps us get it right</p>
                                    </label>
                                ) : (
                                    <div className="relative rounded-2xl overflow-hidden border-2 border-pink-200 shadow-sm">
                                        <img
                                            src={previewUrl}
                                            alt="Design reference"
                                            className="w-full max-h-72 object-cover"
                                        />
                                        <div className="absolute top-3 right-3">
                                            <button
                                                onClick={removeImage}
                                                className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                                                title="Remove image"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                                            <Check className="w-3 h-3" /> {designFile?.name}
                                        </div>
                                        {uploadingImage && (
                                            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* 2. Category */}
                            <SelectField label="Cake Category (Determines Base Price) *" name="cakeCategory" value={formData.cakeCategory} onChange={handleChange}>
                                <option value="">Select Category</option>
                                {masterData.categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </SelectField>

                            {/* 3. Size */}
                            <SelectField label="Cake Size *" name="cakeSizeId" value={formData.cakeSizeId} onChange={handleChange}>
                                <option value="">Select Size</option>
                                {masterData.sizes.map(s => (
                                    <option key={s.id} value={s.id}>{s.label}</option>
                                ))}
                            </SelectField>

                            {/* 4. Flavor */}
                            <SelectField label="Cake Flavor *" name="flavorId" value={formData.flavorId} onChange={handleChange}>
                                <option value="">Select Flavor</option>
                                {masterData.flavors.map(f => (
                                    <option key={f.id} value={f.id}>{f.label}</option>
                                ))}
                            </SelectField>

                            {/* 5. Cake Message */}
                            <div className="relative group">
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider ml-1">
                                    Cake Message <span className="text-gray-400 font-normal normal-case">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="e.g., Happy Birthday Sarah!"
                                    maxLength={60}
                                    className="block w-full px-4 py-3.5 text-sm border-2 border-gray-100 rounded-xl bg-gray-50 hover:bg-white focus:bg-white focus:border-pink-400 focus:outline-none transition-all font-medium text-gray-800 shadow-sm"
                                />
                                <p className="text-right text-xs text-gray-400 mt-1">{formData.message.length}/60</p>
                            </div>

                            {/* 6. Special Instructions */}
                            <div className="relative group">
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider ml-1">
                                    Special Instructions <span className="text-gray-400 font-normal normal-case">(optional)</span>
                                </label>
                                <textarea
                                    name="instructions"
                                    value={formData.instructions}
                                    onChange={handleChange}
                                    rows="4"
                                    placeholder="Describe your design vision — colors, decorations, theme, or any other details for our bakers..."
                                    className="block w-full px-4 py-3.5 text-sm border-2 border-gray-100 rounded-xl bg-gray-50 hover:bg-white focus:bg-white focus:border-pink-400 focus:outline-none transition-all font-medium text-gray-800 shadow-sm resize-y"
                                />
                            </div>

                            {/* Notice */}
                            <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                <span>Custom orders require at least <strong>5 days notice</strong>. You'll select the delivery date at checkout.</span>
                            </div>

                            {/* Price Preview */}
                            {price > 0 && (
                                <div className="bg-pink-50 border border-pink-100 rounded-xl px-6 py-4 flex justify-between items-center">
                                    <span className="text-sm font-bold text-gray-600">Total Price</span>
                                    <span className="text-2xl font-bold text-pink-600">Rs. {price.toLocaleString()}</span>
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handleNext}
                                    className="bg-pink-500 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-pink-600 active:scale-95 transition-all"
                                >
                                    Review Order →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Review ── */}
                    {step === 2 && (
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 border-b pb-4 mb-8">Review Your Order</h2>

                            {/* Image Preview */}
                            {previewUrl && (
                                <div className="mb-8 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4 pt-4 mb-3">Reference Design</p>
                                    <img
                                        src={previewUrl}
                                        alt="Your design reference"
                                        className="w-full max-h-64 object-cover"
                                    />
                                </div>
                            )}

                            {/* Specs Grid */}
                            <div className="grid grid-cols-2 gap-5 mb-8">
                                {[
                                    ['Category', selectedCategoryName],
                                    ['Size', masterData.sizes.find(s => String(s.id) === String(formData.cakeSizeId))?.label || '—'],
                                    ['Flavor', masterData.flavors.find(f => String(f.id) === String(formData.flavorId))?.label || '—'],
                                    ['Cake Message', formData.message || 'None'],
                                ].map(([label, val]) => (
                                    <div key={label} className="bg-gray-50 rounded-xl px-4 py-3">
                                        <p className="text-xs text-gray-400 mb-1 font-medium">{label}</p>
                                        <p className="text-sm font-bold text-gray-900">{val}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Special Instructions */}
                            {formData.instructions && (
                                <div className="mb-8 bg-amber-50 border border-amber-100 rounded-xl p-4">
                                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">Special Instructions</p>
                                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{formData.instructions}</p>
                                </div>
                            )}

                            {/* Price */}
                            <div className="bg-pink-50 rounded-xl p-6 mb-8 flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Total Price</p>
                                    <p className="text-3xl font-bold text-pink-600">Rs. {price.toLocaleString()}</p>
                                </div>
                                <div className="text-right text-xs text-gray-400">
                                    <p>Delivery date selected</p>
                                    <p>at checkout</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <button
                                    onClick={handleBack}
                                    className="text-gray-500 font-semibold text-sm hover:text-gray-900 transition-colors flex items-center gap-1"
                                >
                                    ← Back
                                </button>
                                <button
                                    onClick={handleProceedToCheckout}
                                    className="bg-pink-500 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-pink-600 active:scale-95 transition-all"
                                >
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
