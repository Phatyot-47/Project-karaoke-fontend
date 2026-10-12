/**
 * คิดราคาในหน้าเว็บ เพื่อ "โชว์ราคาโดยประมาณ" ให้ลูกค้าเห็นก่อนกดยืนยัน
 *
 * สูตรเหมือนฝั่ง backend (src/utils/pricing.js) ทุกอย่าง: แบ่งเวลาเป็นช่องละ 30 นาที
 *   ช่องที่อยู่ในพีคไทม์ = ราคาห้อง + ค่าบริการเพิ่ม / ช่องอื่น = ราคาห้องปกติ
 *
 * ⚠️ ราคาจริงที่บันทึก backend คิดเองเสมอ (กันลูกค้าแก้ราคาในหน้าเว็บ) ตัวเลขตรงนี้ใช้แสดงผลเท่านั้น
 */

/** "HH:MM" หรือ "HH:MM:SS" → จำนวนนาทีนับจากเที่ยงคืน เช่น "19:30" → 1170 (ไม่มีค่า = null) */
function toMinutes(time) {
  if (!time) return null;
  const [h, m] = String(time).split(':').map(Number);
  return h * 60 + (m || 0);
}

/** ช่วงพีคเป็นนาที [เริ่ม, สิ้นสุด) — ไม่มีเวลาเริ่ม = ไม่มีพีค / ไม่มีเวลาสิ้นสุด = ถึงร้านปิด */
function toRange(start, end) {
  const s = toMinutes(start);
  if (s === null) return null;
  return [s, toMinutes(end) ?? 24 * 60];
}

/**
 * พีคไทม์ของวันนั้น (dayOfWeek: 0 = อาทิตย์ ... 6 = เสาร์) จากข้อมูลร้าน (GET /api/shop)
 * วันไหนแอดมินติ๊ก "กำหนดราคาเอง" ใช้ค่าของวันนั้น ไม่งั้นใช้ค่าหลักของร้าน
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
 * คิดราคาการจอง
 * @param {object} params
 * @param {number} params.pricePerHour  - ราคาห้องต่อชั่วโมง (บาท)
 * @param {object} params.rates         - พีคไทม์ของวันนั้น (ได้จาก ratesForDay())
 * @param {string} params.startDatetime - เวลาเริ่ม "YYYY-MM-DDTHH:MM:00"
 * @param {string} params.endDatetime   - เวลาสิ้นสุด "YYYY-MM-DDTHH:MM:00"
 * @returns {{ basePrice, peakSurchargeTotal, priceTotal }}  ราคาปกติ, ค่าพีครวม, ราคารวม
 */
export function calculateBookingPrice({ pricePerHour, rates, startDatetime, endDatetime }) {
  const start = new Date(startDatetime);
  const end = new Date(endDatetime);
  const totalMinutes = (end - start) / 60000;

  // เวลาไม่ถูกต้อง (เช่น เวลาจบก่อนเวลาเริ่ม) → ราคา 0
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return { basePrice: 0, peakSurchargeTotal: 0, priceTotal: 0 };
  }

  // นับว่ามีกี่ช่อง (ช่องละ 30 นาที) ที่อยู่ในพีคไทม์
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
