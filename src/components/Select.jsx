/**
 * Select component — dropdown select field ที่ใช้ design system เดียวกับ Input
 * ห่อด้วย .field-wrap เพื่อให้ layout ตรงกัน
 *
 * @param {string}    label    - ป้ายกำกับเหนือ select
 * @param {*}         value    - ค่าที่เลือกอยู่ (controlled)
 * @param {Function}  onChange - callback เมื่อค่าเปลี่ยน
 * @param {ReactNode} children - <option> elements
 * @param {boolean}   disabled - ปิดการใช้งาน select
 * @param {object}    style    - inline style สำหรับ wrapper div
 */
export default function Select({ label, value, onChange, children, disabled = false, style }) {
  return (
    <div className="field-wrap" style={style}>
      {label && <label className="field-label">{label}</label>}
      <select className="field" value={value} onChange={onChange} disabled={disabled}>
        {children}
      </select>
    </div>
  );
}
