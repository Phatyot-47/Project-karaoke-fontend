/**
 * ช่องเลือกแบบรายการ (dropdown) หน้าตาเหมือนช่องกรอก Input
 *
 * @param {string}    label    - ป้ายกำกับเหนือ select
 * @param {*}         value    - ค่าที่เลือกอยู่ตอนนี้
 * @param {Function}  onChange - ฟังก์ชันที่ทำงานเมื่อเปลี่ยนตัวเลือก
 * @param {ReactNode} children - ตัวเลือก <option> ต่างๆ
 * @param {boolean}   disabled - true = กดเลือกไม่ได้
 * @param {object}    style    - สไตล์เพิ่มเติมของกล่องด้านนอก
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
