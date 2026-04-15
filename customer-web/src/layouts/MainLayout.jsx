import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import NotificationBar from '../components/NotificationBar';
import FloatingCart from '../components/FloatingCart';

const MainLayout = () => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <NotificationBar />
            <Navbar />
            <main className="flex-grow relative">
                <Outlet />
                <FloatingCart />
            </main>
            <Footer />
        </div>
    );
};

export default MainLayout;
