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
