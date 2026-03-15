import React, { useState } from 'react';
import { X, Bell } from 'lucide-react';

const NotificationBar = () => {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <div className="bg-gradient-to-r from-pink-600 to-pink-500 text-white px-4 py-2 sm:px-6 lg:px-8 relative shadow-md z-50">
            <div className="flex items-center justify-center text-center">
                <p className="text-xs sm:text-sm font-semibold flex items-center truncate lg:overflow-visible">
                    <span className="mr-2 animate-bounce">🎂</span>
                    Welcome to KaviCakes! Pre-order your custom cakes 5 days in advance.
                </p>
            </div>
            <button 
                onClick={() => setIsVisible(false)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/90 hover:text-white hover:bg-white/20 rounded-full transition-all focus:outline-none"
                aria-label="Close notification"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
};

export default NotificationBar;
