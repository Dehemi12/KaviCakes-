import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Image as ImageIcon, CheckCircle2, PackageOpen, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const BulkOrderPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({});
    const [totalPrice, setTotalPrice] = useState(0);

    // Fetch dynamic fields from Admin configured FormField database
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await api.get('/form-fields/public/BULK');
                setFields(res.data);
                
                // Initialize form state
                const initialData = {};
                res.data.forEach(f => {
                    if (f.fieldType === 'dropdown' && f.options?.length > 0) {
                        initialData[f.fieldId] = ''; // Force them to select manually for better UX
                    } else if (f.fieldType === 'number') {
                        initialData[f.fieldId] = f.config?.min || '';
                    } else {
                        initialData[f.fieldId] = '';
                    }
                });
                setFormData(initialData);
            } catch (err) {
                console.error("Failed to fetch bulk form config:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    // Calculate price purely based on selected options and quantity
    useEffect(() => {
        if (!fields.length) return;
        
        let qty = 0;
        
        // Find quantity field
        const qtyField = fields.find(f => f.fieldId.toLowerCase().includes('qty') || f.fieldId.toLowerCase().includes('quantity') || f.fieldType === 'number');
        if (qtyField) {
            const val = formData[qtyField.fieldId];
            qty = Number(val) || Number(qtyField.config?.min) || 50;
        } else {
            qty = 50; // Total fallback
        }

        let unitBase = 0;
        let extras = 0;
        let selectedProduct = null;
        
        fields.forEach(f => {
            const val = formData[f.fieldId];
            if (!val) return;

            if (f.fieldType === 'dropdown' && f.options) {
                const selectedOpt = f.options.find(o => String(o.name).trim() === String(val).trim());
                if (selectedOpt) {
                    const price = Number(selectedOpt.price) || 0;
                    const fid = f.fieldId.toLowerCase();
                    
                    if (fid.includes('unit') || fid.includes('product') || fid.includes('item')) {
                        unitBase = price;
                        selectedProduct = selectedOpt.name;
                    } else if (fid.includes('packag')) {
                        // User constraint: add 25 for packaging if price is 0, else use price
                        extras += (price > 0 ? price : 25);
                    } else {
                        extras += price;
                    }
                }
            }
        });

        // Price = quantity * (unitBase + extras)
        let total = qty * (unitBase + extras);
        
        // 10% discount for orders > 100
        if (qty > 100) {
            total = total * 0.9;
        }

        setTotalPrice(Math.round(total));
    }, [formData, fields]);


    const handleChange = (fieldId, value) => {
        setFormData(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleFileUpload = async (e, fieldId) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const uploadData = new FormData();
        uploadData.append('file', file);
        
        try {
            const res = await api.post('/upload', uploadData);
            if (res.data?.url) {
                handleChange(fieldId, res.data.url);
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error('Image upload failed');
        }
    };

    const handleContinueToCheckout = (e) => {
        e.preventDefault();
        
        if (!user) {
            toast.error("Please login to submit a bulk order request.");
            navigate('/login', { state: { from: '/bulk-orders' } });
            return;
        }

        const missing = fields.filter(f => {
            if (!f.required) return false;
            
            // Allow skipping package design selection if custom package image is uploaded
            if (f.fieldId === 'packaging_type' && formData['packaging_design_file']) {
                return false;
            }
            
            return !formData[f.fieldId];
        });

        if (missing.length) {
            toast.error(`Please complete the required field: ${missing[0].label}`);
            return;
        }

        const mainProductField = formData['product_unit'] || formData['cakeType'] || 'Bulk Order';

        // Extract selected product image
        let selectedProductImage = null;
        fields.forEach(f => {
            const val = formData[f.fieldId];
            if (val && f.fieldType === 'dropdown' && f.options) {
                const selectedOpt = f.options.find(o => String(o.name).trim() === String(val).trim());
                if (selectedOpt) {
                    const fid = f.fieldId.toLowerCase();
                    if (fid.includes('unit') || fid.includes('product') || fid.includes('item')) {
                        selectedProductImage = selectedOpt.imageUrl;
                    }
                }
            }
        });

        const bulkProduct = {
            quantity: 1, // Order batch
            price: totalPrice,
            name: `Bulk Order: ${mainProductField}`,
            image: formData['reference_image'] || selectedProductImage || 'https://images.unsplash.com/photo-1557925923-33b2512ea2aa?auto=format&fit=crop&q=80&w=300',
            isBulk: true,
            bulkDetails: formData
        };

        navigate('/checkout', { state: { bulkOrder: { cart: [bulkProduct], cartTotal: totalPrice } } });
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading bulk configuration...</div>;
    }

    // Helper: Determine if options have images (visual grid)
    const renderDropdown = (f) => {
        const hasImages = f.options.some(o => o.imageUrl);
        
        if (hasImages) {
            return (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
                    {f.options.map((opt, i) => {
                        const isSelected = formData[f.fieldId] === opt.name;
                        return (
                            <div 
                                key={i} 
                                onClick={() => handleChange(f.fieldId, opt.name)}
                                className={`relative group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-300 ${isSelected ? 'border-pink-600 shadow-pink-200 shadow-lg' : 'border-gray-100 hover:border-pink-300'}`}
                            >
                                <div className="aspect-[4/3] bg-gray-100">
                                    {opt.imageUrl ? (
                                        <img src={opt.imageUrl} alt={opt.name} className={`w-full h-full object-cover transition-transform duration-500 ${isSelected ? 'scale-105' : 'group-hover:scale-110'}`} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-pink-50 text-pink-300">
                                            <PackageOpen size={48} />
                                        </div>
                                    )}
                                </div>
                                <div className={`p-4 ${isSelected ? 'bg-pink-50' : 'bg-white'}`}>
                                    <h4 className={`font-bold text-sm ${isSelected ? 'text-pink-700' : 'text-gray-800'}`}>{opt.name}</h4>
                                    {opt.price > 0 && <p className="text-xs text-gray-500 font-medium mt-1">+ Rs. {opt.price} / unit</p>}
                                </div>
                                {isSelected && (
                                    <div className="absolute top-3 right-3 bg-white rounded-full p-0.5 shadow-md">
                                        <CheckCircle2 className="w-5 h-5 text-pink-600 fill-pink-100" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            );
        }

        // Standard Dropdown Fallback
        return (
            <select
                value={formData[f.fieldId] || ''}
                onChange={(e) => handleChange(f.fieldId, e.target.value)}
                className="w-full mt-2 py-3 px-4 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-50 text-sm font-medium text-gray-900 transition-all bg-white"
            >
                <option value="" disabled>Select {f.label}</option>
                {f.options.map((opt, i) => (
                    <option key={i} value={opt.name}>{opt.name} {opt.price > 0 ? `(+Rs.${opt.price})` : ''}</option>
                ))}
            </select>
        );
    };

    return (
        <div className="font-sans min-h-screen relative overflow-hidden bg-gray-50 py-12">
            {/* Background Image Overlay - Modern Subtle Branding */}
            <div 
                className="absolute inset-0 z-0 pointer-events-none opacity-[0.25]"
                style={{ 
                    backgroundImage: 'url(/assets/bulk_bg.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center', // Centered for the new cupcake grid image
                    backgroundAttachment: 'fixed'
                }}
            />

            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Bulk & Corporate Orders</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">
                        Custom artisan creations for your most important events.
                    </p>
                </div>

                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 md:p-12 min-h-[500px]">
                    <div className="space-y-12">
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                                Product Selection & Design
                            </h2>
                            <div className="space-y-10">
                        {fields.map((f) => (
                            <div key={f.id} className="last:border-0">
                                <label className="flex items-center text-sm font-bold text-gray-900 mb-2">
                                    {f.label}
                                    {f.required && !(f.fieldId === 'packaging_type' && formData['packaging_design_file']) && <span className="text-pink-600 ml-1">*</span>}
                                    {f.fieldId === 'packaging_type' && formData['packaging_design_file'] && <span className="text-green-600 ml-2 font-normal text-xs">(Custom uploaded ✓)</span>}
                                </label>
                                
                                {f.config?.placeholder && f.fieldType !== 'text' && f.fieldType !== 'textarea' && (
                                    <p className="text-[11px] text-gray-400 mb-4">{f.config.placeholder}</p>
                                )}

                                {f.fieldType === 'text' && (
                                    <input
                                        type="text"
                                        value={formData[f.fieldId] || ''}
                                        onChange={(e) => handleChange(f.fieldId, e.target.value)}
                                        className="w-full py-3.5 px-5 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-50 text-sm font-medium text-gray-900 transition-all bg-gray-50/30"
                                        placeholder={f.config?.placeholder}
                                    />
                                )}

                                {f.fieldType === 'number' && (
                                    <input
                                        type="number"
                                        min={f.config?.min}
                                        value={formData[f.fieldId] || ''}
                                        onChange={(e) => handleChange(f.fieldId, e.target.value)}
                                        className="w-full py-3.5 px-5 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-50 text-sm font-medium text-gray-900 transition-all bg-gray-50/30"
                                        placeholder={f.config?.placeholder}
                                    />
                                )}

                                {f.fieldType === 'textarea' && (
                                    <textarea
                                        value={formData[f.fieldId] || ''}
                                        onChange={(e) => handleChange(f.fieldId, e.target.value)}
                                        rows="4"
                                        className="w-full py-3.5 px-5 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-50 text-sm font-medium text-gray-900 transition-all resize-none bg-gray-50/30"
                                        placeholder={f.config?.placeholder}
                                    ></textarea>
                                )}

                                {f.fieldType === 'dropdown' && renderDropdown(f)}

                                {f.fieldType === 'file' && (
                                    <div className="mt-2">
                                        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-pink-100 rounded-2xl cursor-pointer hover:bg-pink-50 transition-colors bg-gray-50/50 group">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className="w-10 h-10 mb-3 text-pink-300 group-hover:text-pink-400 transition-colors" />
                                                <p className="mb-1 text-sm text-gray-600 font-bold tracking-tight">Click to upload image</p>
                                                <p className="text-[10px] text-gray-400 font-medium">PNG, JPG, JPEG (Max 5MB)</p>
                                            </div>
                                            <input type="file" className="hidden" accept={f.config?.accept || "image/*"} onChange={(e) => handleFileUpload(e, f.fieldId)} />
                                        </label>
                                        
                                        {formData[f.fieldId] && (
                                            <div className="mt-4 flex items-center p-4 bg-green-50 rounded-2xl border border-green-100 animate-in zoom-in-95 duration-300">
                                                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                                                    <img src={formData[f.fieldId]} alt="Uploaded" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="ml-4 flex-1">
                                                    <p className="text-xs font-bold text-green-800 flex items-center"><CheckCircle2 className="w-4 h-4 mr-2" /> Attachment ready</p>
                                                </div>
                                                <button type="button" onClick={() => handleChange(f.fieldId, '')} className="text-[11px] font-black text-red-500 hover:text-red-700 bg-white px-3 py-1.5 rounded-lg shadow-sm">Remove</button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                                </div>
                                <div className="flex justify-end pt-10 border-t border-gray-100 mt-10">
                                    <button 
                                        type="button"
                                        onClick={handleContinueToCheckout}
                                        className="bg-black text-white px-10 py-4 rounded-xl font-bold text-sm shadow-xl hover:bg-gray-800 transition-all flex items-center"
                                    >
                                        Continue to Checkout
                                    </button>
                                </div>
                            </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkOrderPage;
