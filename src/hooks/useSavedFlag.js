import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * สถานะ "บันทึกสำเร็จ" ที่หายไปเองหลัง durationMs — ใช้คู่กับ <SavedNotice show={saved} />
 * flashSaved() = แสดงข้อความ (เริ่มนับเวลาใหม่ทุกครั้ง) / clearSaved() = ซ่อนทันที (เช่น เปลี่ยนห้องที่แก้ไข)
 */
export default function useSavedFlag(durationMs = 3000) {
  const [saved, setSaved] = useState(false);
  const timerRef = useRef(null);

  const clearSaved = useCallback(() => {
    clearTimeout(timerRef.current);
    setSaved(false);
  }, []);

  const flashSaved = useCallback(() => {
    clearTimeout(timerRef.current);
    setSaved(true);
    timerRef.current = setTimeout(() => setSaved(false), durationMs);
  }, [durationMs]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return { saved, flashSaved, clearSaved };
}
