/**
 * Input component — ฟิลด์กรอกข้อมูลทั่วไป รองรับ 2 รูปแบบ:
 * 1. ปกติ: label (ถ้ามี) + input
 * 2. มี icon: label (ถ้ามี) + wrapper(.field-icon-wrap) > icon + input
 *
 * @param {string}    label       - ป้ายกำกับเหนือ input
 * @param {string}    placeholder - placeholder text
 * @param {*}         value       - ค่าปัจจุบัน (controlled component)
 * @param {Function}  onChange    - callback เมื่อค่าเปลี่ยน
 * @param {string}    type        - ประเภท input (text, number, password, ฯลฯ)
 * @param {string}    error       - ข้อความ error (แสดงใต้ input ด้วยสีแดง)
 * @param {string}    hint        - ข้อความช่วยเหลือ (แสดงถ้าไม่มี error)
 * @param {boolean}   disabled    - ปิดการใช้งาน input
 * @param {ReactNode} icon        - icon ด้านซ้ายใน input (เช่น Search icon)
 * @param {object}    style       - inline style สำหรับ wrapper div
 */
export default function Input({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  error,
  hint,
  disabled = false,
  icon = null,
  style,
}) {
  return (
    <div className="field-wrap" style={style}>
      {label && <label className="field-label">{label}</label>}

      {/* แยก render ตามว่ามี icon หรือไม่ */}
      {icon ? (
        <div className="field-icon-wrap">
          <span className="icon">{icon}</span>
          <input
            className="field"
            type={type}
            placeholder={placeholder}
            value={value ?? ''} // ?? '' ป้องกัน value=undefined ทำให้ input กลายเป็น uncontrolled
            onChange={onChange}
            disabled={disabled}
            aria-invalid={!!error} // บอก screen reader ว่า input มี error
          />
        </div>
      ) : (
        <input
          className="field"
          type={type}
          placeholder={placeholder}
          value={value ?? ''}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={!!error}
        />
      )}

      {/* แสดง error หรือ hint — error มี priority สูงกว่า hint */}
      {error && <span className="field-error">{error}</span>}
      {!error && hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}
