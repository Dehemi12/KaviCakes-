import React from 'react';
import { Facebook, Twitter, Instagram } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white pt-10 pb-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-xl font-bold mb-4 text-pink-500">KaviCakes</h3>
                        <p className="text-gray-400">Making your special moments sweeter with our delicious cakes.</p>
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                        <ul className="space-y-2">
                            <li><a href="/cakes" className="text-gray-400 hover:text-white transition-colors">Our Cakes</a></li>
                            <li><a href="/about" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                            <li><a href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
                        <div className="flex space-x-4">
                            <a href="#" className="text-gray-400 hover:text-white transition-colors"><Facebook className="h-6 w-6" /></a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors"><Twitter className="h-6 w-6" /></a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors"><Instagram className="h-6 w-6" /></a>
                        </div>
                    </div>
                </div>
                <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
                    &copy; {new Date().getFullYear()} KaviCakes. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
