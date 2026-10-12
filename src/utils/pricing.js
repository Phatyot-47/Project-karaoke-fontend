/**
 * คำนวณราคาการจองฝั่ง frontend เพื่อ "พรีวิว" ให้ลูกค้าเห็นก่อนกดยืนยัน
 *
 * สูตรตรงกับ backend (src/utils/pricing.js): แบ่งเป็นช่วงละ 30 นาที ดูจากเวลาเริ่มของแต่ละช่วง
 *   ช่วงพีค = ราคาห้อง + ค่าบริการเพิ่ม / ช่วงออฟพีค = ราคาห้อง - ส่วนลด / นอกนั้น = ราคาห้อง
 *
 * ⚠️ ราคาที่ตัดสินจริงคำนวณที่ backend เสมอ (กันลูกค้าแก้ราคาเอง) ค่านี้ใช้แสดงผลเท่านั้น
 */

/** "HH:MM" หรือ "HH:MM:SS" → นาทีนับจากเที่ยงคืน (ไม่มีค่า = null) */
function toMinutes(time) {
  if (!time) return null;
  const [h, m] = String(time).split(':').map(Number);
  return h * 60 + (m || 0);
}

/** ช่วง [start, end) ในหน่วยนาที — ไม่มีเวลาเริ่ม = ไม่มีช่วงนี้ / ไม่มีเวลาสิ้นสุด = ถึงร้านปิด */
function toRange(start, end) {
  const s = toMinutes(start);
  if (s === null) return null;
  return [s, toMinutes(end) ?? 24 * 60];
}

/**
 * ราคาตามช่วงเวลา (พีค/ออฟพีค) ของวันในสัปดาห์ dayOfWeek จากข้อมูลร้าน (GET /api/shop)
 * วันไหนตั้ง "กำหนดราคาเอง" (custom_rates) ใช้ค่าของวันนั้น ไม่งั้นใช้ค่าหลักของร้าน
 */
export function ratesForDay(shop, dayOfWeek) {
  const day = shop?.hours?.find((h) => Number(h.day_of_week) === dayOfWeek);
  const src = day?.custom_rates ? day : shop;
  return {
    peakStart: src?.peak_start_time || null,
    peakEnd: src?.peak_end_time || null,
    peakSurcharge: Number(src?.peak_surcharge || 0),
    offPeakStart: src?.offpeak_start_time || null,
    offPeakEnd: src?.offpeak_end_time || null,
    offPeakDiscount: Number(src?.offpeak_discount || 0),
  };
}

/** ช่องเวลา "HH:MM" อยู่ช่วงไหน → 'peak' | 'offpeak' | null (ใช้แต่งสีช่องเวลาในหน้าจอง) */
export function slotRateKind(rates, time) {
  const minutes = toMinutes(time);
  const peak = toRange(rates?.peakStart, rates?.peakEnd);
  const off = toRange(rates?.offPeakStart, rates?.offPeakEnd);
  if (peak && rates.peakSurcharge > 0 && minutes >= peak[0] && minutes < peak[1]) return 'peak';
  if (off && rates.offPeakDiscount > 0 && minutes >= off[0] && minutes < off[1]) return 'offpeak';
  return null;
}

/**
 * @param {object} params
 * @param {number} params.pricePerHour  - ราคาต่อชั่วโมง (บาท)
 * @param {object} params.rates         - จาก ratesForDay()
 * @param {string} params.startDatetime - เวลาเริ่ม "YYYY-MM-DDTHH:MM:00"
 * @param {string} params.endDatetime   - เวลาสิ้นสุด "YYYY-MM-DDTHH:MM:00"
 * @returns {{ basePrice, peakSurchargeTotal, offPeakDiscountTotal, priceTotal }}
 */
export function calculateBookingPrice({ pricePerHour, rates, startDatetime, endDatetime }) {
  const start = new Date(startDatetime);
  const end = new Date(endDatetime);
  const totalMinutes = (end - start) / 60000;

  // ช่วงเวลาไม่ถูกต้อง (เช่น end <= start) → ราคา 0 ทั้งหมด
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return { basePrice: 0, peakSurchargeTotal: 0, offPeakDiscountTotal: 0, priceTotal: 0 };
  }

  const peak = toRange(rates?.peakStart, rates?.peakEnd);
  const offPeak = toRange(rates?.offPeakStart, rates?.offPeakEnd);
  const inRange = (range, minutes) => range && minutes >= range[0] && minutes < range[1];

  // นับจำนวนช่วง 30 นาทีที่อยู่ในพีค / ออฟพีค
  let peakHalfSlots = 0;
  let offPeakHalfSlots = 0;
  const cursor = new Date(start);
  for (let i = 0; i < totalMinutes / 30; i++) {
    const minutesOfDay = cursor.getHours() * 60 + cursor.getMinutes();
    if (inRange(peak, minutesOfDay)) peakHalfSlots++;
    else if (inRange(offPeak, minutesOfDay)) offPeakHalfSlots++;
    cursor.setMinutes(cursor.getMinutes() + 30);
  }

  // ส่วนลดไม่เกินราคาห้อง (กันราคาช่วงออฟพีคติดลบ)
  const discountPerHour = Math.min(Number(rates?.offPeakDiscount || 0), pricePerHour);
  const basePrice = Math.round((pricePerHour * totalMinutes) / 60);
  const peakSurchargeTotal = Math.round(Number(rates?.peakSurcharge || 0) * 0.5 * peakHalfSlots);
  const offPeakDiscountTotal = Math.round(discountPerHour * 0.5 * offPeakHalfSlots);
  const priceTotal = basePrice + peakSurchargeTotal - offPeakDiscountTotal;

  return { basePrice, peakSurchargeTotal, offPeakDiscountTotal, priceTotal };
}
