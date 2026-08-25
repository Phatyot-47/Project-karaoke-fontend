/* ไอคอนเส้น (stroke) แบบเรียบง่าย ทดแทน lucide ที่ใช้ในดีไซน์ต้นฉบับ
   เพื่อไม่ต้องพึ่ง CDN ภายนอกตอนรัน */
const base = { width: 29, height: 29, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const ChevronDown = (p) => <svg {...base} {...p}><polyline points="6 9 12 15 18 9" /></svg>;
export const Search = (p) => <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
export const Check = (p) => <svg {...base} {...p}><polyline points="20 6 9 17 4 12" /></svg>;
export const FileText = (p) => <svg {...base} {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
export const Menu = (p) => <svg {...base} {...p}><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
export const ClipboardCheck = (p) => <svg {...base} {...p}><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" /><polyline points="9 14 11 16 15 12" /></svg>;
export const HistoryIcon = (p) => <svg {...base} {...p}><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><polyline points="12 7 12 12 15 15" /></svg>;
export const DoorOpen = (p) => <svg {...base} {...p}><path d="M13 4h3a2 2 0 0 1 2 2v14" /><path d="M2 20h3" /><path d="M13 20h9" /><path d="M10 12v.01" /><path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.562Z" /></svg>;
export const Store = (p) => <svg {...base} {...p}><path d="M3 9l1-5h16l1 5" /><path d="M3 9a2 2 0 0 0 4 0" /><path d="M7 9a2 2 0 0 0 4 0" /><path d="M11 9a2 2 0 0 0 4 0" /><path d="M15 9a2 2 0 0 0 4 0" /><path d="M4 9v11h16V9" /></svg>;
export const CalendarIcon = (p) => <svg {...base} {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
export const ArrowLeft = (p) => <svg {...base} {...p}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
export const ArrowRight = (p) => <svg {...base} {...p}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>;
export const Plus = (p) => <svg {...base} {...p}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
export const Minus = (p) => <svg {...base} {...p}><line x1="5" y1="12" x2="19" y2="12" /></svg>;
export const LogOut = (p) => <svg {...base} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
