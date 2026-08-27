/**
 * Tag component — ป้ายสถานะ/ป้ายกำกับขนาดเล็ก
 * สีและสไตล์ขึ้นกับ tone — ใช้ใน booking status, ความจุห้อง, หมายเหตุห้อง ฯลฯ
 *
 * @param {'neutral'|'warning'|'info'|'success'|'danger'} tone - สีของ tag (ควบคุมด้วย CSS class .tag-{tone})
 * @param {boolean}   dot      - ถ้า true จะแสดงจุดสีเล็กๆ ด้านซ้ายก่อน children (ใช้แสดง live status)
 * @param {'sm'|'md'} size     - ขนาด tag: sm ใช้ padding น้อยลง, md ใช้ค่า default ของ CSS
 * @param {ReactNode} children - ข้อความหรือ element ภายใน tag
 */
export default function Tag({ tone = 'neutral', dot = false, size = 'md', children }) {
  return (
    <span className={`tag tag-${tone}`} style={size === 'sm' ? { padding: '2px 8px' } : undefined}>
      {/* dot สำหรับ indicator สถานะ live เช่น "● รอดำเนินการ" */}
      {dot && <span className="tag-dot" />}
      {children}
    </span>
  );
}
