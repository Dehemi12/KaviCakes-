import React, { useState } from 'react';
import { Users, Calendar, Building, ChevronRight } from 'lucide-react';

const BulkOrderPage = () => {
    const [formData, setFormData] = useState({
        eventName: '',
        organization: '',
        eventType: 'corporate',
        expectedGuests: '',
        eventDate: '',
        cakePreferences: '',
        contactName: '',
        contactEmail: '',
        contactPhone: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Bulk Order Request:', formData);
        alert('Bulk Order Quote Request Sent! We will get back to you with pricing.');
    };

    return (
        <div className="font-sans min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold tracking-wide uppercase mb-3">Corporate & Events</span>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Bulk Orders & Catering</h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Planning a corporate event, wedding, or large party? We offer special pricing and customized packages for bulk orders.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Benefits Sidebar */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4">Why Choose Us?</h3>
                            <ul className="space-y-4">
                                <li className="flex items-start">
                                    <div className="bg-green-100 p-2 rounded-full mr-3 shrink-0">
                                        <Building className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm text-gray-900">Corporate Rates</h4>
                                        <p className="text-xs text-gray-500">Special discounts for business events.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <div className="bg-purple-100 p-2 rounded-full mr-3 shrink-0">
                                        <Calendar className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm text-gray-900">Reliable Delivery</h4>
                                        <p className="text-xs text-gray-500">On-time delivery for large volumes.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <div className="bg-orange-100 p-2 rounded-full mr-3 shrink-0">
                                        <Users className="h-4 w-4 text-orange-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm text-gray-900">Any Size</h4>
                                        <p className="text-xs text-gray-500">From 50 to 500+ guests.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="md:col-span-2">
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden p-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Event Name / Occasion</label>
                                        <input
                                            type="text"
                                            name="eventName"
                                            value={formData.eventName}
                                            onChange={handleChange}
                                            placeholder="e.g. Annual Office Party"
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Organization (Optional)</label>
                                        <input
                                            type="text"
                                            name="organization"
                                            value={formData.organization}
                                            onChange={handleChange}
                                            placeholder="Company Name"
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Event Date</label>
                                        <input
                                            type="date"
                                            name="eventDate"
                                            value={formData.eventDate}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Guests</label>
                                        <select
                                            name="expectedGuests"
                                            value={formData.expectedGuests}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                            required
                                        >
                                            <option value="">Select range</option>
                                            <option value="10-50">10 - 50</option>
                                            <option value="50-100">50 - 100</option>
                                            <option value="100-200">100 - 200</option>
                                            <option value="200+">200+</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Requirements / Cake Preferences</label>
                                    <textarea
                                        name="cakePreferences"
                                        value={formData.cakePreferences}
                                        onChange={handleChange}
                                        rows="3"
                                        placeholder="Tell us what you need (e.g., 50 cupcakes, 3 large detailed cakes, specific branding...)"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    ></textarea>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <h4 className="font-medium text-gray-900 mb-4">Contact Person Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                            <input
                                                type="text"
                                                name="contactName"
                                                value={formData.contactName}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                            <input
                                                type="email"
                                                name="contactEmail"
                                                value={formData.contactEmail}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                            <input
                                                type="tel"
                                                name="contactPhone"
                                                value={formData.contactPhone}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center"
                                    >
                                        Request Quote <ChevronRight className="ml-2 h-5 w-5" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkOrderPage;
