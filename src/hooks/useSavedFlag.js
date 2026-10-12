import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * ตัวช่วยโชว์ข้อความ "บันทึกสำเร็จ" แล้วให้หายไปเองใน 3 วินาที — ใช้คู่กับ <SavedNotice show={saved} />
 * วิธีใช้: const { saved, flashSaved, clearSaved } = useSavedFlag();
 *   flashSaved() = โชว์ข้อความ (กดซ้ำก็เริ่มนับ 3 วินาทีใหม่) / clearSaved() = ซ่อนทันที
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
