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
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
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

// offset เวลาไทย (UTC+7) เป็น milliseconds — ใช้ shift Date เป็นเวลาไทย
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

// grace period (นาที) สำหรับล็อกเวลาจอง — ช่วงเวลาที่ "ผ่านไปแล้ว" แต่ยังจองได้อีก N นาที
export const PAST_SLOT_GRACE_MINUTES = 15;

/**
 * คืนเวลา "ปัจจุบันตามเวลาไทย" โดยไม่พึ่ง timezone ที่ตั้งไว้ในเครื่อง
 *
 * วิธีการ: Date.now() เป็น UTC epoch เสมอ → บวก 7 ชม. → อ่านด้วย getUTC*
 * ได้ตัวเลขเวลาไทยตรงๆ ไม่ว่าเครื่อง/เบราว์เซอร์จะตั้ง timezone อะไรไว้
 *
 * @returns {{ dateISO: string, minutesOfDay: number }}
 */
function bangkokNowParts() {
  const d = new Date(Date.now() + BANGKOK_OFFSET_MS);
  return {
    dateISO: `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`,
    minutesOfDay: d.getUTCHours() * 60 + d.getUTCMinutes(),
  };
}

/**
 * ตรวจสอบว่าช่วงเวลา (date + time) ผ่านไปแล้วตามเวลาไทยหรือไม่
 *
 * graceMinutes: ปกติใช้ PAST_SLOT_GRACE_MINUTES (ล็อกเวลาจอง 30 นาที/ช่อง) แต่ isBookingAwaitingStart
 * ด้านล่างเรียก override เป็น 0 เพราะสถานะ booking ต้องการ boundary แบบตรงเป๊ะ ไม่มี grace
 */
export function isSlotPastBangkok(dateISO, time, graceMinutes = PAST_SLOT_GRACE_MINUTES) {
  const now = bangkokNowParts();
  if (dateISO < now.dateISO) return true;  // วันที่ผ่านไปแล้ว
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
  return (description || '').split('\n').map((line) => line.trim()).filter(Boolean);
}

// Map สถานะการจอง → label ภาษาไทย + tone สีของ Tag component
export const BOOKING_STATUS_LABEL = {
  pending:   { label: 'รอดำเนินการ',      tone: 'warning' },
  confirmed: { label: 'กำลังดำเนินการ',   tone: 'info'    },
  completed: { label: 'เสร็จสมบูรณ์',     tone: 'success' },
  cancelled: { label: 'ยกเลิกแล้ว',       tone: 'danger'  },
  no_show:   { label: 'ไม่มาใช้บริการ',   tone: 'danger'  },
};

/**
 * ตรวจสอบว่า booking ที่ confirmed แล้ว แต่ยังไม่ถึงเวลาเริ่มใช้จริง (start_datetime) หรือเปล่า
 * ถ้าใช่ → ให้ถือว่า "รอดำเนินการ" ยังอยู่ ไม่ใช่ "กำลังดำเนินการ"
 *
 * ⚠️ หมายเหตุสำคัญเรื่อง timezone:
 * booking.start_datetime จาก API เป็น UTC ISO string จริง (ผ่าน DB → pg → JSON.stringify)
 * ไม่ใช่สตริง Bangkok wall-clock แบบ naive เหมือนตอนสร้าง booking
 * (ยืนยันจริงจาก DB: "2026-08-09 23:30:00" → "2026-08-09T16:30:00.000Z" ใน API)
 * ต้อง parse เป็น Date แล้วแปลงเป็นเวลาไทยด้วยเทคนิคเดียวกับ bangkokNowParts() เท่านั้น
 * ห้าม split('T') ตรงๆ เหมือนสตริงที่แอปสร้างเอง เพราะจะผิดตามจำนวนชั่วโมง offset ของเซิร์ฟเวอร์
 *
 * ก่อน Date.parse ต้องเช็คก่อนว่ามี Z/offset ต่อท้ายจริง ไม่งั้น Date.parse จะตีความเป็น
 * เวลาเครื่อง/เซิร์ฟเวอร์ ซึ่งย้อนกลับไปเป็น bug แบบเดียวกับที่เพิ่งแก้ไป แค่มาจากรูปแบบอื่น
 */
const UTC_INSTANT_RE = /(?:Z|[+-]\d{2}:?\d{2})$/;

export function isBookingAwaitingStart(booking) {
  if (!booking || booking.booking_status !== 'confirmed') return false;

  const startDatetime = booking.start_datetime;

  // ถ้าสตริงไม่มี timezone marker → ไม่สามารถ parse เป็น UTC ได้อย่างถูกต้อง → ถือว่ายังรออยู่
  if (typeof startDatetime !== 'string' || !UTC_INSTANT_RE.test(startDatetime)) return true;

  const startMs = Date.parse(startDatetime);
  if (Number.isNaN(startMs)) return true; // parse ไม่สำเร็จ → safe fallback

  // แปลง UTC → Bangkok time แล้วเปรียบเทียบกับเวลาปัจจุบัน (graceMinutes = 0 เพราะต้องการ exact boundary)
  const d = new Date(startMs + BANGKOK_OFFSET_MS);
  const dateISO = `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
  const time = `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
  return !isSlotPastBangkok(dateISO, time, 0);
}

/**
 * คืน status display object ({ label, tone }) สำหรับแสดงใน Tag
 * ถ้า booking confirmed แต่ยังไม่ถึงเวลา → แสดงเป็น "รอดำเนินการ" (ไม่ใช่ "กำลังดำเนินการ")
 */
export function getBookingDisplayStatus(booking) {
  if (isBookingAwaitingStart(booking)) return BOOKING_STATUS_LABEL.pending;
  return BOOKING_STATUS_LABEL[booking?.booking_status] || BOOKING_STATUS_LABEL.pending;
}

// ชื่อวันในสัปดาห์ภาษาไทย — index ตรงกับ Date.getDay() (0 = อาทิตย์)
export const DAY_LABELS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
