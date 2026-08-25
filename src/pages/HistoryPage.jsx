import { useEffect, useState } from 'react';
import Card from '../components/Card.jsx';
import Tag from '../components/Tag.jsx';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getBookingDisplayStatus, formatDateTimeRange, money } from '../utils/format.js';
import { SIZE_CAPACITY_LABEL } from '../utils/roomImage.js';
import useNowTick from '../hooks/useNowTick.js';

export default function HistoryPage() {
  const { customer } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelingId, setCancelingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  useNowTick(); // บังคับ re-render ทุก 30s ให้ getBookingDisplayStatus() คำนวณสถานะใหม่ตามเวลาจริง

  const load = () => {
    setLoading(true);
    api.listCustomerBookings(customer.user_id)
      .then(setBookings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [customer.user_id]);

  const submitCancel = async (id) => {
    try {
      await api.cancelBooking(id, cancelReason.trim() || 'ลูกค้ายกเลิกเอง');
      setCancelingId(null);
      setCancelReason('');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container-md">
      <h1 style={{ fontSize: 'var(--text-2xl)' }}>ประวัติการจอง</h1>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 6 }}>
        ตรวจสอบและจัดการรายการจองห้องคาราโอเกะของคุณ
      </p>

      {error && <div className="field-error" style={{ marginTop: 16 }}>{error}</div>}
      {loading && <p style={{ color: 'var(--text-muted)', marginTop: 24 }}>กำลังโหลด...</p>}
      {!loading && !bookings.length && <p style={{ color: 'var(--text-muted)', marginTop: 24 }}>ยังไม่มีรายการจอง</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
        {bookings.map((b) => {
          const statusInfo = getBookingDisplayStatus(b);
          const canEdit = b.booking_status === 'pending';
          const canCancel = b.booking_status === 'pending' || b.booking_status === 'confirmed';
          const isDone = b.booking_status === 'completed' || b.booking_status === 'cancelled';
          const isCanceling = cancelingId === b.booking_id;
          return (
            <Card key={b.booking_id}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <Tag tone={statusInfo.tone} dot size="sm">{statusInfo.label}</Tag>
                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-strong)', marginTop: 8 }}>{b.room_name}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 4 }}>
                    {formatDateTimeRange(b.start_datetime, b.end_datetime)} · {SIZE_CAPACITY_LABEL[b.size] || `ความจุ ${b.capacity || '-'} คน`}
                  </div>
                  {b.booking_status === 'cancelled' && b.cancel_reason && (
                    <div style={{ marginTop: 10, fontSize: 'var(--text-xs)', color: 'var(--red-600)', background: 'var(--red-50)', borderRadius: 6, padding: '6px 10px' }}>
                      เหตุผลที่ยกเลิก: {b.cancel_reason}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>ยอดรวม</div>
                  <div className="num" style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-strong)' }}>{money(b.price_total)} บาท</div>
                </div>
              </div>

              {isCanceling && (
                <div style={{ marginTop: 12 }}>
                  <Input placeholder="ระบุเหตุผลที่ยกเลิก" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                {isCanceling ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => { setCancelingId(null); setCancelReason(''); }}>ย้อนกลับ</Button>
                    <Button variant="danger" size="sm" onClick={() => submitCancel(b.booking_id)}>ยืนยันยกเลิก</Button>
                  </>
                ) : (
                  <>
                    {canEdit && <Button variant="outline" size="sm" disabled>แก้ไข</Button>}
                    {canCancel && <Button variant="outline" size="sm" onClick={() => setCancelingId(b.booking_id)}>ยกเลิก</Button>}
                    {isDone && <Button variant="subtle" size="sm" disabled>สิ้นสุดแล้ว</Button>}
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
