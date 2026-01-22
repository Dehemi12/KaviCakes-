import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/Profile';
import CustomOrderPage from './pages/CustomOrderPage';
import BulkOrderPage from './pages/BulkOrderPage';
import CakesPage from './pages/CakesPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="cakes" element={<CakesPage />} />
            <Route path="cakes/:id" element={<ProductDetailsPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            } />
            <Route path="custom-orders" element={<CustomOrderPage />} />
            <Route path="bulk-orders" element={<BulkOrderPage />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="orders" element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            } />
            <Route path="*" element={<div className="text-center py-20 text-xl text-gray-500">Page not found</div>} />
          </Route>
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
