/**
 * แถบแท็บสำหรับสลับมุมมอง เช่น รายวัน / รายสัปดาห์ / รายเดือน (หน้ารายงาน)
 *
 * @param {{ id: string, label: string }[]} items  - รายการแท็บ
 * @param {string}   value    - id ของแท็บที่เลือกอยู่
 * @param {Function} onChange - ทำงานเมื่อกดแท็บ (ได้ id ของแท็บที่กด)
 */
export default function Tabs({ items, value, onChange }) {
  return (
    <div className="tabs">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          // แท็บที่เลือกอยู่ได้ class .active (ไฮไลต์)
          className={`tab-btn${item.id === value ? ' active' : ''}`}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
