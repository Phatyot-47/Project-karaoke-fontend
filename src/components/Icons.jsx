/**
 * Icons.jsx — re-export icon ทั้งหมดจาก lucide-react ไว้ที่เดียว
 *
 * ทำไมต้อง re-export แทน import ตรงจาก lucide-react?
 * - มี single source ให้แก้ icon ทั้ง app ได้ที่ไฟล์นี้ไฟล์เดียว
 * - ถ้าต้องการเปลี่ยน icon library ในอนาคต แก้แค่ที่นี่โดยไม่กระทบ component อื่น
 * - ชื่อ alias บางตัว (เช่น HistoryIcon, CalendarIcon) ป้องกัน naming conflict
 *   ในไฟล์ที่ import หลาย symbol พร้อมกัน
 */
export {
  ChevronDown,
  Search,
  Check,
  FileText,
  Menu,
  ClipboardCheck,
  History,
  History as HistoryIcon,   // alias เพื่อหลีกเลี่ยง conflict กับ browser History API
  DoorOpen,
  Store,
  Calendar,
  Calendar as CalendarIcon,  // alias สำหรับใช้คู่กับ Calendar ในไฟล์เดียวกัน
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
  LogOut,
  Trash2,
  Edit,
  Eye,
  Clock,
  User,
  Phone,
  Lock,
  Upload,
  AlertCircle,
  CheckCircle,
  X,
  XCircle,
} from 'lucide-react';
