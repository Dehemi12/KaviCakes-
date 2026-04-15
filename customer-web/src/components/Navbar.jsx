import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Search, Heart, ChevronDown, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import NotificationPanel from './NotificationPanel';

const Navbar = () => {
    const { user, logout } = useAuth();
    const cartContext = useCart();
    // Safe access to cartCount in case context is partial or failing
    const cartCount = cartContext?.cartCount || 0;
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/public/cakes/master-data');
                // Backend: { sizes, shapes, flavors, categories: [{id,name}, ...] }
                if (res.data && res.data.categories) {
                    setCategories(res.data.categories.map(c => c.name));
                }
            } catch (err) {
                console.error("Failed to fetch nav categories", err);
            }
        };
        fetchCategories();
    }, []);

    // navItems replaced by static structure in render for better control

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-white shadow-sm sticky top-0 z-50 font-sans">
            {/* Top Bar with Logo, Search, Actions */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <Link to="/" className="flex items-center group">
                        <span className="text-3xl font-bold text-pink-600 tracking-tight group-hover:text-pink-700 transition-colors">KaviCakes</span>
                    </Link>

                    {/* Search Bar - Hidden on mobile, visible on md+ */}
                    <div className="hidden md:flex flex-1 max-w-lg mx-8 relative">
                        <input
                            type="text"
                            placeholder="Search for cakes..."
                            className="w-full pl-5 pr-12 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-gray-700 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all placeholder-gray-400"
                        />
                        <button className="absolute right-1 top-1 bottom-1 px-4 text-white bg-pink-600 rounded-full hover:bg-pink-700 transition-colors flex items-center justify-center">
                            <Search className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center space-x-6">
                        <Link to="/wishlist" className="text-gray-500 hover:text-pink-600 transition-colors relative group flex flex-col items-center">
                            <Heart className="h-6 w-6" />
                            <span className="hidden lg:block text-[10px] font-medium mt-0.5 group-hover:text-pink-600">Wishlist</span>
                        </Link>

                        <Link to="/cart" className="text-gray-500 hover:text-pink-600 transition-colors relative group flex flex-col items-center">
                            <div className="relative">
                                <ShoppingCart className="h-6 w-6" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                                        {cartCount}
                                    </span>
                                )}
                            </div>
                            <span className="hidden lg:block text-[10px] font-medium mt-0.5 group-hover:text-pink-600">Cart</span>
                        </Link>

                        {user ? (
                            <div className="flex items-center space-x-6">
                                <NotificationPanel />
                                
                                <div className="relative group">
                                    <button className="flex flex-col items-center text-gray-500 hover:text-pink-600 focus:outline-none">
                                    <User className="h-6 w-6" />
                                    <span className="hidden lg:block text-[10px] font-medium mt-0.5">{user.name.split(' ')[0]}</span>
                                </button>
                                <div className="absolute right-0 w-48 mt-2 origin-top-right bg-white border border-gray-100 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                    <div className="py-1">
                                        <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600">Profile</Link>
                                        <Link to="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600">My Orders</Link>
                                    </div>
                                    <div className="border-t border-gray-100 py-1">
                                        <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600">Logout</button>
                                    </div>
                                </div>
                                </div>
                            </div>
                        ) : (
                            <Link to="/login" className="px-5 py-2 text-sm font-medium text-white bg-gray-900 rounded-full hover:bg-gray-800 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                                Login
                            </Link>
                        )}

                        {/* Mobile menu button */}
                        <div className="flex items-center md:hidden">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
                            >
                                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Secondary Navigation (Categories) */}
            <div className="hidden md:block border-t border-gray-100 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center space-x-10 py-3">
                        <Link to="/" className={`text-xs font-bold transition-colors uppercase tracking-wider relative group ${location.pathname === '/' ? 'text-pink-600' : 'text-gray-500 hover:text-pink-600'}`}>
                            Home
                            <span className={`absolute -bottom-3 left-0 h-0.5 bg-pink-600 transition-all ${location.pathname === '/' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                        </Link>

                        {/* Categories Dropdown */}
                        <div className="relative group">
                            <Link to="/cakes" className={`flex items-center text-xs font-bold transition-colors uppercase tracking-wider outline-none ${location.pathname.includes('/categories') || location.pathname.includes('/cakes') ? 'text-pink-600' : 'text-gray-500 hover:text-pink-600'}`}>
                                Categories <ChevronDown className="ml-1 h-3 w-3" />
                                <span className={`absolute -bottom-3 left-0 h-0.5 bg-pink-600 transition-all ${(location.pathname.includes('/categories') || location.pathname.includes('/cakes')) && location.pathname !== '/' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                            </Link>
                            <div className="absolute left-1/2 transform -translate-x-1/2 top-full pt-3 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1">
                                    <Link to="/cakes" className="block px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 font-bold border-b border-gray-50">All Cakes</Link>
                                    {categories.map(cat => (
                                        <Link key={cat} to={`/cakes?category=${encodeURIComponent(cat)}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600">
                                            {cat}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Link to="/custom-orders" className={`text-xs font-bold transition-colors uppercase tracking-wider relative group ${location.pathname === '/custom-orders' ? 'text-pink-600' : 'text-gray-500 hover:text-pink-600'}`}>
                            Custom Cakes
                            <span className={`absolute -bottom-3 left-0 h-0.5 bg-pink-600 transition-all ${location.pathname === '/custom-orders' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                        </Link>

                        <Link to="/bulk-orders" className={`text-xs font-bold transition-colors uppercase tracking-wider relative group ${location.pathname === '/bulk-orders' ? 'text-pink-600' : 'text-gray-500 hover:text-pink-600'}`}>
                            Bulk Orders
                            <span className={`absolute -bottom-3 left-0 h-0.5 bg-pink-600 transition-all ${location.pathname === '/bulk-orders' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 absolute w-full z-50 shadow-lg">
                    {/* Mobile Search */}
                    <div className="p-4 border-b border-gray-100">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search for cakes..."
                                className="w-full pl-4 pr-10 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-pink-500"
                            />
                            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                        </div>
                    </div>
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                        <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-pink-600 hover:bg-pink-50" onClick={() => setIsMenuOpen(false)}>
                            Home
                        </Link>

                        <div className="px-3 py-2">
                            <Link to="/cakes" className="text-base font-medium text-gray-900 mb-2 hover:text-pink-600 block" onClick={() => setIsMenuOpen(false)}>Categories</Link>
                            <div className="pl-4 space-y-2 border-l-2 border-pink-100 hover:border-pink-200">
                                <Link to="/cakes" className="block text-sm font-bold text-gray-600 hover:text-pink-600" onClick={() => setIsMenuOpen(false)}>All Cakes</Link>
                                {categories.map(cat => (
                                    <Link key={cat} to={`/cakes?category=${encodeURIComponent(cat)}`} className="block text-sm text-gray-600 hover:text-pink-600" onClick={() => setIsMenuOpen(false)}>
                                        {cat}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <Link to="/custom-orders" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-pink-600 hover:bg-pink-50" onClick={() => setIsMenuOpen(false)}>
                            Custom Cakes
                        </Link>

                        <Link to="/bulk-orders" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-pink-600 hover:bg-pink-50" onClick={() => setIsMenuOpen(false)}>
                            Bulk Orders
                        </Link>

                        <div className="border-t border-gray-100 my-2 pt-2"></div>

                        {user ? (
                            <>
                                <Link to="/profile" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50" onClick={() => setIsMenuOpen(false)}>Profile</Link>
                                <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-gray-50">Logout</button>
                            </>
                        ) : (
                            <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium text-pink-600 hover:bg-pink-50" onClick={() => setIsMenuOpen(false)}>Login</Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
