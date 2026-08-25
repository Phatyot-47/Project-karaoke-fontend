export function pad2(n) {
  return String(n).padStart(2, '0');
}

export function todayISODate() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

export function formatThaiDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${d} ${THAI_MONTHS[m - 1]} ${y + 543}`;
}

export function formatTimeHM(dateLike) {
  const d = new Date(dateLike);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function formatDateTimeRange(startIso, endIso) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const hours = (end - start) / 3600000;
  return `${formatTimeHM(start)} - ${formatTimeHM(end)} น. (${hours} ชม.)`;
}

export function money(n) {
  return Number(n || 0).toLocaleString('th-TH');
}

export function addMinutesToTime(time, minutes) {
  const [h, m] = time.split(':').map(Number);
  let total = h * 60 + m + minutes;
  total = ((total % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

export function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;
export const PAST_SLOT_GRACE_MINUTES = 15;

// เวลา "ปัจจุบันตามเวลาไทย" แบบไม่พึ่ง timezone ที่ตั้งไว้ในเครื่อง — อ่านผ่าน getUTC*
// เท่านั้น (Date.now() เป็น UTC epoch เสมอ บวก 7 ชม. คงที่ แล้วอ่านค่ากลับด้วย getUTC*
// จะได้ตัวเลขเวลาไทยตรงๆ ไม่ว่าเครื่อง/เบราว์เซอร์จะตั้ง timezone อะไรไว้)
function bangkokNowParts() {
  const d = new Date(Date.now() + BANGKOK_OFFSET_MS);
  return {
    dateISO: `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`,
    minutesOfDay: d.getUTCHours() * 60 + d.getUTCMinutes(),
  };
}

// graceMinutes: ปกติใช้ PAST_SLOT_GRACE_MINUTES (ล็อกเวลาจอง 30 นาที/ช่อง) แต่ isBookingAwaitingStart
// ด้านล่างเรียก override เป็น 0 เพราะสถานะ booking ต้องการ boundary แบบตรงเป๊ะ ไม่มี grace
export function isSlotPastBangkok(dateISO, time, graceMinutes = PAST_SLOT_GRACE_MINUTES) {
  const now = bangkokNowParts();
  if (dateISO < now.dateISO) return true;
  if (dateISO > now.dateISO) return false;
  return timeToMinutes(time) + graceMinutes <= now.minutesOfDay;
}

/**
 * เพิ่มจำนวนนาทีให้ "YYYY-MM-DDTHH:MM:00" แล้วคืนสตริงรูปแบบเดิม
 * ต่างจาก addMinutesToTime ตรงที่ข้ามวันได้ถูกต้อง (เช่น ร้านเปิดถึงเที่ยงคืน
 * เลือกช่วงเวลาสุดท้ายของวัน 23:30 แล้วบวก 30 นาที ต้องได้ 00:00 ของ "วันถัดไป"
 * ไม่ใช่ 00:00 ของวันเดิม ซึ่งจะทำให้ end_datetime ย้อนไปก่อน start_datetime)
 */
export function addMinutesToDateTime(dateTimeStr, minutes) {
  const d = new Date(dateTimeStr);
  d.setMinutes(d.getMinutes() + minutes);
  const y = d.getFullYear();
  const mo = pad2(d.getMonth() + 1);
  const da = pad2(d.getDate());
  const h = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  return `${y}-${mo}-${da}T${h}:${mi}:00`;
}

export function roomNoteLines(description) {
  return (description || '').split('\n').map((line) => line.trim()).filter(Boolean);
}

export const BOOKING_STATUS_LABEL = {
  pending: { label: 'รอดำเนินการ', tone: 'warning' },
  confirmed: { label: 'กำลังดำเนินการ', tone: 'info' },
  completed: { label: 'เสร็จสมบูรณ์', tone: 'success' },
  cancelled: { label: 'ยกเลิกแล้ว', tone: 'danger' },
  no_show: { label: 'ไม่มาใช้บริการ', tone: 'danger' },
};

// booking ที่แอดมิน confirm แล้วแต่ยังไม่ถึงเวลาเริ่มใช้จริง (start_datetime) ตามเวลาไทย
// ให้ยังถือว่า "รอดำเนินการ" อยู่ — ไม่มี grace period (ถึงเวลาคือถึงเลย) ต่างจาก
// isSlotPastBangkok ที่ใช้ล็อกเวลาจองซึ่งมี grace 15 นาที จึงเรียกแบบ override เป็น 0
//
// สำคัญ: booking.start_datetime ที่ได้จาก API เป็น UTC ISO string จริง (ผ่าน DB -> pg ->
// JSON.stringify มาแล้ว) ไม่ใช่สตริง Bangkok wall-clock แบบ naive เหมือนตอนสร้าง booking
// (ยืนยันจริงจาก DB: "2026-08-09 23:30:00" กลายเป็น "2026-08-09T16:30:00.000Z" ใน API) —
// ต้อง parse เป็น Date แล้วแปลงเป็นเวลาไทยด้วยเทคนิคเดียวกับ bangkokNowParts() เท่านั้น
// ห้าม split('T') ตรงๆ เหมือนสตริงที่แอปสร้างเอง เพราะจะผิดตามจำนวนชั่วโมง offset ของเซิร์ฟเวอร์
//
// ก่อน Date.parse ต้องเช็คก่อนว่ามี Z/offset ต่อท้ายจริง (ไม่งั้น Date.parse จะตีความเป็น
// เวลาเครื่อง/เซิร์ฟเวอร์ ซึ่งย้อนกลับไปเป็นบั๊กแบบเดียวกับที่เพิ่งแก้ไป แค่มาจากรูปแบบอื่น)
const UTC_INSTANT_RE = /(?:Z|[+-]\d{2}:?\d{2})$/;
export function isBookingAwaitingStart(booking) {
  if (!booking || booking.booking_status !== 'confirmed') return false;
  const startDatetime = booking.start_datetime;
  if (typeof startDatetime !== 'string' || !UTC_INSTANT_RE.test(startDatetime)) return true;
  const startMs = Date.parse(startDatetime);
  if (Number.isNaN(startMs)) return true;
  const d = new Date(startMs + BANGKOK_OFFSET_MS);
  const dateISO = `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
  const time = `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
  return !isSlotPastBangkok(dateISO, time, 0);
}

export function getBookingDisplayStatus(booking) {
  if (isBookingAwaitingStart(booking)) return BOOKING_STATUS_LABEL.pending;
  return BOOKING_STATUS_LABEL[booking?.booking_status] || BOOKING_STATUS_LABEL.pending;
}

export const DAY_LABELS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
