/**
 * NavItem component — รายการเมนูใน sidebar ของ AdminLayout
 * รองรับ active state, badge (จำนวนรายการที่รอดำเนินการ), และ icon
 *
 * @param {string}    label   - ชื่อเมนู
 * @param {ReactNode} icon    - icon ด้านซ้ายของ label
 * @param {boolean}   active  - ถ้า true จะเพิ่ม class .active (highlight เมนูปัจจุบัน)
 * @param {number}    badge   - จำนวนที่แสดงใน badge (แสดงเฉพาะเมื่อ badge > 0)
 * @param {Function}  onClick - callback เมื่อคลิก
 */
export default function NavItem({ label, icon, active, badge, onClick }) {
  return (
    <button type="button" className={`admin-nav-item${active ? ' active' : ''}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
      {/* แสดง badge เฉพาะเมื่อมีค่า truthy (> 0) — !! แปลงเป็น boolean ก่อน */}
      {!!badge && <span className="badge">{badge}</span>}
    </button>
  );
}
