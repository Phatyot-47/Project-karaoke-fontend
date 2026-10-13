// ฟังก์ชันช่วยจัดรูปแบบข้อความ (วันที่ไทย, เวลา, เงิน, เบอร์โทร) และคิดเรื่องเวลา ที่หลายหน้าใช้ร่วมกัน
// ฟังก์ชันที่มีคำว่า Bangkok ใช้ "เวลาไทย" เสมอ ไม่ว่าเครื่องผู้ใช้จะตั้งเวลาเป็นประเทศไหน

/** เติม 0 นำหน้าตัวเลขให้มีอย่างน้อย 2 หลัก (เช่น 9 → "09") */
export function pad2(n) {
  return String(n).padStart(2, '0');
}

/** วันที่วันนี้ "YYYY-MM-DD" ตามเวลาไทย (ตรงกับ backend แม้เครื่องผู้ใช้ตั้งเขตเวลาอื่น) */
export function todayISODate() {
  return bangkokNowParts().dateISO;
}

// ชื่อเดือนภาษาไทย — ช่องที่ 0 = มกราคม
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

// ชื่อเดือนภาษาไทยแบบย่อ — ช่องที่ 0 = ม.ค.
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
 * "2026-08-09" → "9 สิงหาคม 2569" (บวก 543 เพื่อเปลี่ยน ค.ศ. เป็น พ.ศ.)
 */
export function formatThaiDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${d} ${THAI_MONTHS[m - 1]} ${y + 543}`;
}

/** วันเวลา → "HH:MM" เช่น "2026-10-12T20:00:00" → "20:00" */
export function formatTimeHM(dateLike) {
  const d = new Date(dateLike);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/**
 * เวลาเริ่ม + เวลาจบ → ข้อความ เช่น "13:00 - 15:00 น. (2 ชม.)"
 */
export function formatDateTimeRange(startIso, endIso) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const hours = (end - start) / 3600000;
  return `${formatTimeHM(start)} - ${formatTimeHM(end)} น. (${hours} ชม.)`;
}

/** เบอร์โทรตัวเลขล้วน → มีขีดอ่านง่าย: 10 หลัก "081-234-5678" / 9 หลัก "02-123-4567" (รูปแบบอื่นคืนค่าเดิม) */
export function formatPhone(phone) {
  const digits = String(phone || '');
  if (/^\d{10}$/.test(digits)) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (/^\d{9}$/.test(digits)) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  return digits;
}

/** แปลงตัวเลขเป็นรูปแบบเงินไทย มีจุลภาค เช่น 1500 → "1,500" */
export function money(n) {
  return Number(n || 0).toLocaleString('th-TH');
}

/**
 * "HH:MM" + จำนวนนาที เช่น ("19:00", 30) → "19:30" / ("23:30", 30) → "00:00"
 * ⚠️ ได้แค่เวลา ไม่รู้ว่าข้ามไปวันใหม่แล้ว — ถ้าต้องการวันที่ด้วยให้ใช้ addMinutesToDateTime()
 */
export function addMinutesToTime(time, minutes) {
  const [h, m] = time.split(':').map(Number);
  let total = h * 60 + m + minutes;
  // 1 วันมี 1440 นาที — เกินแล้ววนกลับไปเริ่ม 00:00 ใหม่
  total = ((total % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

/** "HH:MM" → จำนวนนาทีนับจากเที่ยงคืน เช่น "01:30" → 90 */
export function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * ข้อความ "จองเมื่อ ..." จากเวลาที่กดจอง (created_at เป็นเวลาไทย เช่น "2026-10-06T14:20:00")
 * จองวันนี้ → "14:20" / จองวันอื่น → "6 ต.ค. 14:20" (รายการค้างจากวันก่อนจะได้ไม่ดูเหมือนเพิ่งจอง)
 * ตัดข้อความเอาเอง ไม่ใช้ new Date() เพราะ new Date() จะเพี้ยนตามเวลาของเครื่องผู้ใช้
 */
export function formatBookedAt(createdAt) {
  if (typeof createdAt !== 'string' || createdAt.length < 16) return '-';
  const dateISO = createdAt.slice(0, 10);
  const time = createdAt.slice(11, 16);
  if (dateISO === bangkokNowParts().dateISO) return time;
  const [, m, d] = dateISO.split('-').map(Number);
  return `${d} ${THAI_MONTHS_SHORT[m - 1]} ${time}`;
}

// เวลาไทยเร็วกว่าเวลามาตรฐานโลก (UTC) 7 ชั่วโมง (หน่วยมิลลิวินาที)
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

// เลยเวลาเริ่มของช่องไปไม่เกิน 15 นาที ยังจองช่องนั้นได้ (ต้องตรงกับ backend utils/time.js)
const PAST_SLOT_GRACE_MINUTES = 15;

/**
 * เวลา (ตัวเลขมิลลิวินาที) → วันที่และนาทีของวัน "ตามเวลาไทย"
 * วิธีคิด: เวลามาตรฐานโลก (UTC) + 7 ชั่วโมง = เวลาไทย (ได้ถูกเสมอ ไม่ว่าเครื่องตั้งเวลาประเทศไหน)
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

/** วันที่ "YYYY-MM-DD" ตามเวลาไทย ย้อนหลัง count วัน (วันนี้ก่อน) เช่น count = 7 → [วันนี้, เมื่อวาน, ...] */
export function recentBangkokDates(count) {
  return Array.from({ length: count }, (_, i) => bangkokParts(Date.now() - i * 24 * 60 * 60 * 1000).dateISO);
}

/**
 * วันที่ + เวลานี้ "ผ่านไปแล้ว" ตามเวลาไทยหรือยัง (ใช้ทำช่องเวลาที่ผ่านไปแล้วเป็นสีเทา)
 * graceMinutes = ผ่อนให้กี่นาที (ค่าเริ่มต้น 15) — ตอนเช็คสถานะการจองส่ง 0 มา เพราะต้องการเวลาตรงเป๊ะ
 */
export function isSlotPastBangkok(dateISO, time, graceMinutes = PAST_SLOT_GRACE_MINUTES) {
  const now = bangkokNowParts();
  if (dateISO < now.dateISO) return true; // วันที่ผ่านไปแล้ว
  if (dateISO > now.dateISO) return false; // วันในอนาคต
  // วันเดียวกัน → เทียบนาที (บวกเวลาที่ผ่อนให้)
  return timeToMinutes(time) + graceMinutes <= now.minutesOfDay;
}

/**
 * "YYYY-MM-DDTHH:MM:00" + จำนวนนาที → รูปแบบเดิม (ข้ามไปวันใหม่ได้ถูกต้อง)
 * เช่น "2026-10-12T23:30:00" + 30 → "2026-10-13T00:00:00" (ถ้าได้ 00:00 ของวันเดิม เวลาจบจะอยู่ก่อนเวลาเริ่ม)
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
 * หมายเหตุห้อง (หลายบรรทัด) → รายการทีละบรรทัด ตัดบรรทัดว่างทิ้ง
 * เอาไปโชว์เป็นป้ายทีละอัน เช่น ["ห้องธีมอวกาศ", "มีคาราโอเกะจอ 4K"]
 */
export function roomNoteLines(description) {
  return (description || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/** การจองที่ยัง "ใช้งานอยู่" (รอยืนยัน / ยืนยันแล้ว) = ยังกันเวลาของห้องไว้ — ยกเลิก/เสร็จ/ไม่มาใช้บริการ ไม่นับ */
export function isActiveBooking(booking) {
  return booking?.booking_status === 'pending' || booking?.booking_status === 'confirmed';
}

/** การจองนี้เป็นของห้องนี้ ยังใช้งานอยู่ และเวลาทับกับช่วง start-end ไหม — ใช้หาว่าห้องว่างหรือไม่ */
export function overlapsRoomBooking(booking, roomId, start, end) {
  return (
    booking.room_id === roomId &&
    isActiveBooking(booking) &&
    new Date(booking.start_datetime) < end &&
    new Date(booking.end_datetime) > start
  );
}

// สถานะการจอง → ข้อความไทย + สีป้าย (Tag)
const BOOKING_STATUS_LABEL = {
  pending: { label: 'รอดำเนินการ', tone: 'warning' },
  confirmed: { label: 'กำลังดำเนินการ', tone: 'info' },
  completed: { label: 'เสร็จสมบูรณ์', tone: 'success' },
  cancelled: { label: 'ยกเลิกแล้ว', tone: 'danger' },
  no_show: { label: 'ไม่มาใช้บริการ', tone: 'danger' },
};

// การจองที่ยืนยันแล้ว แยกต่อว่า ลูกค้ามาถึงร้านหรือยัง (ดูจากข้อมูล Check-in)
const CHECKIN_STATUS_LABEL = {
  waiting: { label: 'รอ Check-in', tone: 'warning' },
  in_use: { label: 'กำลังใช้ห้อง', tone: 'info' },
};

const NAIVE_DATETIME_RE = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/;

/**
 * การจองที่ยืนยันแล้ว "ยังไม่ถึงเวลาเริ่ม" ใช่ไหม
 * เวลาเริ่มจาก backend เป็นเวลาไทย เช่น "2026-10-12T20:00:00" → ตัดวันที่/เวลาออกมาเทียบกับเวลาไทยตอนนี้
 * (ไม่ใช้ new Date() เพราะจะเพี้ยนตามเวลาของเครื่องผู้ใช้)
 */
function isBookingAwaitingStart(booking) {
  if (!booking || booking.booking_status !== 'confirmed') return false;
  const match = typeof booking.start_datetime === 'string' && booking.start_datetime.match(NAIVE_DATETIME_RE);
  if (!match) return true; // รูปแบบแปลกๆ → ถือว่ายังรออยู่ไว้ก่อน
  return !isSlotPastBangkok(match[1], match[2], 0);
}

/**
 * ป้ายสถานะที่จะโชว์ของการจอง → { label: ข้อความ, tone: สี }
 * ถ้ายืนยันแล้วและมีข้อมูล Check-in มาด้วย → "รอ Check-in" หรือ "กำลังใช้ห้อง"
 * ถ้าไม่มี → ดูจากเวลา (ยังไม่ถึงเวลาเริ่ม = "รอดำเนินการ")
 */
export function getBookingDisplayStatus(booking) {
  if (booking?.booking_status === 'confirmed' && 'session_status' in booking) {
    return booking.session_status === 'in_progress' ? CHECKIN_STATUS_LABEL.in_use : CHECKIN_STATUS_LABEL.waiting;
  }
  if (isBookingAwaitingStart(booking)) return BOOKING_STATUS_LABEL.pending;
  return BOOKING_STATUS_LABEL[booking?.booking_status] || BOOKING_STATUS_LABEL.pending;
}

/**
 * ข้อความเงื่อนไขการยกเลิก จากนโยบายของร้าน
 * เช่น "ยกเลิกได้ก่อนเวลาเริ่ม 1.5 ชั่วโมง — ยกเลิกเองหรือไม่มาใช้บริการ ร้านขอสงวนสิทธิ์ไม่คืนมัดจำ…"
 * (ถ้าร้านยังไม่ได้เขียนนโยบายคืนเงิน ใช้ข้อความสำรองที่ตรงกับนโยบายร้าน)
 */
export function cancellationNote(policy) {
  const hours = Number(policy?.cancel_hours_before ?? 1); // backend ส่งมาเป็นข้อความ เช่น "1.5" → แปลงเป็นตัวเลข
  return `ยกเลิกได้ก่อนเวลาเริ่ม ${hours} ชั่วโมง — ${policy?.refund_policy_desc || 'ยกเลิกเองหรือไม่มาใช้บริการ ร้านขอสงวนสิทธิ์ไม่คืนมัดจำทุกกรณี หากร้านเป็นฝ่ายยกเลิก ร้านจะติดต่อคืนมัดจำให้'}`;
}

// ชื่อวันภาษาไทย — ช่องที่ 0 = อาทิตย์ ... 6 = เสาร์ (ตรงกับ new Date().getDay())
export const DAY_LABELS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

/** เวลาเปิด-ปิดร้านของ "วันนี้" ตามเวลาไทย (ไม่เจอวันนี้ใช้วันแรกแทน / ไม่มีข้อมูลเลยได้ null) */
export function findTodayHours(hours) {
  if (!hours?.length) return null;
  const [y, m, d] = todayISODate().split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return hours.find((h) => Number(h.day_of_week) === dow) || hours[0];
}

/** ช่องเวลาทุก 30 นาทีตั้งแต่ร้านเปิดถึงร้านปิด เช่น (18, 20) → ["18:00","18:30","19:00","19:30"] */
export function buildHalfHourSlots(openHour, closeHour) {
  const times = [];
  for (let h = openHour; h < closeHour; h++) {
    times.push(`${pad2(h)}:00`, `${pad2(h)}:30`);
  }
  return times;
}
