import React, { useState } from 'react';
import { Upload, X, ChevronRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const CustomOrderPage = () => {
    const [formData, setFormData] = useState({
        cakeSize: '',
        flavor: '',
        shape: '',
        quantity: 1,
        message: '',
        instructions: '',
        deliveryDate: ''
    });

    const [images, setImages] = useState([]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e) => {
        // Mock upload - in real app, uploading to server/firebase
        if (e.target.files && e.target.files[0]) {
            const newImage = URL.createObjectURL(e.target.files[0]);
            setImages([...images, newImage]);
        }
    };

    const removeImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Custom Order Submitted:', { ...formData, images });
        alert('Custom Order Request Submitted! We will contact you soon.');
    };

    return (
        <div className="font-sans min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Design Your Dream Cake</h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Have a specific design in mind? Whether it's for a birthday, wedding, or special celebration,
                        we can bring your vision to life. Fill out the details below to get a quote.
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-8 md:p-12">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Section 1: Cake Details */}
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                    <span className="bg-pink-100 text-pink-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
                                    Cake Specifications
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Flavor */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Flavor Preference</label>
                                        <select
                                            name="flavor"
                                            value={formData.flavor}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors bg-white"
                                            required
                                        >
                                            <option value="">Select a flavor</option>
                                            <option value="chocolate">Chocolate</option>
                                            <option value="vanilla">Vanilla</option>
                                            <option value="red_velvet">Red Velvet</option>
                                            <option value="black_forest">Black Forest</option>
                                            <option value="fruit">Fruit Cake</option>
                                            <option value="other">Other (Specify in instructions)</option>
                                        </select>
                                    </div>

                                    {/* Size */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Size (kg/lbs)</label>
                                        <select
                                            name="cakeSize"
                                            value={formData.cakeSize}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors bg-white"
                                            required
                                        >
                                            <option value="">Select size</option>
                                            <option value="1kg">1 kg (Serves 6-8)</option>
                                            <option value="2kg">2 kg (Serves 12-15)</option>
                                            <option value="3kg">3 kg (Serves 20-25)</option>
                                            <option value="custom">Larger (Specify in instructions)</option>
                                        </select>
                                    </div>

                                    {/* Shape */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Shape</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {['Round', 'Square', 'Heart'].map(shape => (
                                                <div
                                                    key={shape}
                                                    onClick={() => setFormData(prev => ({ ...prev, shape }))}
                                                    className={`cursor-pointer text-center py-3 rounded-lg border ${formData.shape === shape ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-gray-200 hover:border-pink-200'}`}
                                                >
                                                    {shape}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Quantity */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                                        <input
                                            type="number"
                                            name="quantity"
                                            value={formData.quantity}
                                            onChange={handleChange}
                                            min="1"
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Section 2: Design & Personalization */}
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                    <span className="bg-pink-100 text-pink-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
                                    Design & Personalization
                                </h2>

                                <div className="space-y-6">
                                    {/* Message on Cake */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Message on Cake</label>
                                        <input
                                            type="text"
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            placeholder="e.g. Happy Birthday Kavi!"
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                        />
                                    </div>

                                    {/* Reference Images */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Reference Images (Optional)</label>
                                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition-colors cursor-pointer relative">
                                            <div className="space-y-1 text-center">
                                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                                <div className="flex text-sm text-gray-600">
                                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-pink-600 hover:text-pink-500 outline-none">
                                                        <span>Upload a file</span>
                                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageUpload} accept="image/*" />
                                                    </label>
                                                    <p className="pl-1">or drag and drop</p>
                                                </div>
                                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                                            </div>
                                        </div>
                                        {/* Image Previews */}
                                        {images.length > 0 && (
                                            <div className="flex gap-4 mt-4 overflow-x-auto pb-2">
                                                {images.map((img, idx) => (
                                                    <div key={idx} className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200">
                                                        <img src={img} alt="preview" className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(idx)}
                                                            className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md hover:bg-red-50 text-gray-500 hover:text-red-500"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Special Instructions */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions / Description</label>
                                        <textarea
                                            name="instructions"
                                            value={formData.instructions}
                                            onChange={handleChange}
                                            rows="4"
                                            placeholder=" Describe your design idea, color theme, or any dietary requirements..."
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Section 3: Delivery Details */}
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                    <span className="bg-pink-100 text-pink-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">3</span>
                                    Date Needed
                                </h2>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Event / Delivery Date</label>
                                    <input
                                        type="date"
                                        name="deliveryDate"
                                        value={formData.deliveryDate}
                                        onChange={handleChange}
                                        className="w-full md:w-1/2 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-2">Please order at least 48 hours in advance for custom designs.</p>
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    className="bg-pink-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-pink-700 hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center"
                                >
                                    Submit Request <ChevronRight className="ml-2 h-5 w-5" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomOrderPage;
