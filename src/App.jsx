// "แผนที่" ของเว็บ: URL ไหน → เปิดหน้าไหน แบ่งเป็น 3 กลุ่ม
//   1. ลูกค้า (ยังไม่ต้องล็อกอิน)  → /login, /register
//   2. ลูกค้า (ต้องล็อกอิน)       → /, /history, /profile (มีแถบเมนูด้านบน จาก CustomerLayout)
//                                → /book/:id, /pay/:id, /success (ไม่มีแถบเมนู ให้ลูกค้าโฟกัสการจอง)
//   3. แอดมิน                     → /admin/login และ /admin/* (มีเมนูด้านซ้าย จาก AdminLayout)
// URL ที่ไม่มีในรายการ → พากลับหน้าแรก (/)
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
import ProfilePage from './pages/ProfilePage.jsx';

import AdminLoginPage from './pages/admin/AdminLoginPage.jsx';
import AdminBookingsPage from './pages/admin/AdminBookingsPage.jsx';
import AdminWalkInPage from './pages/admin/AdminWalkInPage.jsx';
import AdminHistoryPage from './pages/admin/AdminHistoryPage.jsx';
import AdminShopSettingsPage from './pages/admin/AdminShopSettingsPage.jsx';
import AdminRoomSettingsPage from './pages/admin/AdminRoomSettingsPage.jsx';
import AdminRoomTypesPage from './pages/admin/AdminRoomTypesPage.jsx';
import AdminReportsPage from './pages/admin/AdminReportsPage.jsx';

export default function App() {
  return (
    <Routes>
      {/* ---- ลูกค้า: หน้า auth (ไม่ต้องล็อกอิน) ---- */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ---- ลูกค้า: หน้าที่ต้องล็อกอิน (ถ้ายังไม่ล็อกอิน CustomerLayout จะพาไปหน้าล็อกอินเอง) ---- */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<RoomListPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* หน้าจองและชำระเงิน — อยู่นอก CustomerLayout เพื่อซ่อน topbar/footer */}
      <Route path="/book/:roomId" element={<BookingPage />} />
      <Route path="/pay/:bookingId" element={<PaymentPage />} />
      <Route path="/success" element={<SuccessPage />} />

      {/* ---- แอดมิน ---- */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      {/* /admin ไม่มีหน้าของตัวเอง — พาไปหน้าอนุมัติการจองเลย */}
      <Route path="/admin" element={<Navigate to="/admin/bookings" replace />} />
      <Route element={<AdminLayout />}>
        <Route path="/admin/bookings" element={<AdminBookingsPage />} />
        <Route path="/admin/walkin" element={<AdminWalkInPage />} />
        <Route path="/admin/history" element={<AdminHistoryPage />} />
        <Route path="/admin/shop-settings" element={<AdminShopSettingsPage />} />
        <Route path="/admin/room-types" element={<AdminRoomTypesPage />} />
        <Route path="/admin/room-settings" element={<AdminRoomSettingsPage />} />
        <Route path="/admin/reports" element={<AdminReportsPage />} />
      </Route>

      {/* URL ที่ไม่มีในระบบ → กลับหน้าแรก */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
