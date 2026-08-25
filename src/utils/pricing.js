/**
 * คำนวณราคาการจองฝั่ง frontend เพื่อ "พรีวิว" ให้ลูกค้าเห็นก่อนกดยืนยัน
 * สูตรตรงกับ backend (src/utils/pricing.js) และดีไซน์ต้นฉบับ:
 * แบ่งเป็นช่วงละ 30 นาที ช่วงไหนเริ่มหลัง (หรือเท่ากับ) peakStartTime ถือเป็นพีคไทม์
 *
 * ราคาที่ตัดสินจริงคำนวณที่ backend เสมอ (กันลูกค้าแก้ราคาเอง) — ค่านี้ใช้แสดงผลเท่านั้น
 */
export function calculateBookingPrice({ pricePerHour, peakStartTime, peakSurcharge, startDatetime, endDatetime }) {
  const start = new Date(startDatetime);
  const end = new Date(endDatetime);
  const totalMinutes = (end - start) / 60000;

  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return { basePrice: 0, peakSurchargeTotal: 0, priceTotal: 0 };
  }

  const totalHalfSlots = totalMinutes / 30;
  const totalHours = totalMinutes / 60;

  const [peakH, peakM] = (peakStartTime || '24:00').split(':').map(Number);
  const peakStartMinutesOfDay = peakH * 60 + (peakM || 0);

  let peakHalfSlots = 0;
  const cursor = new Date(start);
  for (let i = 0; i < totalHalfSlots; i++) {
    const minutesOfDay = cursor.getHours() * 60 + cursor.getMinutes();
    if (minutesOfDay >= peakStartMinutesOfDay) peakHalfSlots++;
    cursor.setMinutes(cursor.getMinutes() + 30);
  }

  const basePrice = Math.round(pricePerHour * totalHours);
  const peakSurchargeTotal = Math.round((peakSurcharge || 0) * 0.5 * peakHalfSlots);
  const priceTotal = basePrice + peakSurchargeTotal;

  return { basePrice, peakSurchargeTotal, priceTotal };
}
