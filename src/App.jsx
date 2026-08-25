import { Routes, Route, Navigate } from 'react-router-dom';
import CustomerLayout from './layouts/CustomerLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';

import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import RoomListPage from './pages/RoomListPage.jsx';
import BookingPage from './pages/BookingPage.jsx';
import PaymentPage from './pages/PaymentPage.jsx';
import SuccessPage from './pages/SuccessPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';

import AdminLoginPage from './pages/admin/AdminLoginPage.jsx';
import AdminBookingsPage from './pages/admin/AdminBookingsPage.jsx';
import AdminWalkInPage from './pages/admin/AdminWalkInPage.jsx';
import AdminHistoryPage from './pages/admin/AdminHistoryPage.jsx';
import AdminShopSettingsPage from './pages/admin/AdminShopSettingsPage.jsx';
import AdminRoomSettingsPage from './pages/admin/AdminRoomSettingsPage.jsx';
import AdminReportsPage from './pages/admin/AdminReportsPage.jsx';

export default function App() {
  return (
    <Routes>
      {/* ---- ลูกค้า: auth ---- */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ---- ลูกค้า: ต้องล็อกอิน ---- */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<RoomListPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Route>
      <Route path="/book/:roomId" element={<BookingPage />} />
      <Route path="/pay/:bookingId" element={<PaymentPage />} />
      <Route path="/success" element={<SuccessPage />} />

      {/* ---- แอดมิน ---- */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<Navigate to="/admin/bookings" replace />} />
      <Route element={<AdminLayout />}>
        <Route path="/admin/bookings" element={<AdminBookingsPage />} />
        <Route path="/admin/walkin" element={<AdminWalkInPage />} />
        <Route path="/admin/history" element={<AdminHistoryPage />} />
        <Route path="/admin/shop-settings" element={<AdminShopSettingsPage />} />
        <Route path="/admin/room-settings" element={<AdminRoomSettingsPage />} />
        <Route path="/admin/reports" element={<AdminReportsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
