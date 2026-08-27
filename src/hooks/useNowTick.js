import { useEffect, useState } from 'react';

/**
 * บังคับ re-render ทุก intervalMs — ใช้เมื่อ UI ต้อง refresh ตามเวลาจริงที่ผ่านไป
 * (เช่น สถานะ booking ที่คำนวณจากเวลาปัจจุบัน) โดยไม่มี state อื่นที่เปลี่ยนแปลงให้ re-render เอง
 *
 * ค่าที่ได้ (tick) ไม่มีความหมายอะไรนอกจากเปลี่ยนทุกครั้งเพื่อ trigger re-render
 * — component ที่ใช้ hook นี้จะ re-render ทุก intervalMs โดยอัตโนมัติ
 *
 * @param {number} intervalMs - ความถี่ในการ tick (ms) ค่าเริ่มต้น 30,000 ms (30 วินาที)
 * @returns {number} tick - ตัวเลขที่เพิ่มขึ้นเรื่อยๆ ทุก interval
 */
export default function useNowTick(intervalMs = 30000) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    // ตั้ง interval ที่ intervalMs — cleanup ใน return เพื่อไม่ให้ memory leak
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]); // reset interval เมื่อ intervalMs เปลี่ยน (ปกติไม่เปลี่ยน)

  return tick;
}
