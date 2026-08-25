const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

async function request(path, { method = 'GET', body, params } = {}) {
  let url = `${BASE_URL}${path}`;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    if (qs) url += `?${qs}`;
  }
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* ไม่มี body หรือไม่ใช่ JSON */
  }
  if (!res.ok) {
    const message = (data && data.error) || `เกิดข้อผิดพลาด (HTTP ${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// อัปโหลดไฟล์จริง (สลิปโอนเงิน / รูปห้อง) — multipart, ไม่ผ่าน request() เพราะต้องไม่ตั้ง Content-Type เอง
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

export const api = {
  // ---- uploads ----
  uploadFile,

  // ---- auth ----
  registerCustomer: (name, phone) => request('/auth/register', { method: 'POST', body: { name, phone } }),
  loginCustomer: (phone) => request('/auth/login', { method: 'POST', body: { phone } }),
  loginAdmin: (username, password) => request('/auth/admin-login', { method: 'POST', body: { username, password } }),

  // ---- rooms ----
  listRooms: (size) => request('/rooms', { params: { size } }),
  getRoom: (id) => request(`/rooms/${id}`),
  getRoomAvailability: (id, date) => request(`/rooms/${id}/availability`, { params: { date } }),

  // ---- bookings (customer) ----
  createBooking: (payload) => request('/bookings', { method: 'POST', body: payload }),
  listCustomerBookings: (customerId) => request(`/bookings/customer/${customerId}`),
  cancelBooking: (id, reason) => request(`/bookings/${id}/cancel`, { method: 'PATCH', body: { reason } }),

  // ---- payments ----
  createPayment: (payload) => request('/payments', { method: 'POST', body: payload }),

  // ---- admin ----
  getTodayBookings: () => request('/admin/bookings/today'),
  confirmBooking: (id) => request(`/admin/bookings/${id}/confirm`, { method: 'PATCH' }),
  rejectBooking: (id, reason) => request(`/admin/bookings/${id}/reject`, { method: 'PATCH', body: { reason } }),
  createWalkInBooking: (payload) => request('/admin/bookings/walkin', { method: 'POST', body: payload }),
  getBookingHistory: () => request('/admin/bookings/history'),
  verifyPayment: (paymentId, approve, adminUserId) =>
    request(`/admin/payments/${paymentId}/verify`, { method: 'PATCH', body: { approve, adminUserId } }),
  getShop: () => request('/admin/shop'),
  updateShop: (payload) => request('/admin/shop', { method: 'PATCH', body: payload }),
  updateShopHours: (hours) => request('/admin/shop/hours', { method: 'PATCH', body: { hours } }),
  listAdminRooms: () => request('/admin/rooms'),
  createAdminRoom: (payload) => request('/admin/rooms', { method: 'POST', body: payload }),
  updateAdminRoom: (id, payload) => request(`/admin/rooms/${id}`, { method: 'PATCH', body: payload }),
  deleteAdminRoom: (id) => request(`/admin/rooms/${id}`, { method: 'DELETE' }),
  getReports: (period) => request('/admin/reports', { params: { period } }),
};

export default api;
