/**
 * ปุ่มกดมาตรฐานของทั้งเว็บ (สีและขนาดเหมือนกันทุกหน้า)
 *
 * @param {'primary'|'accent'|'outline'|'danger'|'subtle'} variant - สไตล์ปุ่ม
 * @param {'sm'|'md'|'lg'} size - ขนาดปุ่ม
 * @param {boolean} block - true = ปุ่มยืดเต็มความกว้าง
 * @param {ReactNode} iconLeft  - ไอคอนด้านซ้ายของข้อความ
 * @param {ReactNode} iconRight - ไอคอนด้านขวาของข้อความ
 * @param {boolean} disabled - ปิดการใช้งานปุ่ม
 * @param {Function} onClick - ฟังก์ชันที่ทำงานเมื่อกดปุ่ม
 * @param {'button'|'submit'|'reset'} type - ค่าเริ่มต้น 'button' (กันกดแล้วฟอร์มถูกส่งโดยไม่ตั้งใจ)
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  iconLeft = null,
  iconRight = null,
  disabled = false,
  onClick,
  type = 'button',
  children,
  style,
}) {
  // ประกอบชื่อ class CSS เช่น "btn btn-primary btn-sm" (ตัดค่าว่างออกก่อนต่อกัน)
  const classes = [
    'btn',
    `btn-${variant}`,
    size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '',
    block ? 'btn-block' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} disabled={disabled} onClick={onClick} style={style}>
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
