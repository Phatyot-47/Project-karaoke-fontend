/**
 * ช่องกรอกข้อมูลมาตรฐานของทั้งเว็บ (มีป้ายชื่อด้านบน และข้อความ error/คำแนะนำด้านล่างได้)
 * มี 2 แบบ: ช่องธรรมดา / ช่องที่มีไอคอนด้านซ้าย (เช่น ช่องค้นหา)
 *
 * @param {string}    label       - ป้ายชื่อเหนือช่อง
 * @param {string}    placeholder - ข้อความจางๆ ในช่องตอนยังไม่กรอก
 * @param {*}         value       - ค่าในช่องตอนนี้
 * @param {Function}  onChange    - ฟังก์ชันที่ทำงานทุกครั้งที่พิมพ์
 * @param {string}    type        - ชนิดช่อง เช่น text, number, password, time
 * @param {string}    error       - ข้อความ error สีแดงใต้ช่อง
 * @param {string}    hint        - คำแนะนำใต้ช่อง (แสดงเมื่อไม่มี error)
 * @param {boolean}   disabled    - true = กรอกไม่ได้
 * @param {ReactNode} icon        - ไอคอนด้านซ้ายในช่อง (เช่น แว่นขยาย)
 * @param {string}    min         - ค่าต่ำสุด (ใช้กับช่องตัวเลข)
 * @param {string}    step        - กดลูกศรขึ้น/ลงแล้วเปลี่ยนทีละเท่าไร (ช่องตัวเลข เช่น "0.5")
 * @param {object}    style       - สไตล์เพิ่มเติมของกล่องด้านนอก
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
  min,
  step,
  style,
}) {
  return (
    <div className="field-wrap" style={style}>
      {label && <label className="field-label">{label}</label>}

      {/* มีไอคอน / ไม่มีไอคอน หน้าตาต่างกันเล็กน้อย */}
      {icon ? (
        <div className="field-icon-wrap">
          <span className="icon">{icon}</span>
          <input
            className="field"
            type={type}
            placeholder={placeholder}
            value={value ?? ''} // ไม่มีค่า = ช่องว่าง (กัน React เตือน)
            onChange={onChange}
            disabled={disabled}
            min={min}
            step={step}
            aria-invalid={!!error} // บอกโปรแกรมอ่านหน้าจอว่าช่องนี้กรอกผิด
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
          min={min}
          step={step}
          aria-invalid={!!error}
        />
      )}

      {/* ใต้ช่อง: มี error โชว์ error / ไม่มีค่อยโชว์คำแนะนำ */}
      {error && <span className="field-error">{error}</span>}
      {!error && hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}
