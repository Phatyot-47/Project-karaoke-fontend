// ไฟล์นี้รวม API call ทั้งหมดของ frontend ไว้ที่เดียว
// ทุก request ผ่านฟังก์ชัน request() หรือ uploadFile() ซึ่งใช้ parseResponse() จัดการ error ร่วมกัน

// BASE_URL อ่านจาก environment variable — กำหนดใน .env (VITE_API_BASE_URL)
// ถ้าไม่ตั้งค่าไว้ จะใช้ localhost:4000/api เป็น fallback สำหรับ development
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

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
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method,
    // ตั้ง Content-Type เฉพาะเมื่อมี body — ถ้าไม่ตั้ง browser จะไม่ส่ง header นี้ (ถูกต้องสำหรับ GET)
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  return parseResponse(res, 'เกิดข้อผิดพลาด');
}

/**
 * อ่าน body เป็น JSON (ถ้ามี) แล้วโยน Error พร้อม .status และ .data เมื่อ response ไม่ ok
 * fallbackMessage ใช้เมื่อ backend ไม่ได้ส่ง { error } กลับมา
 */
async function parseResponse(res, fallbackMessage) {
  // บาง endpoint อาจตอบกลับมาโดยไม่มี body (เช่น 204 No Content)
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* ไม่มี body หรือไม่ใช่ JSON */
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

  const res = await fetch(`${BASE_URL}/uploads`, { method: 'POST', body: formData });
  return parseResponse(res, 'อัปโหลดไฟล์ไม่สำเร็จ');
}

// ออบเจกต์รวม API method ทั้งหมด — import api from './api/client.js'
const api = {
  // ---- อัปโหลดไฟล์ ----
  uploadFile,

  // ---- auth: ลงทะเบียน/ล็อกอินลูกค้า + ล็อกอินแอดมิน ----
  registerCustomer: (name, phone) => request('/auth/register', { method: 'POST', body: { name, phone } }),
  loginCustomer: (phone) => request('/auth/login', { method: 'POST', body: { phone } }),
  loginAdmin: (username, password) => request('/auth/admin-login', { method: 'POST', body: { username, password } }),

  // ---- ข้อมูลส่วนตัวลูกค้า ----
  updateProfile: (userId, name, phone) => request(`/users/${userId}`, { method: 'PATCH', body: { name, phone } }),

  // ---- ห้อง (ฝั่งลูกค้า) ----
  // start/end (ไม่บังคับ) = ช่วงเวลาที่ค้นหา — ถ้าส่งมา แต่ละห้องจะมี is_available บอกว่าว่างทั้งช่วงหรือไม่
  listRooms: (size, start, end) => request('/rooms', { params: { size, start, end } }),
  getRoom: (id) => request(`/rooms/${id}`),
  getRoomAvailability: (id, date) => request(`/rooms/${id}/availability`, { params: { date } }),

  // ---- การจอง (ฝั่งลูกค้า) ----
  createBooking: (payload) => request('/bookings', { method: 'POST', body: payload }),
  listCustomerBookings: (customerId) => request(`/bookings/customer/${customerId}`),
  cancelBooking: (id, reason) => request(`/bookings/${id}/cancel`, { method: 'PATCH', body: { reason } }),

  // ---- การชำระเงิน ----
  createPayment: (payload) => request('/payments', { method: 'POST', body: payload }),

  // ---- แอดมิน: จัดการการจอง ----
  getTodayBookings: () => request('/admin/bookings/today'),
  confirmBooking: (id) => request(`/admin/bookings/${id}/confirm`, { method: 'PATCH' }),
  rejectBooking: (id, reason) => request(`/admin/bookings/${id}/reject`, { method: 'PATCH', body: { reason } }),
  changeBookingRoom: (id, roomId) => request(`/admin/bookings/${id}/change-room`, { method: 'PATCH', body: { roomId } }),
  createWalkInBooking: (payload) => request('/admin/bookings/walkin', { method: 'POST', body: payload }),
  getBookingHistory: () => request('/admin/bookings/history'),

  // ---- แอดมิน: ตรวจสอบสลิปการชำระเงิน ----
  verifyPayment: (paymentId, approve, adminUserId) =>
    request(`/admin/payments/${paymentId}/verify`, { method: 'PATCH', body: { approve, adminUserId } }),

  // ---- แอดมิน: ตั้งค่าร้าน ----
  getShop: () => request('/admin/shop'),
  updateShop: (payload) => request('/admin/shop', { method: 'PATCH', body: payload }),
  updateShopHours: (hours) => request('/admin/shop/hours', { method: 'PATCH', body: { hours } }),

  // ---- แอดมิน: จัดการห้อง ----
  listAdminRooms: () => request('/admin/rooms'),
  createAdminRoom: (payload) => request('/admin/rooms', { method: 'POST', body: payload }),
  updateAdminRoom: (id, payload) => request(`/admin/rooms/${id}`, { method: 'PATCH', body: payload }),
  deleteAdminRoom: (id) => request(`/admin/rooms/${id}`, { method: 'DELETE' }),

  // ---- แอดมิน: รายงาน ----
  getReports: (period) => request('/admin/reports', { params: { period } }),
};

export default api;
