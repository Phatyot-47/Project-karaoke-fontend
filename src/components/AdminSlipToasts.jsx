// กล่องแจ้งเตือน "สลิปใหม่รอตรวจ" มุมขวาล่างของหน้าแอดมิน (AdminLayout เป็นคนเพิ่มรายการตอนเช็คเจอสลิปใหม่)
// ค้างไว้จนกว่าแอดมินจะกดดูหรือกดปิด — แสดงสูงสุด 5 กล่อง (ใหม่สุดล่างสุด)
import { useNavigate } from 'react-router-dom';
import { X } from './Icons.jsx';
import { formatTimeHM, money } from '../utils/format.js';

export default function AdminSlipToasts({ slips, onDismiss, onDismissAll }) {
  const navigate = useNavigate();
  if (!slips.length) return null;

  const goVerify = () => {
    onDismissAll();
    navigate('/admin/bookings');
  };

  return (
    <div className="admin-toasts" role="status" aria-live="polite">
      {slips.map((s) => (
        <div key={s.payment_id} className="admin-toast">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="admin-toast-title">{s.is_topup ? 'สลิปส่วนต่างมัดจำ รอตรวจ' : 'สลิปใหม่รอตรวจ'}</div>
            <div className="admin-toast-detail">
              {s.room_name} {formatTimeHM(s.start_datetime)}–{formatTimeHM(s.end_datetime)} น. ·{' '}
              {s.customer_name || '-'} · {money(s.amount)} บาท
            </div>
            <button type="button" className="admin-toast-link" onClick={goVerify}>
              ไปตรวจสลิป
            </button>
          </div>
          <button
            type="button"
            className="admin-toast-close"
            aria-label="ปิดแจ้งเตือน"
            onClick={() => onDismiss(s.payment_id)}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>
      ))}
    </div>
  );
}

/**
 * เสียงเตือนสั้นๆ 2 จังหวะ (สร้างด้วย Web Audio ไม่ต้องมีไฟล์เสียง)
 * เบราว์เซอร์อาจไม่ยอมเล่นเสียงถ้ายังไม่เคยคลิกหน้าเว็บเลย — เล่นไม่ได้ก็ข้ามไป (ยังมีกล่องแจ้งเตือนอยู่)
 */
export function playAlertSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    [0, 0.18].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = i === 0 ? 880 : 1175;
      gain.gain.setValueAtTime(0.15, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.15);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.16);
    });
    setTimeout(() => ctx.close(), 600);
  } catch {
    /* เล่นเสียงไม่ได้ ไม่เป็นไร */
  }
}
