// ช่องกรอก "พีคไทม์" — ใช้ทั้งค่าหลักของร้าน และค่าเฉพาะวันในหน้าตั้งค่าร้าน
// value / onChange เป็นออบเจกต์ชื่อฟิลด์เดียวกับที่ส่งให้ backend: { peakStartTime, peakEndTime, peakSurcharge }
import Input from './Input.jsx';

/** แถว shop / shop_hours จาก API → ค่าในฟอร์ม (เวลาเหลือ "HH:MM", ตัวเลขเป็นสตริง) */
export function toRateForm(row) {
  const time = (t) => (t ? String(t).slice(0, 5) : '');
  return {
    peakStartTime: time(row?.peak_start_time),
    peakEndTime: time(row?.peak_end_time),
    peakSurcharge: row?.peak_surcharge != null ? String(Number(row.peak_surcharge)) : '0',
  };
}

export default function RateFields({ value, onChange }) {
  const set = (field) => (e) => onChange({ ...value, [field]: e.target.value });
  return (
    <div className="rate-fields">
      <div className="rate-group">
        <div className="rate-group-title peak">พีคไทม์ — คิดค่าบริการเพิ่ม</div>
        <div className="rate-group-row">
          <Input
            label="เริ่ม"
            type="time"
            value={value.peakStartTime}
            onChange={set('peakStartTime')}
            hint="ว่าง = ไม่มีพีค"
          />
          <Input
            label="สิ้นสุด"
            type="time"
            value={value.peakEndTime}
            onChange={set('peakEndTime')}
            hint="ว่าง = ถึงร้านปิด"
          />
          <Input label="เพิ่ม (บาท/ชม.)" type="number" value={value.peakSurcharge} onChange={set('peakSurcharge')} />
        </div>
      </div>
    </div>
  );
}
