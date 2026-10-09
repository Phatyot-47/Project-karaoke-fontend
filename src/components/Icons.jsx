/**
 * Icons.jsx — re-export icon ทั้งหมดจาก lucide-react ไว้ที่เดียว
 *
 * ทำไมต้อง re-export แทน import ตรงจาก lucide-react?
 * - มี single source ให้แก้ icon ทั้ง app ได้ที่ไฟล์นี้ไฟล์เดียว
 * - ถ้าต้องการเปลี่ยน icon library ในอนาคต แก้แค่ที่นี่โดยไม่กระทบ component อื่น
 * - ชื่อ alias บางตัว (เช่น HistoryIcon) ป้องกัน naming conflict กับ global ของ browser
 */
export {
  Search,
  Bell,
  Check,
  Menu,
  ClipboardCheck,
  History as HistoryIcon, // alias เพื่อหลีกเลี่ยง conflict กับ browser History API
  DoorOpen,
  LayoutGrid,
  Store,
  Calendar as CalendarIcon,
  ArrowLeft,
  ArrowRight,
  Plus,
  LogOut,
  X,
} from 'lucide-react';
