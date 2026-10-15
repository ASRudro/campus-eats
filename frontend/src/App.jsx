import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import BackendStatusBanner from './components/BackendStatusBanner';

// Pages
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import FoodDetailsPage from './pages/FoodDetailsPage';
import CartPage from './pages/CartPage';
import MyOrdersPage from './pages/MyOrdersPage';
import FavoritesPage from './pages/FavoritesPage';
import WeeklySchedulePage from './pages/WeeklySchedulePage';
import GroupOrderPage from './pages/GroupOrderPage';
import LoyaltyPage from './pages/LoyaltyPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import KitchenDashboard from './pages/KitchenDashboard';
import AdminDashboard from './pages/AdminDashboard';

import { useAuth } from './context/AuthContext';

export default function App() {
  const { isAuthenticated, role } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <BackendStatusBanner />
      <Navbar />

      <main style={{ flex: 1 }}>
        <Routes>
          {/* Default Root: HomePage for students and visitors */}
          <Route 
            path="/" 
            element={
              role === 'kitchen' ? (
                <Navigate to="/kitchen" replace />
              ) : role === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : (
                <HomePage />
              )
            } 
          />
          <Route 
            path="/home" 
            element={
              role === 'kitchen' ? (
                <Navigate to="/kitchen" replace />
              ) : role === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : (
                <HomePage />
              )
            } 
          />
          
          {/* Menu & Details */}
          <Route 
            path="/menu" 
            element={
              role === 'kitchen' ? <Navigate to="/kitchen" replace /> : <MenuPage />
            } 
          />
          <Route path="/menu/:id" element={<FoodDetailsPage />} />

          {/* Cart & Auth */}
          <Route 
            path="/cart" 
            element={
              role === 'kitchen' ? (
                <Navigate to="/kitchen" replace />
              ) : role === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : (
                <CartPage />
              )
            } 
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Student Protected Routes */}
          <Route
            path="/orders"
            element={
              <ProtectedRoute allowedRoles={['student', 'admin']}>
                <MyOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schedule"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <WeeklySchedulePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/group-order"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <GroupOrderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/loyalty"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <LoyaltyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['student', 'kitchen', 'admin']}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Kitchen Staff Route */}
          <Route
            path="/kitchen"
            element={
              <ProtectedRoute allowedRoles={['kitchen', 'admin']}>
                <KitchenDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
