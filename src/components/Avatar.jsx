/**
 * Avatar component — รูปโปรไฟล์ในวงกลม ถ้าไม่มีรูปแสดงตัวอักษรแรกของชื่อแทน
 * ใช้ใน topbar (ลูกค้า), header (แอดมิน), user-pill ปุ่ม logout และหน้าข้อมูลส่วนตัว
 *
 * @param {string} name - ชื่อผู้ใช้ (ใช้ตัวอักษรแรก uppercase เมื่อไม่มีรูป)
 * @param {string} src  - ลิงก์รูปโปรไฟล์ (users.avatar_url) ไม่บังคับ
 * @param {'sm'|'md'|'lg'} size - ขนาด: sm = 42px, md = 52px, lg = 112px
 */
import { fileUrl } from '../api/client.js';

const SIZES = { sm: 42, md: 52, lg: 112 };

export default function Avatar({ name = '', src, size = 'sm' }) {
  // ดึงตัวอักษรแรก (trim แล้ว uppercase) — ถ้าชื่อว่างใช้ "?" แทน
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const px = SIZES[size] || SIZES.sm;

  return (
    <span className="avatar" style={{ width: px, height: px, fontSize: size === 'lg' ? 'var(--text-2xl)' : undefined }}>
      {src ? <img src={fileUrl(src)} alt={name ? `รูปโปรไฟล์ของ ${name}` : 'รูปโปรไฟล์'} /> : initial}
    </span>
  );
}
