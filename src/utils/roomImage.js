/**
 * เรื่องรูปและข้อมูลแสดงผลของห้อง
 * ห้องที่แอดมินยังไม่ได้อัปโหลดรูป → ใช้รูปตัวอย่างใน /public/assets/ แทน (เดาจากชื่อห้องหรือประเภทห้อง)
 */

import { fileUrl } from '../api/client.js';

// ชื่อห้อง (ตัวพิมพ์เล็ก) → รูปตัวอย่าง
const NAME_TO_ASSET = {
  'one piece': '/assets/room-one-piece.png',
  'song kran': '/assets/room-songkran.png',
  songkran: '/assets/room-songkran.png',
  'small s': '/assets/room-small-s.jpg',
  'medium m': '/assets/room-medium-m.png',
  'large l': '/assets/room-large-l.png',
  'extra large xl': '/assets/room-xl.png',
};

// รหัสประเภทห้อง (S/M/L/XL) → รูปตัวอย่าง — ใช้เมื่อชื่อห้องไม่ตรงกับข้างบน (ประเภทที่เพิ่มเองใช้รูป hero)
const SIZE_TO_ASSET = {
  S: '/assets/room-small-s.jpg',
  M: '/assets/room-medium-m.png',
  L: '/assets/room-large-l.png',
  XL: '/assets/room-xl.png',
};

/**
 * เลือกรูปที่จะโชว์ของห้อง ตามลำดับ:
 * 1. image_url ที่เป็น URL เต็ม (https://...) → ใช้ตรงๆ
 * 2. รูปที่อัปโหลดไว้ (/uploads/...) → เติมที่อยู่ backend ให้
 * 3. ชื่อห้องตรงกับ NAME_TO_ASSET → ใช้รูปตัวอย่างของห้องนั้น
 * 4. ใช้รูปตัวอย่างตามประเภทห้อง (SIZE_TO_ASSET)
 * 5. ไม่เข้าข้อไหนเลย → รูป hero
 */
export function resolveRoomImage(room) {
  if (room.image_url && /^https?:\/\//.test(room.image_url)) return room.image_url;
  if (room.image_url && room.image_url.startsWith('/')) return fileUrl(room.image_url); // /uploads/... ของ backend
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
 * สัดส่วน (กว้าง:สูง) ของกรอบรูปห้อง — ใช้ที่เดียวกันทั้งกรอบครอปของแอดมิน (AdminRoomSettingsPage)
 * และกรอบรูปที่ลูกค้าเห็น (RoomListPage, BookingPage) รูปที่แอดมินครอปจะได้ตรงกับที่ลูกค้าเห็นเป๊ะ
 * ⚠️ อยากเปลี่ยนสัดส่วน แก้ที่นี่ที่เดียว
 */
const ROOM_PHOTO_WIDTH = 494;
const ROOM_PHOTO_HEIGHT = 312;
export const ROOM_PHOTO_ASPECT_RATIO = ROOM_PHOTO_WIDTH / ROOM_PHOTO_HEIGHT;
