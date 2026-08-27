/**
 * Button component — ปุ่มกดทั่วไปที่ใช้ทั่ว app
 *
 * @param {'primary'|'accent'|'outline'|'danger'|'subtle'} variant - สไตล์ปุ่ม
 * @param {'sm'|'md'|'lg'} size - ขนาดปุ่ม
 * @param {boolean} block - ถ้า true จะยืดเต็มความกว้างของ container
 * @param {ReactNode} iconLeft  - icon ด้านซ้ายของ label
 * @param {ReactNode} iconRight - icon ด้านขวาของ label
 * @param {boolean} disabled - ปิดการใช้งานปุ่ม
 * @param {Function} onClick - callback เมื่อคลิก
 * @param {'button'|'submit'|'reset'} type - ประเภท button (default: 'button' ป้องกัน submit form โดยไม่ตั้งใจ)
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
  // สร้าง className จาก variant, size, block — filter Boolean กำจัด string ว่างออก
  const classes = [
    'btn',
    `btn-${variant}`,
    size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '',
    block ? 'btn-block' : '',
  ].filter(Boolean).join(' ');

  return (
    <button type={type} className={classes} disabled={disabled} onClick={onClick} style={style}>
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
