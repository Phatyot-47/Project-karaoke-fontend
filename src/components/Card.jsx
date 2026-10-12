/**
 * กล่องสีขาวมุมมน (การ์ด) ที่ใช้ทั้งเว็บ: ส่วนหัว (หัวข้อ + ปุ่ม) และส่วนเนื้อหา
 *
 * @param {string}    title     - หัวข้อการ์ด
 * @param {string}    subtitle  - คำอธิบายสั้นๆ ใต้หัวข้อ
 * @param {ReactNode} actions   - ของที่วางมุมขวาบน เช่น ปุ่ม
 * @param {boolean}   pad       - true (ค่าเริ่มต้น) = มีระยะห่างรอบเนื้อหา / false = เนื้อหาชิดขอบ (เช่น รายการจอง)
 * @param {ReactNode} children  - เนื้อหาในการ์ด
 * @param {object}    style     - สไตล์เพิ่มเติม
 * @param {string}    className - ชื่อ class CSS เพิ่มเติม
 */
export default function Card({ title, subtitle, actions, pad = true, children, style, className = '' }) {
  return (
    <div className={`card ${className}`} style={style}>
      {/* มีส่วนหัวเฉพาะเมื่อมีหัวข้อหรือปุ่ม */}
      {(title || actions) && (
        <div
          className="card-header"
          style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}
        >
          <div>
            {title && <div className="title">{title}</div>}
            {subtitle && <div className="subtitle">{subtitle}</div>}
          </div>
          {actions}
        </div>
      )}
      {/* pad=false = เนื้อหาจัดระยะเอง (เช่น รายการจองที่ต้องชิดขอบ) */}
      <div className={pad ? 'card-body' : ''}>{children}</div>
    </div>
  );
}
