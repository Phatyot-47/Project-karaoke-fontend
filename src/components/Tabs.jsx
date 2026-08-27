/**
 * Tabs component — แถบ tab สำหรับสลับ view (เช่น รายวัน / รายสัปดาห์ / รายเดือน)
 *
 * @param {{ id: string, label: string }[]} items  - รายการ tab
 * @param {string}   value    - id ของ tab ที่ active อยู่
 * @param {Function} onChange - callback เมื่อเปลี่ยน tab รับ id ของ tab ที่เลือก
 */
export default function Tabs({ items, value, onChange }) {
  return (
    <div className="tabs">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          // เพิ่ม class .active เมื่อ item.id ตรงกับ value ที่เลือกอยู่
          className={`tab-btn${item.id === value ? ' active' : ''}`}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
