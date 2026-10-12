/**
 * ปุ่มเมนู 1 อันในแถบเมนูด้านซ้ายของหน้าแอดมิน (AdminLayout)
 * มีไอคอน + ชื่อเมนู + ตัวเลขแดง (badge) ได้ และไฮไลต์เมนูของหน้าที่เปิดอยู่
 *
 * @param {string}    label   - ชื่อเมนู
 * @param {ReactNode} icon    - ไอคอนด้านซ้าย
 * @param {boolean}   active  - true = เป็นหน้าที่เปิดอยู่ (ไฮไลต์เมนูนี้)
 * @param {number}    badge   - ตัวเลขแดง เช่น จำนวนรายการรออนุมัติ (0 = ไม่แสดง)
 * @param {Function}  onClick - ฟังก์ชันที่ทำงานเมื่อกด
 */
export default function NavItem({ label, icon, active, badge, onClick }) {
  return (
    <button type="button" className={`admin-nav-item${active ? ' active' : ''}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
      {/* แสดงตัวเลขเฉพาะเมื่อมากกว่า 0 */}
      {!!badge && <span className="badge">{badge}</span>}
    </button>
  );
}
