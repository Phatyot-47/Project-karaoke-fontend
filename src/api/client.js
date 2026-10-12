// รวมการเรียก backend (API) ทั้งหมดของหน้าเว็บไว้ที่ไฟล์นี้
// หน้าอื่นเรียกผ่าน api.xxx() เช่น api.getShop() — ไม่ต้องเขียน fetch เองทุกหน้า
// ทุกคำขอผ่าน request() (ข้อมูล JSON) หรือ uploadFile() (ไฟล์รูป) และจัดการ error ที่ parseResponse() จุดเดียว

// ที่อยู่ของ backend — ตั้งได้ในไฟล์ .env (VITE_API_BASE_URL) ถ้าไม่ตั้งใช้ http://localhost:4000/api
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

// ลิงก์รูปที่อัปโหลด backend เก็บแบบสั้นๆ เช่น "/uploads/abc.jpg" (ไม่มีชื่อเครื่อง)
// ตอนแสดงรูป ต้องเติมที่อยู่ backend ข้างหน้า เช่น "http://localhost:4000/uploads/abc.jpg"
// (ลิงก์แบบอื่น เช่น /assets/... ที่เป็นรูปของหน้าเว็บเอง ใช้ตามเดิม)
const API_ORIGIN = new URL(BASE_URL, window.location.href).origin;
export function fileUrl(url) {
  return typeof url === 'string' && url.startsWith('/uploads/') ? API_ORIGIN + url : url;
}

// token (บัตรผ่าน) เก็บอยู่ใน localStorage แยกลูกค้า/แอดมิน (ดู AuthContext)
// เลือกใช้ตามหน้าที่เปิดอยู่: หน้า /admin/... ใช้ token แอดมิน / หน้าอื่นใช้ token ลูกค้า
const SESSIONS = {
  customer: { key: 'gens_karaoke_customer', loginPath: '/login' },
  admin: { key: 'gens_karaoke_admin', loginPath: '/admin/login' },
};

function currentSession() {
  const session = window.location.pathname.startsWith('/admin') ? SESSIONS.admin : SESSIONS.customer;
  let token = null;
  try {
    token = JSON.parse(localStorage.getItem(session.key))?.token || null;
  } catch {
    /* ข้อมูลเสีย = ถือว่าไม่มี token */
  }
  return { ...session, token };
}

function authHeaders() {
  const { token } = currentSession();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * ส่งคำขอไป backend แล้วคืนข้อมูลที่ได้
 * - params = ค่าที่ต่อท้าย URL เช่น { date: '2026-10-12' } → ?date=2026-10-12 (ค่าว่างจะถูกข้าม)
 * - body = ข้อมูลที่ส่งไป (แปลงเป็น JSON ให้)
 * - backend ตอบ error → โยน Error ที่มีข้อความจาก backend ให้หน้าเว็บเอาไปแสดง
 */
async function request(path, { method = 'GET', body, params } = {}) {
  let url = `${BASE_URL}${path}`;

  // ต่อ ?key=value ท้าย URL (ข้ามค่าที่ว่าง)
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
    ).toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method,
    // แนบ token ทุกครั้ง + บอกว่าเป็น JSON (เฉพาะตอนมีข้อมูลส่งไป)
    headers: { ...authHeaders(), ...(body && { 'Content-Type': 'application/json' }) },
    body: body ? JSON.stringify(body) : undefined,
  });

  return parseResponse(res, 'เกิดข้อผิดพลาด');
}

/**
 * อ่านคำตอบจาก backend — สำเร็จคืนข้อมูล / ไม่สำเร็จโยน Error พร้อมข้อความ
 * fallbackMessage = ข้อความสำรอง ถ้า backend ไม่ได้บอกว่าผิดอะไร
 */
let redirectingToLogin = false;

async function parseResponse(res, fallbackMessage) {
  // บางคำตอบไม่มีข้อมูลแนบมา ก็ไม่เป็นไร
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* ไม่มี body หรือไม่ใช่ JSON */
  }

  // 401 = ยังไม่ล็อกอิน หรือ token หมดอายุ → ลบข้อมูลล็อกอินแล้วพาไปหน้าเข้าสู่ระบบ
  // (ยกเว้นตอนอยู่หน้าเข้าสู่ระบบเอง เพราะ 401 ตรงนั้นแปลว่ารหัสผ่านผิด)
  // ถ้าหลายคำขอได้ 401 พร้อมกัน ให้พาไปหน้าล็อกอินครั้งเดียวพอ
  if (res.status === 401 && !redirectingToLogin) {
    const session = currentSession();
    if (window.location.pathname !== session.loginPath && !window.location.pathname.startsWith('/register')) {
      redirectingToLogin = true;
      localStorage.removeItem(session.key);
      window.location.replace(session.loginPath);
    }
  }

  if (!res.ok) {
    const err = new Error((data && data.error) || `${fallbackMessage} (HTTP ${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

/**
 * อัปโหลดไฟล์รูป (สลิป / รูปห้อง / รูปโปรไฟล์) — ได้ { url: '/uploads/...' } กลับมา
 * แยกจาก request() เพราะไฟล์ต้องส่งแบบฟอร์ม (FormData) ไม่ใช่ JSON และให้เบราว์เซอร์ตั้ง header เอง
 */
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/uploads`, { method: 'POST', headers: authHeaders(), body: formData });
  return parseResponse(res, 'อัปโหลดไฟล์ไม่สำเร็จ');
}

// รายการ API ทั้งหมด — ใช้ในหน้าอื่นด้วย import api from '../api/client.js' แล้วเรียก api.ชื่อ(...)
const api = {
  // ---- อัปโหลดไฟล์ ----
  uploadFile,

  // ---- auth: ลงทะเบียน/ล็อกอินลูกค้า + ล็อกอินแอดมิน ----
  // ผลลัพธ์ = ข้อมูลผู้ใช้ + token / login บัญชีเดิมที่ยังไม่มีรหัสผ่านจะได้ error.data.code = 'PASSWORD_NOT_SET'
  registerCustomer: (name, phone, password) =>
    request('/auth/register', { method: 'POST', body: { name, phone, password } }),
  loginCustomer: (phone, password) => request('/auth/login', { method: 'POST', body: { phone, password } }),
  setFirstPassword: (phone, name, password) =>
    request('/auth/set-password', { method: 'POST', body: { phone, name, password } }),
  loginAdmin: (username, password) => request('/auth/admin-login', { method: 'POST', body: { username, password } }),

  // ---- แจ้งเตือนของลูกค้า (กระดิ่งบนเมนู) ----
  listNotifications: () => request('/notifications'), // { unreadCount, items }
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PATCH' }),

  // ---- ข้อมูลส่วนตัวลูกค้า ----
  updateProfile: (userId, name, phone, avatarUrl) =>
    request(`/users/${userId}`, { method: 'PATCH', body: { name, phone, avatarUrl } }),
  changePassword: (userId, currentPassword, newPassword) =>
    request(`/users/${userId}/password`, { method: 'PATCH', body: { currentPassword, newPassword } }),

  // ---- ห้อง (ฝั่งลูกค้า) ----
  // start/end (ไม่บังคับ) = ช่วงเวลาที่ค้นหา — ถ้าส่งมา แต่ละห้องจะมี is_available บอกว่าว่างทั้งช่วงหรือไม่
  listRooms: (size, start, end) => request('/rooms', { params: { size, start, end } }),
  getRoom: (id) => request(`/rooms/${id}`),
  getRoomAvailability: (id, date) => request(`/rooms/${id}/availability`, { params: { date } }),
  // ประเภทห้อง (S/M/L/XL ...) + จำนวนห้องและราคาเริ่มต้นของแต่ละประเภท — ใช้ทำแท็บกรองหน้าเลือกห้อง
  listRoomTypes: () => request('/room-types'),

  // ---- การจอง (ฝั่งลูกค้า) ----
  createBooking: (payload) => request('/bookings', { method: 'POST', body: payload }),
  getBooking: (id) => request(`/bookings/${id}`),
  listCustomerBookings: (customerId) => request(`/bookings/customer/${customerId}`),
  cancelBooking: (id, reason) => request(`/bookings/${id}/cancel`, { method: 'PATCH', body: { reason } }),
  // เปลี่ยนห้อง/เวลา — ผลลัพธ์มี topup_due = มัดจำส่วนต่างที่ต้องจ่ายเพิ่ม (0 = ไม่ต้องจ่าย)
  editBooking: (id, payload) => request(`/bookings/${id}/edit`, { method: 'PATCH', body: payload }),

  // ---- การชำระเงิน ----
  createPayment: (payload) => request('/payments', { method: 'POST', body: payload }),

  // ---- แอดมิน: จัดการการจอง ----
  getTodayBookings: () => request('/admin/bookings/today'),
  // แจ้งเตือนแอดมิน: { pendingCount, latestPaymentId, newSlips } — newSlips = สลิปรอตรวจที่ payment_id > afterPaymentId
  getAdminAlerts: (afterPaymentId) => request('/admin/alerts', { params: { afterPaymentId } }),
  confirmBooking: (id) => request(`/admin/bookings/${id}/confirm`, { method: 'PATCH' }),
  rejectBooking: (id, reason) => request(`/admin/bookings/${id}/reject`, { method: 'PATCH', body: { reason } }),
  markNoShow: (id, reason) => request(`/admin/bookings/${id}/no-show`, { method: 'PATCH', body: { reason } }),
  changeBookingRoom: (id, roomId) =>
    request(`/admin/bookings/${id}/change-room`, { method: 'PATCH', body: { roomId } }),

  // ---- แอดมิน: Check-in / ต่อเวลา / Check-out ----
  // ลูกค้าจ่ายมัดจำเป็นเงินสดที่หน้าร้าน — บันทึกยอดที่ยังขาดเป็นเงินสด แล้วกดยืนยันการจองต่อได้
  recordCashDeposit: (id) => request(`/admin/bookings/${id}/cash-deposit`, { method: 'PATCH' }),
  checkIn: (id) => request(`/admin/bookings/${id}/check-in`, { method: 'PATCH' }),
  extendBooking: (id, minutes) => request(`/admin/bookings/${id}/extend`, { method: 'PATCH', body: { minutes } }),
  checkOut: (id) => request(`/admin/bookings/${id}/check-out`, { method: 'PATCH' }),
  createWalkInBooking: (payload) => request('/admin/bookings/walkin', { method: 'POST', body: payload }),
  getBookingHistory: () => request('/admin/bookings/history'),

  // ---- แอดมิน: ตรวจสอบสลิปการชำระเงิน ----
  // ปฏิเสธสลิป (approve = false) จะยกเลิกการจองนั้นทันทีพร้อม reason
  verifyPayment: (paymentId, approve, reason) =>
    request(`/admin/payments/${paymentId}/verify`, { method: 'PATCH', body: { approve, reason } }),

  // ---- แอดมิน: ตั้งค่าร้าน ----
  getShop: () => request('/shop'), // ข้อมูลร้านแบบสาธารณะ ใช้ทั้งฝั่งลูกค้าและแอดมิน
  updateShop: (payload) => request('/admin/shop', { method: 'PATCH', body: payload }),
  updatePolicy: (payload) => request('/admin/policy', { method: 'PATCH', body: payload }),
  updateShopHours: (hours) => request('/admin/shop/hours', { method: 'PATCH', body: { hours } }),

  // ---- แอดมิน: จัดการห้อง ----
  listAdminRooms: () => request('/admin/rooms'),
  updateAdminRoom: (id, payload) => request(`/admin/rooms/${id}`, { method: 'PATCH', body: payload }),
  deleteAdminRoom: (id) => request(`/admin/rooms/${id}`, { method: 'DELETE' }),
  // เพิ่มห้องธรรมดาหลายห้องตามประเภท — items = [{ typeId, count }] ชื่อห้องตั้งให้อัตโนมัติ เช่น S-01
  bulkCreateAdminRooms: (items) => request('/admin/rooms/bulk', { method: 'POST', body: { items } }),

  // ---- แอดมิน: ประเภทห้อง ----
  listAdminRoomTypes: () => request('/admin/room-types'),
  createRoomType: (payload) => request('/admin/room-types', { method: 'POST', body: payload }),
  // payload.applyToRoomIds = ห้องธรรมดาที่เลือกให้เปลี่ยนเป็นราคาใหม่ของประเภท
  updateRoomType: (id, payload) => request(`/admin/room-types/${id}`, { method: 'PATCH', body: payload }),
  deleteRoomType: (id) => request(`/admin/room-types/${id}`, { method: 'DELETE' }),

  // ---- แอดมิน: รายงาน ----
  getReports: (period) => request('/admin/reports', { params: { period } }),
};

export default api;
