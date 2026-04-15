import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

const WishlistPage = () => {
    const [wishlist, setWishlist] = useState([]);

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('wishlist') || '[]');
        setWishlist(saved);
        
        // Listen to updates from other tabs
        const handleStorageChange = () => {
            const updated = JSON.parse(localStorage.getItem('wishlist') || '[]');
            setWishlist(updated);
        };
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('wishlist-updated', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('wishlist-updated', handleStorageChange);
        };
    }, []);

    const removeFromWishlist = (id) => {
        const updated = wishlist.filter(item => item.id !== id);
        localStorage.setItem('wishlist', JSON.stringify(updated));
        setWishlist(updated);
        window.dispatchEvent(new Event('wishlist-updated'));
        toast.success("Removed from wishlist");
    };

    if (wishlist.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <Heart className="w-20 h-20 text-gray-300 mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
                <p className="text-gray-500 mb-8 max-w-md text-center">
                    Looks like you haven't added any cakes to your wishlist yet. Explore our collection and find your favorites!
                </p>
                <Link to="/cakes" className="bg-pink-600 text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-pink-700 hover:shadow-lg transition-all">
                    Explore Cakes
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen font-sans pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
                    <Heart className="w-8 h-8 text-pink-500 mr-3 fill-pink-100" />
                    My Wishlist
                </h1>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {wishlist.map((item) => (
                        <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group">
                            <div className="aspect-square relative flex items-center justify-center bg-gray-50">
                                <img src={item.image || 'https://via.placeholder.com/150'} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                <button 
                                    onClick={() => removeFromWishlist(item.id)}
                                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-sm text-pink-500 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                                    title="Remove from wishlist"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-gray-900 text-sm mb-1 truncate">{item.name}</h3>
                                <p className="text-pink-600 font-extrabold mb-4">Rs. {Number(item.price).toLocaleString()}</p>
                                <Link 
                                    to={`/cakes/${item.id}`}
                                    className="block text-center w-full bg-pink-50 text-pink-600 py-2 rounded-xl text-sm font-bold hover:bg-pink-100 transition-colors"
                                >
                                    View Options
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WishlistPage;
