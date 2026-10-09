// ---- Utility functions สำหรับ format ข้อมูลและคำนวณเวลาในระบบ Karaoke ----
// ฟังก์ชันที่เกี่ยวกับเวลาไทย (Bangkok, UTC+7) ออกแบบให้ทำงานถูกต้องโดยไม่ขึ้นกับ timezone ของเครื่อง

/** เติม 0 นำหน้าตัวเลขให้มีอย่างน้อย 2 หลัก (เช่น 9 → "09") */
export function pad2(n) {
  return String(n).padStart(2, '0');
}

/** คืนวันที่ปัจจุบันในรูปแบบ "YYYY-MM-DD" ตามเวลาเครื่อง */
export function todayISODate() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// ชื่อเดือนภาษาไทย — index 0 = มกราคม
const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

// ชื่อเดือนภาษาไทยแบบย่อ — index 0 = ม.ค.
const THAI_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

/**
 * แปลงวันที่ ISO ("YYYY-MM-DD") เป็นรูปแบบไทย (เช่น "9 สิงหาคม 2569")
 * บวก 543 เพื่อแปลง ค.ศ. → พ.ศ.
 */
export function formatThaiDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${d} ${THAI_MONTHS[m - 1]} ${y + 543}`;
}

/** แปลง Date-like (ISO string / Date object) เป็น "HH:MM" */
export function formatTimeHM(dateLike) {
  const d = new Date(dateLike);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/**
 * สร้าง label ช่วงเวลาจาก ISO string สองตัว
 * เช่น "13:00 - 15:00 น. (2 ชม.)"
 */
export function formatDateTimeRange(startIso, endIso) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const hours = (end - start) / 3600000;
  return `${formatTimeHM(start)} - ${formatTimeHM(end)} น. (${hours} ชม.)`;
}

/** แปลงตัวเลขเป็นรูปแบบเงินไทย มีจุลภาค เช่น 1500 → "1,500" */
export function money(n) {
  return Number(n || 0).toLocaleString('th-TH');
}

/**
 * บวกจำนวนนาทีเข้ากับ time string "HH:MM" — wrap ข้ามเที่ยงคืนได้ (ภายในวันเดิม)
 * เช่น addMinutesToTime("23:30", 30) → "00:00"
 * ⚠️ ใช้ได้เฉพาะกรณีที่ end time ยังอยู่วันเดิม
 * ถ้าต้องการข้ามวัน ให้ใช้ addMinutesToDateTime() แทน
 */
export function addMinutesToTime(time, minutes) {
  const [h, m] = time.split(':').map(Number);
  let total = h * 60 + m + minutes;
  // modulo 1440 (นาทีใน 1 วัน) พร้อม normalize ค่าลบ
  total = ((total % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

/** แปลง time string "HH:MM" เป็นจำนวนนาทีนับจากเที่ยงคืน */
export function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * เวลาที่กดจอง (booking.created_at แบบ naive "YYYY-MM-DDTHH:MM:SS" เวลาไทย) สำหรับแสดง "จองเมื่อ ..."
 * จองวันนี้ → "14:20" / จองวันอื่น → "6 ต.ค. 14:20" (รายการค้างจากวันก่อนจะได้ไม่ดูเหมือนเพิ่งจอง)
 * แยกจากสตริงตรงๆ ไม่ผ่าน new Date() เพื่อไม่ให้ขึ้นกับ timezone ของเครื่อง
 */
export function formatBookedAt(createdAt) {
  if (typeof createdAt !== 'string' || createdAt.length < 16) return '-';
  const dateISO = createdAt.slice(0, 10);
  const time = createdAt.slice(11, 16);
  if (dateISO === bangkokNowParts().dateISO) return time;
  const [, m, d] = dateISO.split('-').map(Number);
  return `${d} ${THAI_MONTHS_SHORT[m - 1]} ${time}`;
}

// offset เวลาไทย (UTC+7) เป็น milliseconds — ใช้ shift Date เป็นเวลาไทย
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

// grace period (นาที) สำหรับล็อกเวลาจอง — ช่วงเวลาที่ "ผ่านไปแล้ว" แต่ยังจองได้อีก N นาที
const PAST_SLOT_GRACE_MINUTES = 15;

/**
 * แปลง epoch (ms) เป็นวันที่/นาทีของวัน "ตามเวลาไทย" โดยไม่พึ่ง timezone ที่ตั้งไว้ในเครื่อง
 *
 * วิธีการ: epoch เป็น UTC เสมอ → บวก 7 ชม. → อ่านด้วย getUTC*
 * ได้ตัวเลขเวลาไทยตรงๆ ไม่ว่าเครื่อง/เบราว์เซอร์จะตั้ง timezone อะไรไว้
 *
 * @returns {{ dateISO: string, minutesOfDay: number }}
 */
function bangkokParts(epochMs) {
  const d = new Date(epochMs + BANGKOK_OFFSET_MS);
  return {
    dateISO: `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`,
    minutesOfDay: d.getUTCHours() * 60 + d.getUTCMinutes(),
  };
}

function bangkokNowParts() {
  return bangkokParts(Date.now());
}

/**
 * ตรวจสอบว่าช่วงเวลา (date + time) ผ่านไปแล้วตามเวลาไทยหรือไม่
 *
 * graceMinutes: ปกติใช้ PAST_SLOT_GRACE_MINUTES (ล็อกเวลาจอง 30 นาที/ช่อง) แต่ isBookingAwaitingStart
 * ด้านล่างเรียก override เป็น 0 เพราะสถานะ booking ต้องการ boundary แบบตรงเป๊ะ ไม่มี grace
 */
export function isSlotPastBangkok(dateISO, time, graceMinutes = PAST_SLOT_GRACE_MINUTES) {
  const now = bangkokNowParts();
  if (dateISO < now.dateISO) return true; // วันที่ผ่านไปแล้ว
  if (dateISO > now.dateISO) return false; // วันในอนาคต
  // วันเดียวกัน → เปรียบเทียบนาทีของวัน (บวก grace)
  return timeToMinutes(time) + graceMinutes <= now.minutesOfDay;
}

/**
 * เพิ่มจำนวนนาทีให้ "YYYY-MM-DDTHH:MM:00" แล้วคืนสตริงรูปแบบเดิม
 *
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

/**
 * แยก description ของห้องเป็น array ของบรรทัด (trim + กรองบรรทัดว่าง)
 * ใช้แสดงเป็น Tag แต่ละอัน เช่น ["ห้องธีมอวกาศ", "มีคาราโอเกะจอ 4K"]
 */
export function roomNoteLines(description) {
  return (description || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/** การจองที่ยังมีผล (รอยืนยัน / ยืนยันแล้ว) = ยังกันช่วงเวลาของห้องไว้ — ยกเลิก/เสร็จ/ไม่มาใช้บริการ ไม่นับ */
export function isActiveBooking(booking) {
  return booking?.booking_status === 'pending' || booking?.booking_status === 'confirmed';
}

/** การจองของห้องนี้ ที่ยังมีผล และทับช่วงเวลา [start, end) (Date) หรือไม่ — ใช้หาห้องว่าง/ห้องไม่ว่าง */
export function overlapsRoomBooking(booking, roomId, start, end) {
  return (
    booking.room_id === roomId &&
    isActiveBooking(booking) &&
    new Date(booking.start_datetime) < end &&
    new Date(booking.end_datetime) > start
  );
}

// Map สถานะการจอง → label ภาษาไทย + tone สีของ Tag component
const BOOKING_STATUS_LABEL = {
  pending: { label: 'รอดำเนินการ', tone: 'warning' },
  confirmed: { label: 'กำลังดำเนินการ', tone: 'info' },
  completed: { label: 'เสร็จสมบูรณ์', tone: 'success' },
  cancelled: { label: 'ยกเลิกแล้ว', tone: 'danger' },
  no_show: { label: 'ไม่มาใช้บริการ', tone: 'danger' },
};

// สถานะย่อยของ booking ที่ confirmed แล้ว — ดูจากรอบใช้บริการจริง (service_session) แบบเดียวกับหน้าอนุมัติการจอง
const CHECKIN_STATUS_LABEL = {
  waiting: { label: 'รอ Check-in', tone: 'warning' },
  in_use: { label: 'กำลังใช้ห้อง', tone: 'info' },
};

const NAIVE_DATETIME_RE = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/;

/**
 * ตรวจสอบว่า booking ที่ confirmed แล้ว ยังไม่ถึงเวลาเริ่มใช้จริง (start_datetime) หรือเปล่า
 *
 * booking.start_datetime จาก API เป็นเวลาไทยแบบ naive "YYYY-MM-DDTHH:MM:SS" (ไม่มี Z/offset)
 * เพราะ backend ตั้ง type parser ให้คืนค่าดิบจากคอลัมน์ TIMESTAMP ตรงๆ (ดู backend src/db.js)
 * จึงแยกวันที่/เวลาจากสตริงแล้วเทียบกับเวลาไทยปัจจุบันเลย — ห้าม new Date(str) เพราะจะตีความ
 * ตาม timezone ของเครื่องผู้ใช้ (เดิมฟังก์ชันนี้รอสตริงที่ลงท้ายด้วย Z ซึ่ง API ไม่ได้ส่งแล้ว
 * จึงตอบ true เสมอ ทำให้ booking ที่ยืนยันแล้วค้างป้าย "รอดำเนินการ" ตลอด)
 */
function isBookingAwaitingStart(booking) {
  if (!booking || booking.booking_status !== 'confirmed') return false;
  const match = typeof booking.start_datetime === 'string' && booking.start_datetime.match(NAIVE_DATETIME_RE);
  if (!match) return true; // รูปแบบไม่ตรง → ถือว่ายังรออยู่ (safe fallback)
  return !isSlotPastBangkok(match[1], match[2], 0);
}

/**
 * คืน status display object ({ label, tone }) สำหรับแสดงใน Tag
 * booking ที่ confirmed: ถ้า API ส่งข้อมูลรอบใช้บริการมาด้วย (session_status) ใช้สถานะ Check-in จริง
 * ("รอ Check-in" / "กำลังใช้ห้อง") ไม่งั้นดูจากเวลา — ยังไม่ถึงเวลาเริ่มแสดง "รอดำเนินการ"
 */
export function getBookingDisplayStatus(booking) {
  if (booking?.booking_status === 'confirmed' && 'session_status' in booking) {
    return booking.session_status === 'in_progress' ? CHECKIN_STATUS_LABEL.in_use : CHECKIN_STATUS_LABEL.waiting;
  }
  if (isBookingAwaitingStart(booking)) return BOOKING_STATUS_LABEL.pending;
  return BOOKING_STATUS_LABEL[booking?.booking_status] || BOOKING_STATUS_LABEL.pending;
}

/**
 * ข้อความเงื่อนไขการยกเลิกจากนโยบายร้านปัจจุบัน (shop.policy จาก GET /api/shop)
 * เช่น "ยกเลิกได้ล่วงหน้าก่อนเวลาเริ่ม 1 ชั่วโมง — ยกเลิกเองหรือไม่มาใช้บริการ ร้านขอสงวนสิทธิ์ไม่คืนมัดจำ…"
 * (ข้อความสำรองใช้ตอนร้านยังไม่ได้ตั้งค่านโยบาย — ตรงกับนโยบายร้าน: ร้านยกเลิกเอง = คืนมัดจำนอกระบบ)
 */
export function cancellationNote(policy) {
  const hours = policy?.cancel_hours_before ?? 1;
  return `ยกเลิกได้ล่วงหน้าก่อนเวลาเริ่ม ${hours} ชั่วโมง — ${policy?.refund_policy_desc || 'ยกเลิกเองหรือไม่มาใช้บริการ ร้านขอสงวนสิทธิ์ไม่คืนมัดจำทุกกรณี หากร้านเป็นฝ่ายยกเลิก ร้านจะติดต่อคืนมัดจำให้'}`;
}

// ชื่อวันในสัปดาห์ภาษาไทย — index ตรงกับ Date.getDay() (0 = อาทิตย์)
export const DAY_LABELS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

/** หาเวลาเปิด-ปิดร้านของ "วันนี้" จาก shop.hours (ไม่เจอวันนี้ใช้แถวแรก, ไม่มีข้อมูลเลยคืน null) */
export function findTodayHours(hours) {
  if (!hours?.length) return null;
  const dow = new Date().getDay();
  return hours.find((h) => Number(h.day_of_week) === dow) || hours[0];
}

/** สร้างรายการช่วงเวลาทุก 30 นาทีระหว่างชั่วโมงเปิด-ปิด เช่น (18, 20) → ["18:00","18:30","19:00","19:30"] */
export function buildHalfHourSlots(openHour, closeHour) {
  const times = [];
  for (let h = openHour; h < closeHour; h++) {
    times.push(`${pad2(h)}:00`, `${pad2(h)}:30`);
  }
  return times;
}
