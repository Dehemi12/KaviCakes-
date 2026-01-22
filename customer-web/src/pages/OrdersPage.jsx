import React, { useState } from 'react';
import { Package, Clock, CheckCircle, Truck, ShoppingBag, ChevronRight, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const OrdersPage = () => {
    // Mock Orders Data
    const [orders] = useState([
        {
            id: 'ORD-2025-001',
            date: '2026-01-22',
            status: 'Processing',
            total: 3500,
            items: [
                { name: 'Chocolate Fudge Cake', quantity: 1, variant: '1kg' },
                { name: 'Red Velvet Cupcakes', quantity: 6, variant: 'Regular' }
            ],
            deliveryMethod: 'Delivery',
            deliveryDate: '2026-01-25',
            trackingSteps: [
                { status: 'Pending', date: 'Jan 22, 10:00 AM', completed: true },
                { status: 'Confirmed', date: 'Jan 22, 10:30 AM', completed: true },
                { status: 'Baking', date: 'In Progress', completed: true },
                { status: 'Ready', date: 'Estimated Jan 24', completed: false },
                { status: 'Delivered', date: 'Estimated Jan 25', completed: false },
            ]
        },
        {
            id: 'ORD-2024-089',
            date: '2025-12-15',
            status: 'Delivered',
            total: 4200,
            items: [
                { name: 'Christmas Fruit Cake', quantity: 1, variant: '2kg' }
            ],
            deliveryMethod: 'Pickup',
            deliveryDate: '2025-12-20',
            trackingSteps: [
                { status: 'Pending', date: 'Dec 15', completed: true },
                { status: 'Confirmed', date: 'Dec 16', completed: true },
                { status: 'Baking', date: 'Dec 18', completed: true },
                { status: 'Ready', date: 'Dec 19', completed: true },
                { status: 'Picked Up', date: 'Dec 20, 2:00 PM', completed: true },
            ]
        }
    ]);

    const [selectedOrder, setSelectedOrder] = useState(orders[0]); // Default to the first (latest) order

    // Status Badge Logic
    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Processing': return 'bg-blue-100 text-blue-800';
            case 'Baking': return 'bg-orange-100 text-orange-800';
            case 'Ready': return 'bg-purple-100 text-purple-800';
            case 'Delivered':
            case 'Picked Up': return 'bg-green-100 text-green-800';
            case 'Cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen py-12 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Order List Sidebar */}
                    <div className="lg:w-1/3 space-y-4">
                        {orders.map(order => (
                            <div
                                key={order.id}
                                onClick={() => setSelectedOrder(order)}
                                className={`bg-white p-5 rounded-xl shadow-sm border cursor-pointer transition-all hover:shadow-md ${selectedOrder?.id === order.id ? 'border-pink-500 ring-1 ring-pink-500' : 'border-gray-100'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-gray-900">{order.id}</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-500 mb-3">
                                    {order.items.length} items • Rs.{order.total.toLocaleString()}
                                </div>
                                <div className="flex items-center text-xs text-gray-400">
                                    <Clock className="w-3 h-3 mr-1" /> {order.date}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Details & Tracking */}
                    <div className="flex-1">
                        {selectedOrder ? (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                {/* Header */}
                                <div className="bg-pink-50 p-6 border-b border-pink-100">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Details</h2>
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                                        <div className="flex items-center">
                                            <Package className="w-4 h-4 mr-2 text-pink-600" />
                                            Order #{selectedOrder.id}
                                        </div>
                                        <div className="flex items-center">
                                            <CalendarIcon date={selectedOrder.date} />
                                            Placed on {selectedOrder.date}
                                        </div>
                                        <div className="flex items-center">
                                            <Truck className="w-4 h-4 mr-2 text-pink-600" />
                                            {selectedOrder.deliveryMethod}
                                        </div>
                                        <div className="flex items-center font-bold text-pink-700">
                                            Total: Rs.{selectedOrder.total.toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {/* Tracking Timeline */}
                                <div className="p-8">
                                    <h3 className="font-bold text-gray-900 mb-6">Order Status</h3>
                                    <div className="relative">
                                        {/* Vertical connector line */}
                                        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200"></div>

                                        <div className="space-y-8">
                                            {selectedOrder.trackingSteps.map((step, idx) => (
                                                <div key={idx} className="relative flex items-start pl-10">
                                                    <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white ${step.completed ? 'bg-pink-600' : 'bg-gray-300'}`}>
                                                        {step.completed && <CheckCircle className="w-4 h-4 text-white" />}
                                                    </div>
                                                    <div>
                                                        <h4 className={`font-bold ${step.completed ? 'text-gray-900' : 'text-gray-400'}`}>{step.status}</h4>
                                                        <p className="text-sm text-gray-500">{step.date}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100 mx-8"></div>

                                {/* Items List */}
                                <div className="p-8">
                                    <h3 className="font-bold text-gray-900 mb-4">Items Ordered</h3>
                                    <ul className="space-y-4">
                                        {selectedOrder.items.map((item, index) => (
                                            <li key={index} className="flex justify-between items-center text-sm border-b border-gray-50 pb-3 last:border-0">
                                                <div className="flex items-center">
                                                    <span className="bg-gray-100 text-gray-600 w-6 h-6 rounded flex items-center justify-center text-xs mr-3 font-bold">
                                                        {item.quantity}x
                                                    </span>
                                                    <div>
                                                        <span className="font-medium text-gray-900">{item.name}</span>
                                                        <span className="text-gray-500 ml-2">({item.variant})</span>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Action Buttons */}
                                <div className="p-6 bg-gray-50 flex justify-end gap-3">
                                    <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50">
                                        Need Help?
                                    </button>
                                    <button className="px-4 py-2 bg-pink-600 rounded-lg text-sm font-bold text-white hover:bg-pink-700 shadow flex items-center">
                                        <ShoppingBag className="w-4 h-4 mr-2" />
                                        Re-Order
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-12 bg-white rounded-2xl border border-gray-100">
                                <Package className="w-16 h-16 mb-4 opacity-20" />
                                <p>Select an order to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper component for calendar icon to avoid repetition
const CalendarIcon = ({ date }) => (
    <svg className="w-4 h-4 mr-2 text-pink-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

export default OrdersPage;
