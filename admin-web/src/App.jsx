import React from 'react';
import { Layout, Menu, Avatar, Button, Typography, Space } from 'antd';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MainLayout from './layouts/MainLayout';
import Orders from './pages/Orders';
import Cakes from './pages/Cakes';
import CakeDetails from './pages/CakeDetails';
import OrderLog from './pages/OrderLog';
import Customers from './pages/Customers';
import Notifications from './pages/Notifications';
import Cashbook from './pages/Cashbook';
import Schedule from './pages/Schedule';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Production from './pages/Production';
import SiteContent from './pages/SiteContent';
import OrderConfirmation from './pages/OrderConfirmation';
import Reports from './pages/Reports';

const PrivateRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Double check authorization (though login handles it, this protects direct route access)
  if (user.role !== 'ADMIN') {
    return <Navigate to="/login" />;
  }

  return <MainLayout />;
};

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/order-log" element={<OrderLog />} />
          <Route path="/cakes" element={<Cakes />} />
          <Route path="/cakes/:id" element={<CakeDetails />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/cashbook" element={<Cashbook />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/production" element={<Production />} />
          <Route path="/site-content" element={<SiteContent />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Dashboard />} /> {/* Added catch-all route */}
        </Route>
      </Routes>
    </AuthProvider>
  );
};

export default App;
