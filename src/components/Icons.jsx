/**
 * รวมไอคอนทั้งหมดที่เว็บใช้ไว้ที่ไฟล์เดียว (ไอคอนมาจากไลบรารี lucide-react)
 * หน้าอื่นๆ import ไอคอนจากไฟล์นี้ ถ้าวันหลังอยากเปลี่ยนไอคอน แก้ที่นี่ที่เดียว
 * บางตัวตั้งชื่อใหม่ (เช่น History → HistoryIcon) เพราะชื่อเดิมซ้ำกับของที่เบราว์เซอร์มีอยู่แล้ว
 */
export {
  Search,
  Bell,
  Check,
  Menu,
  ClipboardCheck,
  History as HistoryIcon, // ตั้งชื่อใหม่ ไม่ให้ซ้ำกับ History ของเบราว์เซอร์
  DoorOpen,
  LayoutGrid,
  Store,
  Calendar as CalendarIcon,
  ArrowLeft,
  ArrowRight,
  Plus,
  LogOut,
  X,
  Volume2,
  VolumeX,
} from 'lucide-react';
