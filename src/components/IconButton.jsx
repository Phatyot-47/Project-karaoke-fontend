/**
 * IconButton component — ปุ่มที่มีแค่ icon (ไม่มีข้อความ)
 * ใช้ aria-label และ title เพื่อ accessibility (screen reader และ tooltip)
 *
 * @param {string}    label    - ป้ายกำกับ (แสดงใน tooltip + อ่านโดย screen reader)
 * @param {Function}  onClick  - callback เมื่อคลิก
 * @param {ReactNode} children - icon ที่จะแสดงภายในปุ่ม
 */
export default function IconButton({ label, onClick, children }) {
  return (
    // type="button" ป้องกันไม่ให้ trigger form submit โดยไม่ตั้งใจ
    <button type="button" aria-label={label} title={label} className="icon-btn" onClick={onClick}>
      {children}
    </button>
  );
}
