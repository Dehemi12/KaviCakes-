import React, { useState } from 'react';
import { Package, Clock, CheckCircle, XCircle, Filter, ChevronRight, Search, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OrdersPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('All Orders');

    // Mock Data to match screenshot
    const [orders] = useState([
        {
            id: 'KVC-795189',
            date: '10/20/2025',
            // ... (rest of mock data same, assuming simplified replacement for filter implementation)
            // Actually, I should update the render logic.
            // Let's use clean replace for the render part.
            // I need to filter `orders` based on `activeTab`.

            // Filter logic

            status: 'Pending',
            total: 4611,
            items: [{ name: 'Chocolate Fudge Cake', quantity: 1, image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100&auto=format&fit=crop' }],
            deliveryMethod: 'Delivery',
            deliveryAddress: '1/21/A',
            expected: '10/27/2025'
        },
        {
            id: 'KVC-440215',
            date: '10/20/2025',
            status: 'Pending',
            total: 170000,
            items: [{ name: 'Bulk Order: Butter Vanilla', quantity: 100, image: 'https://images.unsplash.com/photo-1563729768-3980d7c74c6d?w=100&auto=format&fit=crop' }],
            deliveryMethod: 'Delivery',
            deliveryAddress: '44444',
            expected: '10/29/2025'
        },
        {
            id: 'KVC-571328',
            date: '10/20/2025',
            status: 'Pending',
            total: 5500,
            items: [{ name: 'Custom Round Vanilla Cake', quantity: 1, image: 'https://images.unsplash.com/photo-1627834377411-8da5f4f09de8?w=100&auto=format&fit=crop' }],
            deliveryMethod: 'Pickup',
            deliveryAddress: 'Store Pickup',
            expected: '10/31/2025'
        },
        {
            id: 'KVC-725286',
            date: '10/20/2025',
            status: 'Pending',
            total: 4500,
            items: [{ name: 'Chocolate Fudge Cake', quantity: 1, image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100&auto=format&fit=crop' }],
            deliveryMethod: 'Pickup',
            deliveryAddress: 'Store Pickup',
            expected: '10/30/2025'
        },
        {
            id: 'KVC-622373',
            date: '10/17/2025',
            status: 'Pending',
            total: 5500,
            items: [{ name: 'Custom Round Vanilla Cake', quantity: 1, image: 'https://images.unsplash.com/photo-1627834377411-8da5f4f09de8?w=100&auto=format&fit=crop' }],
            deliveryMethod: 'Pickup',
            deliveryAddress: 'Store Pickup',
            expected: '10/23/2025'
        }
    ]);

    const stats = [
        { label: 'All Orders', count: 6, icon: Package, color: 'bg-pink-500 text-white', iconColor: 'text-white' },
        { label: 'In Progress', count: 6, icon: Clock, color: 'bg-white text-gray-900 border', iconColor: 'text-blue-500' },
        { label: 'Delivered', count: 0, icon: CheckCircle, color: 'bg-white text-gray-900 border', iconColor: 'text-green-500' },
        { label: 'Cancelled', count: 0, icon: XCircle, color: 'bg-white text-gray-900 border', iconColor: 'text-red-500' },
    ];

    const getStatusColor = (status) => {
        if (status === 'Pending') return 'bg-yellow-100 text-yellow-800';
        if (status === 'Delivered') return 'bg-green-100 text-green-800';
        if (status === 'Cancelled') return 'bg-red-100 text-red-800';
        return 'bg-gray-100 text-gray-800';
    };

    // Filter logic
    const filteredOrders = orders.filter(order => {
        if (activeTab === 'All Orders') return true;
        if (activeTab === 'In Progress') return ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery'].includes(order.status);
        if (activeTab === 'Delivered') return order.status === 'Delivered';
        if (activeTab === 'Cancelled') return order.status === 'Cancelled';
        return true;
    });

    return (
        <div className="bg-gray-50 min-h-screen py-8 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            onClick={() => setActiveTab(stat.label)}
                            className={`p-4 rounded-xl cursor-pointer flex items-center space-x-4 transition-all shadow-sm ${activeTab === stat.label ? 'bg-pink-500 text-white ring-2 ring-pink-300' : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <div className={`p-2 rounded-lg ${activeTab === stat.label ? 'bg-white/20' : 'bg-gray-100'}`}>
                                <stat.icon className={`w-6 h-6 ${activeTab === stat.label ? 'text-white' : stat.iconColor}`} />
                            </div>
                            <div>
                                <p className={`text-sm font-bold ${activeTab === stat.label ? 'text-pink-100' : 'text-gray-900'}`}>{stat.label}</p>
                                <p className={`text-xs ${activeTab === stat.label ? 'text-white' : 'text-gray-500'}`}>{stat.count} orders</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filter Bar */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search orders by ID or product..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-50 border-none focus:ring-2 focus:ring-pink-500"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100">
                            <Filter className="w-4 h-4" /> <span>Filter</span>
                        </button>
                        <button className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100">
                            <ArrowUpDown className="w-4 h-4" /> <span>Newest First</span>
                        </button>
                    </div>
                </div>

                {/* Orders List */}
                <div className="space-y-4">
                    {filteredOrders.map((order) => (
                        <div
                            key={order.id}
                            onClick={() => {
                                const isBulk = order.items.some(i => i.name.includes('Bulk') || i.isBulk);
                                if (isBulk) {
                                    navigate(`/bulk-order-review/${order.id}`, { state: { order } });
                                } else {
                                    navigate(`/track-order/${order.id}`, { state: { order } });
                                }
                            }}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group"
                        >
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Left Info */}
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-4 h-4 text-orange-400" />
                                        <span className="font-bold text-gray-900">{order.id}</span>
                                        <span className="text-xs text-gray-400">{order.date}</span>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                        <span className="text-xs text-gray-400">{order.items.length} item</span>
                                    </div>

                                    {/* Item Preview */}
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                            <img src={order.items[0].image} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                                {order.items[0].name} <span className="text-gray-400 ml-1">x{order.items[0].quantity}</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Footer Info */}
                                    <div className="flex items-center text-xs text-gray-500 gap-6">
                                        <div>
                                            <span className="text-gray-400">Delivery: </span>
                                            {order.deliveryMethod}
                                        </div>
                                        <div>
                                            {order.deliveryAddress}
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Expected: </span>
                                            {order.expected}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Info (Status & Price) */}
                                <div className="flex flex-row md:flex-col justify-between items-end text-right">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>

                                    <div className="flex items-center gap-4 mt-auto">
                                        <span className="font-bold text-gray-900">Rs.{order.total.toLocaleString()}</span>
                                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-pink-500 transition-colors" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OrdersPage;
