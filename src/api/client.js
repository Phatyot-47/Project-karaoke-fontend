// ไฟล์นี้รวม API call ทั้งหมดของ frontend ไว้ที่เดียว
// ทุก request ผ่านฟังก์ชัน request() หรือ uploadFile() ซึ่งจัดการ error handling ไว้แล้ว

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

  // พยายาม parse JSON — บาง endpoint อาจตอบกลับมาโดยไม่มี body (เช่น 204 No Content)
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* ไม่มี body หรือไม่ใช่ JSON */
  }

  // ถ้า response ไม่ ok → โยน Error พร้อมข้อความจาก backend (ถ้ามี)
  if (!res.ok) {
    const message = (data && data.error) || `เกิดข้อผิดพลาด (HTTP ${res.status})`;
    const err = new Error(message);
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

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* ไม่มี body หรือไม่ใช่ JSON */
  }

  if (!res.ok) {
    const message = (data && data.error) || `อัปโหลดไฟล์ไม่สำเร็จ (HTTP ${res.status})`;
    throw new Error(message);
  }

  return data;
}

// ออบเจกต์รวม API method ทั้งหมด — import { api } from './api/client.js' หรือ import api from './api/client.js'
export const api = {
  // ---- อัปโหลดไฟล์ ----
  uploadFile,

  // ---- auth: ลงทะเบียน/ล็อกอินลูกค้า + ล็อกอินแอดมิน ----
  registerCustomer: (name, phone) => request('/auth/register', { method: 'POST', body: { name, phone } }),
  loginCustomer: (phone) => request('/auth/login', { method: 'POST', body: { phone } }),
  loginAdmin: (username, password) => request('/auth/admin-login', { method: 'POST', body: { username, password } }),

  // ---- ห้อง (ฝั่งลูกค้า) ----
  listRooms: (size) => request('/rooms', { params: { size } }),
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
