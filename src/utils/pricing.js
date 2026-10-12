/**
 * คำนวณราคาการจองฝั่ง frontend เพื่อ "พรีวิว" ให้ลูกค้าเห็นก่อนกดยืนยัน
 *
 * สูตรตรงกับ backend (src/utils/pricing.js): แบ่งเป็นช่วงละ 30 นาที ดูจากเวลาเริ่มของแต่ละช่วง
 *   ช่วงพีค = ราคาห้อง + ค่าบริการเพิ่ม / นอกนั้น = ราคาห้อง
 *
 * ⚠️ ราคาที่ตัดสินจริงคำนวณที่ backend เสมอ (กันลูกค้าแก้ราคาเอง) ค่านี้ใช้แสดงผลเท่านั้น
 */

/** "HH:MM" หรือ "HH:MM:SS" → นาทีนับจากเที่ยงคืน (ไม่มีค่า = null) */
function toMinutes(time) {
  if (!time) return null;
  const [h, m] = String(time).split(':').map(Number);
  return h * 60 + (m || 0);
}

/** ช่วงพีค [start, end) ในหน่วยนาที — ไม่มีเวลาเริ่ม = ไม่มีพีค / ไม่มีเวลาสิ้นสุด = ถึงร้านปิด */
function toRange(start, end) {
  const s = toMinutes(start);
  if (s === null) return null;
  return [s, toMinutes(end) ?? 24 * 60];
}

/**
 * พีคไทม์ของวันในสัปดาห์ dayOfWeek จากข้อมูลร้าน (GET /api/shop)
 * วันไหนตั้ง "กำหนดราคาเอง" (custom_rates) ใช้ค่าของวันนั้น ไม่งั้นใช้ค่าหลักของร้าน
 */
export function ratesForDay(shop, dayOfWeek) {
  const day = shop?.hours?.find((h) => Number(h.day_of_week) === dayOfWeek);
  const src = day?.custom_rates ? day : shop;
  return {
    peakStart: src?.peak_start_time || null,
    peakEnd: src?.peak_end_time || null,
    peakSurcharge: Number(src?.peak_surcharge || 0),
  };
}

/** ช่องเวลา "HH:MM" อยู่ในพีคไทม์ (และมีค่าบริการเพิ่ม) ไหม — ใช้แต่งสีช่องเวลาในหน้าจอง */
export function isPeakSlot(rates, time) {
  const minutes = toMinutes(time);
  const peak = toRange(rates?.peakStart, rates?.peakEnd);
  return Boolean(peak && rates.peakSurcharge > 0 && minutes >= peak[0] && minutes < peak[1]);
}

/**
 * @param {object} params
 * @param {number} params.pricePerHour  - ราคาต่อชั่วโมง (บาท)
 * @param {object} params.rates         - จาก ratesForDay()
 * @param {string} params.startDatetime - เวลาเริ่ม "YYYY-MM-DDTHH:MM:00"
 * @param {string} params.endDatetime   - เวลาสิ้นสุด "YYYY-MM-DDTHH:MM:00"
 * @returns {{ basePrice, peakSurchargeTotal, priceTotal }}
 */
export function calculateBookingPrice({ pricePerHour, rates, startDatetime, endDatetime }) {
  const start = new Date(startDatetime);
  const end = new Date(endDatetime);
  const totalMinutes = (end - start) / 60000;

  // ช่วงเวลาไม่ถูกต้อง (เช่น end <= start) → ราคา 0 ทั้งหมด
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return { basePrice: 0, peakSurchargeTotal: 0, priceTotal: 0 };
  }

  // นับจำนวนช่วง 30 นาทีที่อยู่ในพีค
  const peak = toRange(rates?.peakStart, rates?.peakEnd);
  let peakHalfSlots = 0;
  const cursor = new Date(start);
  for (let i = 0; i < totalMinutes / 30; i++) {
    const minutesOfDay = cursor.getHours() * 60 + cursor.getMinutes();
    if (peak && minutesOfDay >= peak[0] && minutesOfDay < peak[1]) peakHalfSlots++;
    cursor.setMinutes(cursor.getMinutes() + 30);
  }

  const basePrice = Math.round((pricePerHour * totalMinutes) / 60);
  const peakSurchargeTotal = Math.round(Number(rates?.peakSurcharge || 0) * 0.5 * peakHalfSlots);
  return { basePrice, peakSurchargeTotal, priceTotal: basePrice + peakSurchargeTotal };
}
