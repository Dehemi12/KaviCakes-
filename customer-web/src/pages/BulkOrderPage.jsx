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
        instructions: '',
        colorTheme: '',
        packingInstructions: ''
    });

    // Image Upload States
    const [referenceImageUrl, setReferenceImageUrl] = useState('');
    const [packingImageUrl, setPackingImageUrl] = useState('');
    const [uploadingRef, setUploadingRef] = useState(false);
    const [uploadingPack, setUploadingPack] = useState(false);

    const handleFileUpload = async (file, setUrl, setUploading) => {
        if (!file) return;
        setUploading(true);
        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            // Use env or default
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
            const res = await fetch(`${baseUrl}/upload`, {
                method: 'POST',
                body: uploadData
            });
            const data = await res.json();
            if (data.url) {
                setUrl(data.url);
            } else {
                alert('Upload failed');
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert('Image upload failed');
        } finally {
            setUploading(false);
        }
    };

    // Fetch Bulk Pricing on Mount
    React.useEffect(() => {
        const fetchPricing = async () => {
            try {
                // Use relative path if proxy is set or absolute if configured in api service
                // Assuming api service logic for now or keeping simple fetch if public
                const res = await fetch('http://localhost:5000/api/bulk-pricing');
                if (res.ok) {
                    const data = await res.json();
                    setPricingRules(data);

                    // Set default type if available
                    if (data.length > 0 && !formData.cakeType) {
                        setFormData(prev => ({ ...prev, cakeType: data[0].categoryLabel }));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch bulk pricing:", err);
            }
        };
        fetchPricing();
    }, []);

    // Live Price Calculation
    const calculatePrice = () => {
        if (!formData.cakeType) return { unit: 0, total: 0 };

        let unitPrice = 0;
        const rule = pricingRules.find(r => r.categoryLabel === formData.cakeType);

        if (rule) {
            if (formData.quantity >= rule.bulkThreshold) {
                unitPrice = parseFloat(rule.bulkPrice);
            } else {
                unitPrice = parseFloat(rule.basePrice);
            }
        } else {
            // Fallback
            unitPrice = (formData.quantity >= 100) ? 220 : 250;
        }

        return { unit: unitPrice, total: unitPrice * formData.quantity };
    };

    const { unit, total } = calculatePrice();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleProcessToCheckout = (e) => {
        e.preventDefault();

        // Basic Validation
        if (formData.quantity < 50) {
            alert("The minimum order quantity for bulk orders is 50 items. Please increase your quantity.");
            return;
        }

        // Calculate Price based on rules or fallback
        const { unit, total } = calculatePrice();
        const totalPrice = total;



        const bulkItem = {
            id: 'BULK-' + Date.now(),
            name: `Bulk Order: ${formData.cakeType}`,
            description: `${formData.eventName} (${formData.quantity} items) - ${formData.cakeFlavor}`,
            price: totalPrice,
            image: referenceImageUrl || 'https://images.unsplash.com/photo-1612203985729-ca8a88d7ad56?auto=format&fit=crop&q=80&w=300',
            quantity: 1
        };

        const bulkDetailsPayload = {
            ...formData,
            referenceImage: referenceImageUrl,
            packingImage: packingImageUrl
        };

        addToCart(bulkItem, { label: 'Bulk', isBulk: true, bulkDetails: bulkDetailsPayload }, 1);
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
                                    {pricingRules.length > 0 ? (
                                        pricingRules.map(rule => (
                                            <option key={rule.id} value={rule.categoryLabel}>{rule.categoryLabel}</option>
                                        ))
                                    ) : (
                                        <>
                                            <option>Cupcakes</option>
                                            <option>Mini Cakes</option>
                                            <option>Jar Cakes</option>
                                            <option>Brownies</option>
                                        </>
                                    )}
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
                                    placeholder="Any specific instructions..."
                                ></textarea>
                            </div>

                            {/* New Fields Section */}
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-100 pt-8 mt-4">

                                {/* Color Theme */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-2">Color Theme</label>
                                    <input
                                        type="text"
                                        name="colorTheme"
                                        value={formData.colorTheme}
                                        onChange={handleChange}
                                        className="w-full py-2 border-b border-gray-200 focus:border-pink-500 focus:outline-none bg-transparent text-sm font-medium text-gray-900"
                                        placeholder="e.g. Royal Blue & Gold"
                                    />
                                </div>

                                {/* Reference Image Upload */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-2">Reference Image (Design/Color)</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="file"
                                            onChange={(e) => handleFileUpload(e.target.files[0], setReferenceImageUrl, setUploadingRef)}
                                            className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                                            accept="image/*"
                                        />
                                        {uploadingRef && <span className="text-xs text-pink-500">Uploading...</span>}
                                        {referenceImageUrl && <span className="text-xs text-green-500">✓ Uploaded</span>}
                                    </div>
                                    {referenceImageUrl && (
                                        <div className="mt-2 w-16 h-16 rounded overflow-hidden border">
                                            <img src={referenceImageUrl} alt="Reference" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>

                                {/* Packing Instructions */}
                                <div className="md:col-span-2">
                                    <h3 className="text-sm font-bold text-gray-900 mb-4">Packing Details</h3>
                                </div>

                                <div className="md:col-span-1">
                                    <label className="block text-xs font-medium text-gray-500 mb-2">Packing Preferences</label>
                                    <textarea
                                        name="packingInstructions"
                                        value={formData.packingInstructions}
                                        onChange={handleChange}
                                        rows="2"
                                        className="w-full py-2 border-b border-gray-200 focus:border-pink-500 focus:outline-none bg-transparent text-sm font-medium text-gray-900 resize-none"
                                        placeholder="Explain how you want them packed (e.g., Individual boxes, Trays...)"
                                    ></textarea>
                                </div>

                                {/* Packing Reference Image */}
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-medium text-gray-500 mb-2">Packing Reference Image (Optional)</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="file"
                                            onChange={(e) => handleFileUpload(e.target.files[0], setPackingImageUrl, setUploadingPack)}
                                            className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                                            accept="image/*"
                                        />
                                        {uploadingPack && <span className="text-xs text-pink-500">Uploading...</span>}
                                        {packingImageUrl && <span className="text-xs text-green-500">✓ Uploaded</span>}
                                    </div>
                                    {packingImageUrl && (
                                        <div className="mt-2 w-16 h-16 rounded overflow-hidden border">
                                            <img src={packingImageUrl} alt="Packing Ref" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>

                        {/* Price Display */}
                        <div className="bg-pink-50 p-6 rounded-xl flex justify-between items-center">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Estimated Unit Price: <span className="font-semibold text-gray-900">Rs. {unit}</span></p>
                                <p className="text-xs text-gray-500">
                                    {formData.quantity >= 100 ? '🎉 Bulk discount applied!' : 'Order 100+ for bulk pricing'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Total Price</p>
                                <p className="text-3xl font-bold text-pink-600">Rs. {total.toLocaleString()}</p>
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
            </div >
        </div >
    );
};

export default BulkOrderPage;
