import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { Check } from '../components/Icons.jsx';
import { formatDateTimeRange, money } from '../utils/format.js';

export default function SuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { booking, room } = location.state || {};

  if (!booking) {
    navigate('/', { replace: true });
    return null;
  }

  return (
    <div className="page-dark app-dark center-screen">
      <div style={{ maxWidth: 440, width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--green-50)', color: 'var(--green-700)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check style={{ width: 32, height: 32 }} />
        </div>
        <div>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-strong)' }}>ทำรายการสำเร็จ</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>
            จองห้อง {room?.room_name || `#${booking.room_id}`} · {formatDateTimeRange(booking.start_datetime, booking.end_datetime)}
          </div>
        </div>
        <Card style={{ width: '100%', background: 'var(--green-50)', border: '1px solid var(--green-200)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-body)' }}>ชำระมัดจำแล้ว</span>
            <span className="num" style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--green-700)' }}>{money(booking.deposit_required)} บาท</span>
          </div>
          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', marginTop: 8, textAlign: 'left' }}>
            กำลังรอการยืนยันจากทางร้าน · ยกเลิกได้ก่อนเวลาเริ่ม 1 ชั่วโมง (มัดจำไม่คืนทุกกรณี)
          </div>
        </Card>
        <Button variant="primary" size="lg" block onClick={() => navigate('/')}>กลับหน้าหลัก</Button>
      </div>
    </div>
  );
}
