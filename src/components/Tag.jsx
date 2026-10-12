/**
 * ป้ายเล็กๆ มีสี เช่น สถานะการจอง ("รอดำเนินการ"), ความจุห้อง, หมายเหตุห้อง
 *
 * @param {'neutral'|'warning'|'info'|'success'|'danger'} tone - สี: เทา / เหลือง / น้ำเงิน / เขียว / แดง
 * @param {boolean}   dot      - true = มีจุดสีเล็กๆ หน้าข้อความ
 * @param {'sm'|'md'} size     - ขนาด: sm = เล็ก, md = ปกติ
 * @param {ReactNode} children - ข้อความในป้าย
 */
export default function Tag({ tone = 'neutral', dot = false, size = 'md', children }) {
  return (
    <span className={`tag tag-${tone}`} style={size === 'sm' ? { padding: '2px 8px' } : undefined}>
      {/* จุดสีหน้าข้อความ เช่น "● รอดำเนินการ" */}
      {dot && <span className="tag-dot" />}
      {children}
    </span>
  );
}
