import { Check } from './Icons.jsx';

/** ข้อความ "✓ บันทึกสำเร็จ" สีเขียวข้างปุ่มบันทึก — ใช้คู่กับ hook useSavedFlag */
export default function SavedNotice({ show }) {
  if (!show) return null;
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        color: 'var(--green-700)',
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
      }}
    >
      <Check style={{ width: 16, height: 16 }} /> บันทึกสำเร็จ
    </span>
  );
}
