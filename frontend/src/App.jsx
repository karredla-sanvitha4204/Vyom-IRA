import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PassengerLayout } from './layouts/PassengerLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Passenger Pages
import { PassengerHome } from './pages/passenger/PassengerHome';
import { FlightBooking } from './pages/passenger/FlightBooking';
import { MyBookings } from './pages/passenger/MyBookings';
import { CheckinPortal } from './pages/checkin/CheckinPortal';
import { AuthPage } from './pages/AuthPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';

export function App() {
  return (
    <Routes>
      {/* ==================================================== */}
      {/* 1. PASSENGER EXPERIENCE (CONSUMER AVIATION LAYOUT)   */}
      {/* ==================================================== */}
      <Route element={<PassengerLayout />}>
        <Route path="/" element={<PassengerHome />} />
        <Route path="/flights" element={<PassengerHome />} />
        <Route path="/flights/:flightId" element={<FlightBooking />} />
        <Route path="/book/:flightId" element={<FlightBooking />} />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute allowedRoles={['passenger', 'admin']}>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route path="/checkin" element={<CheckinPortal />} />
      </Route>

      {/* Stand-Alone Authentication Page with Animated Sky Canvas */}
      <Route path="/auth" element={<AuthPage />} />

      {/* ==================================================== */}
      {/* 2. PROTECTED ENTERPRISE ADMIN OPERATIONS CONSOLE     */}
      {/* ==================================================== */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard activeSection="overview" />} />
        <Route path="flights" element={<AdminDashboard activeSection="flights" />} />
        <Route path="bookings" element={<AdminDashboard activeSection="bookings" />} />
        <Route path="bookings/:id" element={<AdminDashboard activeSection="bookings" />} />
        <Route path="passengers" element={<AdminDashboard activeSection="passengers" />} />
        <Route path="notifications" element={<AdminDashboard activeSection="notifications" />} />
        <Route path="users" element={<AdminDashboard activeSection="users" />} />
      </Route>

      {/* Fallback to homepage */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
