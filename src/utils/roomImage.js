/**
 * room.image_url จาก backend อาจว่างหรือเป็น path ที่ยังไม่ตรงกับไฟล์จริง
 * ฟังก์ชัน resolveRoomImage() เดารูปจากชื่อห้องหรือประเภทห้อง (size = รหัสประเภท S/M/L/XL) เป็น fallback
 * (ใช้ asset ที่มากับดีไซน์ต้นฉบับใน /public/assets/)
 */

// Map ชื่อห้อง (lowercase) → asset path
const NAME_TO_ASSET = {
  'one piece': '/assets/room-one-piece.png',
  'song kran': '/assets/room-songkran.png',
  songkran: '/assets/room-songkran.png',
  'small s': '/assets/room-small-s.jpg',
  'medium m': '/assets/room-medium-m.png',
  'large l': '/assets/room-large-l.png',
  'extra large xl': '/assets/room-xl.png',
};

// Map รหัสประเภทห้อง (S/M/L/XL) → asset path — ใช้เมื่อหาชื่อไม่ตรงใน NAME_TO_ASSET (ประเภทที่เพิ่มเองใช้รูป hero)
const SIZE_TO_ASSET = {
  S: '/assets/room-small-s.jpg',
  M: '/assets/room-medium-m.png',
  L: '/assets/room-large-l.png',
  XL: '/assets/room-xl.png',
};

/**
 * หา URL รูปห้องที่เหมาะสมที่สุด โดยใช้ลำดับความสำคัญดังนี้:
 * 1. image_url ที่เป็น URL เต็ม (https://...) → ใช้ตรงๆ
 * 2. image_url ที่ขึ้นต้นด้วย / (เช่น /uploads/...) → เป็น path ของ server ใช้ได้
 * 3. ชื่อห้อง (lowercase trim) ตรงกับ NAME_TO_ASSET → ใช้ asset ที่ map ไว้
 * 4. ประเภทห้อง (SIZE_TO_ASSET) → fallback ตามประเภท
 * 5. hero image → fallback สุดท้าย
 */
export function resolveRoomImage(room) {
  if (room.image_url && /^https?:\/\//.test(room.image_url)) return room.image_url;
  if (room.image_url && room.image_url.startsWith('/')) return room.image_url;
  const byName = NAME_TO_ASSET[(room.room_name || room.name || '').trim().toLowerCase()];
  if (byName) return byName;
  return SIZE_TO_ASSET[room.size] || '/assets/hero-room.png';
}

/**
 * ป้ายความจุของห้อง — ใช้ช่วงความจุของประเภทห้อง (room_type ที่ API ส่งมาด้วย เช่น "ความจุ 3-5 คน")
 * ถ้าไม่มีข้อมูลประเภท ใช้ความจุของห้องนั้นแทน — ใช้ใน RoomListPage, BookingPage, HistoryPage
 */
export function capacityLabel(room) {
  if (room?.capacity_min && room?.capacity_max) {
    return room.capacity_min === room.capacity_max
      ? `ความจุ ${room.capacity_max} คน`
      : `ความจุ ${room.capacity_min}-${room.capacity_max} คน`;
  }
  return `ความจุ ${room?.capacity || '-'} คน`;
}

/**
 * สัดส่วน (aspect ratio) กล่องรูปห้อง — single source of truth
 * ใช้ร่วมกันทั้งกล่อง crop ในหน้าตั้งค่าห้องฝั่งแอดมิน (AdminRoomSettingsPage)
 * และกล่องแสดงรูปห้องฝั่งลูกค้า (RoomListPage, BookingPage)
 * เพื่อให้รูปที่แอดมิน crop ไว้ตรงกับสิ่งที่ลูกค้าเห็นจริงเสมอ
 * ⚠️ แก้ที่นี่ที่เดียวถ้าต้องการเปลี่ยนสัดส่วน
 */
const ROOM_PHOTO_WIDTH = 494;
const ROOM_PHOTO_HEIGHT = 312;
export const ROOM_PHOTO_ASPECT_RATIO = ROOM_PHOTO_WIDTH / ROOM_PHOTO_HEIGHT;
