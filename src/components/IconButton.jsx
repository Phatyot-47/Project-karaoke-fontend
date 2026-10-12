/**
 * ปุ่มที่มีแค่ไอคอน ไม่มีข้อความ (เช่น ปุ่มย้อนกลับ ←)
 * label จะโชว์เป็นข้อความตอนเอาเมาส์ชี้ และให้โปรแกรมอ่านหน้าจอ (สำหรับผู้พิการทางสายตา) อ่านได้
 *
 * @param {string}    label    - คำอธิบายปุ่ม เช่น "ย้อนกลับ"
 * @param {Function}  onClick  - ฟังก์ชันที่ทำงานเมื่อกด
 * @param {ReactNode} children - ไอคอนในปุ่ม
 */
export default function IconButton({ label, onClick, children }) {
  return (
    // type="button" กันกดแล้วฟอร์มถูกส่งโดยไม่ตั้งใจ
    <button type="button" aria-label={label} title={label} className="icon-btn" onClick={onClick}>
      {children}
    </button>
  );
}
