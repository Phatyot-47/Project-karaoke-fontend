/**
 * คำนวณราคาการจองฝั่ง frontend เพื่อ "พรีวิว" ให้ลูกค้าเห็นก่อนกดยืนยัน
 *
 * สูตรตรงกับ backend (src/utils/pricing.js) และดีไซน์ต้นฉบับ:
 * แบ่งเป็นช่วงละ 30 นาที ช่วงไหนเริ่มหลัง (หรือเท่ากับ) peakStartTime ถือเป็นพีคไทม์
 *
 * ⚠️ ราคาที่ตัดสินจริงคำนวณที่ backend เสมอ (กันลูกค้าแก้ราคาเอง)
 * ค่านี้ใช้แสดงผลเท่านั้น ไม่มีผลต่อการชำระเงิน
 *
 * @param {object} params
 * @param {number} params.pricePerHour     - ราคาต่อชั่วโมง (บาท)
 * @param {string} params.peakStartTime    - เวลาเริ่มพีคไทม์ รูปแบบ "HH:MM" เช่น "18:00"
 * @param {number} params.peakSurcharge    - ค่าบริการเพิ่มพีคไทม์ (บาท/ชม.)
 * @param {string} params.startDatetime    - เวลาเริ่ม "YYYY-MM-DDTHH:MM:00"
 * @param {string} params.endDatetime      - เวลาสิ้นสุด "YYYY-MM-DDTHH:MM:00"
 * @returns {{ basePrice: number, peakSurchargeTotal: number, priceTotal: number }}
 */
export function calculateBookingPrice({ pricePerHour, peakStartTime, peakSurcharge, startDatetime, endDatetime }) {
  const start = new Date(startDatetime);
  const end = new Date(endDatetime);
  const totalMinutes = (end - start) / 60000;

  // กรณีช่วงเวลาไม่ valid (เช่น end <= start) → คืนราคา 0 ทั้งหมด
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return { basePrice: 0, peakSurchargeTotal: 0, priceTotal: 0 };
  }

  const totalHalfSlots = totalMinutes / 30; // จำนวนช่วง 30 นาที
  const totalHours = totalMinutes / 60;     // จำนวนชั่วโมงรวม (สำหรับคำนวณ basePrice)

  // แปลง peakStartTime เป็นนาทีนับจากเที่ยงคืน — "24:00" = ไม่มีพีคไทม์เลย
  const [peakH, peakM] = (peakStartTime || '24:00').split(':').map(Number);
  const peakStartMinutesOfDay = peakH * 60 + (peakM || 0);

  // นับจำนวนช่วง 30 นาที ที่อยู่ในพีคไทม์
  // ใช้ cursor เดิน step ทีละ 30 นาที ตรวจสอบ minutesOfDay ของแต่ละช่วง
  let peakHalfSlots = 0;
  const cursor = new Date(start);
  for (let i = 0; i < totalHalfSlots; i++) {
    const minutesOfDay = cursor.getHours() * 60 + cursor.getMinutes();
    if (minutesOfDay >= peakStartMinutesOfDay) peakHalfSlots++;
    cursor.setMinutes(cursor.getMinutes() + 30);
  }

  // ราคาปกติ = ราคา/ชม. × จำนวนชั่วโมงรวม (ปัดเศษ)
  const basePrice = Math.round(pricePerHour * totalHours);
  // ค่าพีคไทม์ = surcharge/ชม. × 0.5 (ต่อ 30 นาที) × จำนวนช่วงพีค (ปัดเศษ)
  const peakSurchargeTotal = Math.round((peakSurcharge || 0) * 0.5 * peakHalfSlots);
  const priceTotal = basePrice + peakSurchargeTotal;

  return { basePrice, peakSurchargeTotal, priceTotal };
}
