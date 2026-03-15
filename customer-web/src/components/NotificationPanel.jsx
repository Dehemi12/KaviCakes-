import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, Info, AlertTriangle, AlertCircle, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const NotificationPanel = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const panelRef = useRef(null);

    useEffect(() => {
        fetchNotifications();
        
        // Polling every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications/customer');
            setNotifications(res.data || []);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => 
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    };

    const handleActionClick = async (notification) => {
        markAsRead(notification.id);
        
        // Navigation Logic based on notification type mapping
        const orderId = notification.metadata?.orderId;
        
        if (notification.type === 'CONFIRMATION') {
            try {
                await api.put(`/orders/${orderId}/confirm`);
                setNotifications(prev => prev.filter(n => n.id !== notification.id));
                alert("Order successfully confirmed!");
            } catch (err) {
                console.error('Failed to confirm order', err);
            }
        } else if (orderId) {
            navigate(`/track-order/${orderId}`);
        }
        setIsOpen(false);
    };

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const getIcon = (type) => {
        switch (type) {
            case 'PAYMENT_ADVANCE':
            case 'PAYMENT_FULL':
                return <AlertCircle className="h-5 w-5 text-red-500" />;
            case 'CONFIRMATION':
                return <Info className="h-5 w-5 text-blue-500" />;
            case 'EDIT_REMINDER':
                return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            default:
                return <Bell className="h-5 w-5 text-gray-500" />;
        }
    };

    const getActionLabel = (type) => {
        switch (type) {
            case 'PAYMENT_ADVANCE': return 'Pay Advance';
            case 'PAYMENT_FULL': return 'Complete Payment';
            case 'CONFIRMATION': return 'View Order';
            case 'EDIT_REMINDER': return 'Edit Order';
            default: return 'View';
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="relative group flex flex-col items-center" ref={panelRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="text-gray-500 hover:text-pink-600 transition-colors relative focus:outline-none"
            >
                <div>
                    <Bell className="h-6 w-6" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>
                <span className="hidden lg:block text-[10px] font-medium mt-0.5" style={{ minWidth: '45px', textAlign: 'center' }}>Alerts</span>
            </button>

            {/* Panel Dropdown */}
            <div className={`absolute right-0 top-12 w-80 sm:w-96 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 transition-all duration-200 origin-top-right ${isOpen ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-2 invisible'}`}>
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 border-l-4 border-pink-500 pl-2">Notifications</h3>
                    {unreadCount > 0 && (
                        <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full font-semibold">
                            {unreadCount} New
                        </span>
                    )}
                </div>

                <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center flex flex-col items-center">
                            <span className="text-4xl mb-2 opacity-20">🔕</span>
                            <p className="text-gray-500 text-sm">You have no new notifications.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {notifications.map((notification) => (
                                <div key={notification.id} className={`p-4 hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-pink-50/30' : ''}`}>
                                    <div className="flex gap-3">
                                        <div className="mt-1 flex-shrink-0">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`text-sm font-semibold truncate ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {notification.title}
                                                </h4>
                                                <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                    {new Date(notification.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-3">
                                                {notification.message}
                                            </p>
                                            
                                            <div className="flex items-center justify-between">
                                                <button 
                                                    onClick={() => handleActionClick(notification)}
                                                    className="text-[11px] font-bold text-pink-600 hover:text-pink-700 bg-pink-50 hover:bg-pink-100 px-3 py-1.5 rounded flex items-center transition-colors"
                                                >
                                                    {getActionLabel(notification.type)}
                                                    <ExternalLink className="w-3 h-3 ml-1" />
                                                </button>
                                                
                                                {!notification.isRead && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                                                        className="text-[10px] text-gray-400 hover:text-gray-600 underline"
                                                    >
                                                        Mark as read
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {notifications.length > 0 && (
                    <div className="px-4 py-3 bg-gray-50 text-center border-t border-gray-100 rounded-b-xl">
                        <button className="text-xs font-semibold text-gray-500 hover:text-pink-600 transition-colors" onClick={() => setIsOpen(false)}>
                            Close Panel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationPanel;
