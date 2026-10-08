// ไฟล์นี้รวม API call ทั้งหมดของ frontend ไว้ที่เดียว
// ทุก request ผ่านฟังก์ชัน request() หรือ uploadFile() ซึ่งใช้ parseResponse() จัดการ error ร่วมกัน

// BASE_URL อ่านจาก environment variable — กำหนดใน .env (VITE_API_BASE_URL)
// ถ้าไม่ตั้งค่าไว้ จะใช้ localhost:4000/api เป็น fallback สำหรับ development
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

// token เข้าสู่ระบบเก็บอยู่ในข้อมูลผู้ใช้ใน localStorage (ดู AuthContext) — แยกลูกค้า/แอดมิน
// เลือกตามหน้าที่เปิดอยู่: หน้า /admin/* ใช้ token แอดมิน นอกนั้นใช้ token ลูกค้า
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
    /* ข้อมูลเสีย = ไม่มี token */
  }
  return { ...session, token };
}

function authHeaders() {
  const { token } = currentSession();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * ฟังก์ชัน HTTP helper ทั่วไป
 * - รองรับ query params ผ่าน options.params (กรองค่าว่าง/null/undefined ออกอัตโนมัติ)
 * - แนบ Content-Type: application/json อัตโนมัติเมื่อมี body
 * - โยน Error พร้อม .status และ .data เมื่อ response ไม่ ok (4xx/5xx)
 */
async function request(path, { method = 'GET', body, params } = {}) {
  let url = `${BASE_URL}${path}`;

  // สร้าง query string จาก params — ข้ามค่าที่เป็น undefined, null, หรือ string ว่าง
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
    ).toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method,
    // ตั้ง Content-Type เฉพาะเมื่อมี body — ถ้าไม่ตั้ง browser จะไม่ส่ง header นี้ (ถูกต้องสำหรับ GET)
    headers: { ...authHeaders(), ...(body && { 'Content-Type': 'application/json' }) },
    body: body ? JSON.stringify(body) : undefined,
  });

  return parseResponse(res, 'เกิดข้อผิดพลาด');
}

/**
 * อ่าน body เป็น JSON (ถ้ามี) แล้วโยน Error พร้อม .status และ .data เมื่อ response ไม่ ok
 * fallbackMessage ใช้เมื่อ backend ไม่ได้ส่ง { error } กลับมา
 */
let redirectingToLogin = false;

async function parseResponse(res, fallbackMessage) {
  // บาง endpoint อาจตอบกลับมาโดยไม่มี body (เช่น 204 No Content)
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* ไม่มี body หรือไม่ใช่ JSON */
  }

  // 401 = ยังไม่ล็อกอิน / token หมดอายุ → ล้างเซสชันแล้วพาไปหน้าเข้าสู่ระบบ
  // (ยกเว้นตอนอยู่หน้าเข้าสู่ระบบเอง ซึ่ง 401 หมายถึงรหัสผ่านผิด)
  // หลาย request อาจได้ 401 พร้อมกัน → redirect ครั้งเดียวพอ
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
 * อัปโหลดไฟล์จริง (สลิปโอนเงิน / รูปห้อง) ผ่าน multipart/form-data
 * ไม่ผ่าน request() เพราะต้องให้ browser ตั้ง Content-Type พร้อม boundary เอง
 * (ถ้าตั้ง Content-Type: application/json เองจะทำให้ server parse form-data ไม่ได้)
 */
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/uploads`, { method: 'POST', headers: authHeaders(), body: formData });
  return parseResponse(res, 'อัปโหลดไฟล์ไม่สำเร็จ');
}

// ออบเจกต์รวม API method ทั้งหมด — import api from './api/client.js'
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
  confirmBooking: (id) => request(`/admin/bookings/${id}/confirm`, { method: 'PATCH' }),
  rejectBooking: (id, reason) => request(`/admin/bookings/${id}/reject`, { method: 'PATCH', body: { reason } }),
  markNoShow: (id, reason) => request(`/admin/bookings/${id}/no-show`, { method: 'PATCH', body: { reason } }),
  changeBookingRoom: (id, roomId) =>
    request(`/admin/bookings/${id}/change-room`, { method: 'PATCH', body: { roomId } }),

  // ---- แอดมิน: Check-in / ต่อเวลา / Check-out ----
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
  createAdminRoom: (payload) => request('/admin/rooms', { method: 'POST', body: payload }),
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
