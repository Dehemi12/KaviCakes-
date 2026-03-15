import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, XCircle, Filter, ChevronRight, Search, ArrowUpDown, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const OrdersPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('All Orders');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const normalizeStatus = (backendStatus) => {
        if (!backendStatus) return 'Pending';
        const s = String(backendStatus).toUpperCase();
        if (s === 'NEW' || s === 'ORDER_PLACED') return 'Pending';
        if (s === 'READY') return 'Ready for Pickup';
        if (s === 'CONFIRMED' || s === 'ADMIN_CONFIRMED') return 'Confirmed';
        if (s === 'PREPARING') return 'Preparing';
        if (s === 'OUT_FOR_DELIVERY') return 'Out for Delivery';
        if (s === 'DELIVERED') return 'Delivered';
        if (s === 'CANCELLED') return 'Cancelled';
        return backendStatus; // Return original if unknown
    };

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.warn("No token found. Showing empty state.");
                    setLoading(false);
                    return;
                }

                console.log("Fetching orders from API...");
                const response = await api.get('/orders/my-orders');

                console.log("Orders API Response Status:", response.status);
                console.log("Orders API Response Data Type:", typeof response.data);
                console.log("Orders API Response Data:", JSON.stringify(response.data, null, 2));

                let orderData = response.data;
                // Fallback if data is wrapped
                if (response.data && response.data.orders) {
                    console.warn("Detected wrapped data structure (unexpected but handled).");
                    orderData = response.data.orders;
                }

                if (Array.isArray(orderData)) {
                    console.log(`Processing ${orderData.length} orders...`);
                    const processed = orderData.map(o => ({
                        ...o,
                        statusDisplay: normalizeStatus(o.status),
                        items: o.items || []
                    }));
                    setOrders(processed);
                } else {
                    console.error("API returned non-array:", orderData);
                    setError("Received invalid data from server format.");
                }

            } catch (err) {
                console.error("Failed to fetch orders:", err);
                setError(err.response?.data?.error || "Failed to load orders.");
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []); // Run once on mount

    // Debugging current user
    console.log("Current User in LocalStorage:", localStorage.getItem('user'));
    console.log("Current Token:", localStorage.getItem('token') ? "Token Exists" : "No Token");

    const stats = [
        { label: 'All Orders', count: orders.length, icon: Package, color: 'bg-pink-500 text-white', iconColor: 'text-white' },
        { label: 'In Progress', count: orders.filter(o => ['Pending', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Out for Delivery'].includes(o.statusDisplay)).length, icon: Clock, color: 'bg-white text-gray-900 border', iconColor: 'text-blue-500' },
        { label: 'Delivered', count: orders.filter(o => o.statusDisplay === 'Delivered').length, icon: CheckCircle, color: 'bg-white text-gray-900 border', iconColor: 'text-green-500' },
        { label: 'Cancelled', count: orders.filter(o => o.statusDisplay === 'Cancelled').length, icon: XCircle, color: 'bg-white text-gray-900 border', iconColor: 'text-red-500' },
    ];

    const getStatusColor = (status) => {
        if (status === 'Pending') return 'bg-yellow-100 text-yellow-800';
        if (status === 'Confirmed') return 'bg-blue-100 text-blue-800';
        if (status === 'Preparing') return 'bg-purple-100 text-purple-800';
        if (status === 'Ready for Pickup') return 'bg-orange-100 text-orange-800';
        if (status === 'Out for Delivery') return 'bg-indigo-100 text-indigo-800';
        if (status === 'Delivered') return 'bg-green-100 text-green-800';
        if (status === 'Cancelled') return 'bg-red-100 text-red-800';
        return 'bg-gray-100 text-gray-800';
    };

    const filteredOrders = orders.filter(order => {
        const s = order.statusDisplay;
        if (activeTab === 'All Orders') return true;
        if (activeTab === 'In Progress') return ['Pending', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Out for Delivery'].includes(s);
        if (activeTab === 'Delivered') return s === 'Delivered';
        if (activeTab === 'Cancelled') return s === 'Cancelled';
        return true;
    });

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        </div>
    );

    return (
        <div className="bg-gray-50 min-h-screen py-8 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {error && <div className="bg-red-100 text-red-700 p-4 mb-4 rounded">{error}</div>}

                {/* ... (rest of header) ... */}

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
                        <p className="text-xs text-gray-500 mt-1">
                            Current Account: <span className="font-bold text-pink-600">
                                {localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'Guest'}
                            </span>
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            navigate('/login');
                        }}
                        className="flex items-center text-sm text-gray-500 hover:text-red-500 transition-colors bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm"
                    >
                        <LogOut className="w-4 h-4 mr-2" /> Logout
                    </button>
                </div>

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
                {filteredOrders.length === 0 ? (
                    error ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-red-500">
                            <h3 className="text-lg font-bold mb-2">Error loading orders</h3>
                            <p>{error}</p>
                            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm font-bold text-gray-700">Retry</button>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Package className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">No orders found</h3>
                            <p className="text-gray-500 text-sm">Looks like you haven't placed any orders yet.</p>
                            <button
                                onClick={() => navigate('/cakes')}
                                className="mt-6 px-6 py-2 bg-pink-600 text-white rounded-lg font-bold hover:bg-pink-700 transition"
                            >
                                Start Shopping
                            </button>
                        </div>
                    )
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((order) => (
                            <div
                                key={order.id}
                                onClick={() => navigate(`/track-order/${order.id}`, { state: { order } })}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group"
                            >
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Left Info */}
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                                                <Clock className="w-4 h-4 text-orange-500" />
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-900 block">Order #{order.id}</span>
                                                <span className="text-xs text-gray-500">{order.date}</span>
                                            </div>
                                        </div>

                                        {/* Item Preview */}
                                        {order.items.length > 0 && (
                                            <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                                                    <img
                                                        src={order.items[0].image}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Cake'; }}
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{order.items[0].name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        Qty: {order.items[0].quantity} • Rs.{(parseFloat(order.total)).toLocaleString()}
                                                    </p>
                                                </div>
                                                {order.items.length > 1 && (
                                                    <span className="ml-auto text-xs font-bold text-pink-600 bg-pink-50 px-2 py-1 rounded">
                                                        +{order.items.length - 1} more
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Info (Status & Price) */}
                                    <div className="flex flex-row md:flex-col justify-between items-end text-right pl-0 md:pl-6 md:border-l border-gray-100">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getStatusColor(order.statusDisplay)}`}>
                                            {order.statusDisplay}
                                        </span>

                                        <div className="flex items-center gap-2 mt-auto">
                                            <div>
                                                <p className="text-xs text-gray-400">Total Amount</p>
                                                <p className="font-bold text-gray-900 text-lg">Rs.{order.total.toLocaleString()}</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-pink-500 transition-colors ml-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
};

export default OrdersPage;
