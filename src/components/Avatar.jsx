/**
 * Avatar component — แสดงตัวอักษรแรกของชื่อในวงกลม
 * ใช้ใน topbar (ลูกค้า), header (แอดมิน) และ user-pill ปุ่ม logout
 *
 * @param {string} name - ชื่อผู้ใช้ (ใช้ตัวอักษรแรก uppercase)
 * @param {'sm'|'md'} size - ขนาด: sm = 42px, md = 52px
 */
export default function Avatar({ name = '', size = 'sm' }) {
  // ดึงตัวอักษรแรก (trim แล้ว uppercase) — ถ้าชื่อว่างใช้ "?" แทน
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const px = size === 'sm' ? 42 : 52;

  return (
    <span className="avatar" style={{ width: px, height: px }}>
      {initial}
    </span>
  );
}
