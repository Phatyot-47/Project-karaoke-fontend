// ไฟล์กำหนด routing ทั้งหมดของแอป แบ่งเป็น 3 กลุ่มหลัก:
//   1. ลูกค้า: หน้า auth (ไม่ต้องล็อกอิน)       → /login, /register
//   2. ลูกค้า: หน้าที่ต้องล็อกอิน (ผ่าน CustomerLayout) → /, /history
//      และหน้าที่เข้าถึงได้โดยตรง (ไม่อยู่ใน CustomerLayout) → /book/:id, /pay/:id, /success
//   3. แอดมิน: ล็อกอิน + ระบบจัดการร้าน (ผ่าน AdminLayout) → /admin/*
//
// เส้นทางที่ไม่ตรงกับเส้นใดเลย (*) จะถูก redirect กลับหน้าหลัก (/)
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
      {/* ---- ลูกค้า: หน้า auth (ไม่ต้องล็อกอิน) ---- */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ---- ลูกค้า: หน้าที่ต้องล็อกอิน (CustomerLayout จะ redirect ถ้ายังไม่ล็อกอิน) ---- */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<RoomListPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Route>

      {/* หน้าจองและชำระเงิน — อยู่นอก CustomerLayout เพื่อซ่อน topbar/footer */}
      <Route path="/book/:roomId" element={<BookingPage />} />
      <Route path="/pay/:bookingId" element={<PaymentPage />} />
      <Route path="/success" element={<SuccessPage />} />

      {/* ---- แอดมิน ---- */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      {/* /admin ไม่มีหน้าของตัวเอง — redirect ไปหน้าจัดการจองทันที */}
      <Route path="/admin" element={<Navigate to="/admin/bookings" replace />} />
      <Route element={<AdminLayout />}>
        <Route path="/admin/bookings" element={<AdminBookingsPage />} />
        <Route path="/admin/walkin" element={<AdminWalkInPage />} />
        <Route path="/admin/history" element={<AdminHistoryPage />} />
        <Route path="/admin/shop-settings" element={<AdminShopSettingsPage />} />
        <Route path="/admin/room-settings" element={<AdminRoomSettingsPage />} />
        <Route path="/admin/reports" element={<AdminReportsPage />} />
      </Route>

      {/* เส้นทางที่ไม่ตรงกับใครเลย → กลับหน้าหลัก */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
