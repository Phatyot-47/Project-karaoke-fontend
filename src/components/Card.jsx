/**
 * Card component — กล่อง card มาตรฐานของ UI
 * โครงสร้าง: card > card-header (ถ้ามี title/actions) + card-body (ถ้า pad=true)
 *
 * @param {string}    title     - หัวข้อ card (แสดงใน card-header ด้วยสไตล์ .title)
 * @param {string}    subtitle  - คำอธิบายย่อยใต้ title (สไตล์ .subtitle)
 * @param {ReactNode} actions   - element ด้านขวาของ header เช่น ปุ่ม action
 * @param {boolean}   pad       - ถ้า true จะห่อ children ด้วย .card-body (มี padding) — ค่าเริ่มต้น true
 * @param {ReactNode} children  - เนื้อหาภายใน card
 * @param {object}    style     - inline style เพิ่มเติม
 * @param {string}    className - CSS class เพิ่มเติม
 */
export default function Card({ title, subtitle, actions, pad = true, children, style, className = '' }) {
  return (
    <div className={`card ${className}`} style={style}>
      {/* แสดง header เฉพาะเมื่อมี title หรือ actions อย่างน้อยหนึ่งอย่าง */}
      {(title || actions) && (
        <div className="card-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            {title && <div className="title">{title}</div>}
            {subtitle && <div className="subtitle">{subtitle}</div>}
          </div>
          {actions}
        </div>
      )}
      {/* pad=false ใช้เมื่อต้องการให้ children จัดการ padding เอง เช่น booking-row list */}
      <div className={pad ? 'card-body' : ''}>{children}</div>
    </div>
  );
}
