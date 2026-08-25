import { useEffect, useState } from 'react';

// บังคับ re-render ทุก intervalMs — ใช้เมื่อ UI ต้อง refresh ตามเวลาจริงที่ผ่านไป
// (เช่น สถานะ booking ที่คำนวณจากเวลาปัจจุบัน) โดยไม่มี state อื่นที่เปลี่ยนแปลงให้ re-render เอง
// ค่าที่ได้ (tick) ไม่มีความหมายอะไรนอกจากเปลี่ยนทุกครั้งเพื่อ trigger re-render
export default function useNowTick(intervalMs = 30000) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
}
