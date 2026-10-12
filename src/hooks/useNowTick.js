import { useEffect, useState } from 'react';

/**
 * ทำให้หน้าจอ "วาดใหม่" ทุก 30 วินาที — ใช้กับข้อมูลที่เปลี่ยนตามเวลาจริง
 * เช่น ช่องเวลาที่ผ่านไปแล้ว หรือสถานะ "รอ Check-in" ที่ต้องเปลี่ยนเองเมื่อถึงเวลา
 * (ปกติ React วาดหน้าใหม่เฉพาะตอนข้อมูลเปลี่ยน แต่ "เวลาที่ผ่านไป" ไม่ได้ทำให้ข้อมูลเปลี่ยน จึงต้องกระตุ้นเอง)
 *
 * @param {number} intervalMs - ทุกกี่มิลลิวินาที (ค่าเริ่มต้น 30,000 = 30 วินาที)
 * @returns {number} ตัวเลขที่เพิ่มขึ้นทุกรอบ (ไม่ได้มีความหมายอะไร แค่ใช้กระตุ้นให้วาดใหม่)
 */
export default function useNowTick(intervalMs = 30000) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    // ตั้งนาฬิกาให้นับทุก intervalMs และหยุดนาฬิกาเมื่อออกจากหน้านี้ (ไม่งั้นจะนับค้างไปเรื่อยๆ)
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return tick;
}
