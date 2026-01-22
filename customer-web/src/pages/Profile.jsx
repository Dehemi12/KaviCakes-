import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, MapPin, LogOut } from 'lucide-react';

const Profile = () => {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="bg-pink-600 px-6 py-4">
                    <div className="flex items-center">
                        <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center text-pink-600 font-bold text-2xl">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                            <h2 className="text-xl font-semibold text-white">{user.name}</h2>
                            <p className="text-pink-100">Customer Account</p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                            <Mail className="h-6 w-6 text-gray-400 mt-1" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Email Address</p>
                                <p className="text-lg text-gray-900">{user.email}</p>
                            </div>
                        </div>

                        <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                            <Phone className="h-6 w-6 text-gray-400 mt-1" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Phone Number</p>
                                <p className="text-lg text-gray-900">{user.phone || 'Not provided'}</p>
                            </div>
                        </div>

                        <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                            <MapPin className="h-6 w-6 text-gray-400 mt-1" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Address</p>
                                <p className="text-lg text-gray-900">{user.address || 'Not provided'}</p>
                            </div>
                        </div>

                        <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                            <User className="h-6 w-6 text-gray-400 mt-1" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Member Since</p>
                                <p className="text-lg text-gray-900">January 2026</p>
                            </div>
                        </div>

                    </div>

                    <div className="pt-6 border-t border-gray-200">
                        <button
                            onClick={logout}
                            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        >
                            <LogOut className="h-5 w-5 mr-2" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
