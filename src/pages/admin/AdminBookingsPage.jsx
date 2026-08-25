import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import Tag from '../../components/Tag.jsx';
import Input from '../../components/Input.jsx';
import { Check } from '../../components/Icons.jsx';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatDateTimeRange, money, isBookingAwaitingStart } from '../../utils/format.js';
import { resolveRoomImage } from '../../utils/roomImage.js';
import useNowTick from '../../hooks/useNowTick.js';

export default function AdminBookingsPage() {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ pending_count: 0, in_progress_count: 0, completed_count: 0, revenue_today: 0 });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  // บังคับ re-render ทุก 30s ให้สถานะ "รอดำเนินการ"/"กำลังดำเนินการ" ของแต่ละแถวอัปเดตตามเวลาจริง
  useNowTick();

  const load = () => {
    setLoading(true);
    api.getTodayBookings()
      .then((today) => {
        setStats(today.stats);
        setBookings(today.bookings);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirm = async (id) => {
    try { await api.confirmBooking(id); load(); } catch (err) { setError(err.message); }
  };

  const handleVerifyPayment = async (paymentId, approve) => {
    try { await api.verifyPayment(paymentId, approve, admin.user_id); load(); } catch (err) { setError(err.message); }
  };

  const submitReject = async (id) => {
    try {
      await api.rejectBooking(id, rejectReason.trim() || 'ไม่ระบุเหตุ');
      setRejectingId(null);
      setRejectReason('');
      load();
    } catch (err) { setError(err.message); }
  };

  return (
    <div style={{ maxWidth: 1900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="stat-cards">
        <Card className="stat-card">
          <div className="label">รอดำเนินการ</div>
          <div className="num value" style={{ color: 'var(--amber-600)' }}>{stats.pending_count}</div>
        </Card>
        <Card className="stat-card">
          <div className="label">กำลังดำเนินการ</div>
          <div className="num value" style={{ color: 'var(--primary-700)' }}>{stats.in_progress_count}</div>
        </Card>
        <Card className="stat-card">
          <div className="label">เสร็จสมบูรณ์</div>
          <div className="num value" style={{ color: 'var(--green-700)' }}>{stats.completed_count}</div>
        </Card>
        <Card className="stat-card">
          <div className="label">รายได้วันนี้</div>
          <div className="num value" style={{ color: 'var(--text-strong)' }}>฿ {money(stats.revenue_today)}</div>
        </Card>
      </div>

      {error && <div className="field-error">{error}</div>}

      <Card
        title="รายการจองวันนี้"
        subtitle="รอการยืนยันจากคุณ"
        pad={false}
        actions={<Button variant="primary" size="sm" onClick={() => navigate('/admin/walkin')}>จองวอล์คอิน</Button>}
      >
        {loading && <p style={{ color: 'var(--text-muted)', padding: 20 }}>กำลังโหลด...</p>}
        {!loading && !bookings.length && <p style={{ color: 'var(--text-muted)', padding: 20 }}>ยังไม่มีรายการจองวันนี้</p>}
        {bookings.map((b) => {
          const isWalkIn = b.booking_source === 'admin_walkin';
          const isAwaitingStart = b.booking_status === 'confirmed' && isBookingAwaitingStart(b);
          return (
            <div className="booking-row" key={b.booking_id}>
              <div className="booking-photo" style={{ backgroundImage: `url(${resolveRoomImage(b)})` }} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 'var(--text-md)', color: 'var(--text-strong)' }}>{b.room_name}</span>
                  <span className="num" style={{ fontWeight: 700, color: 'var(--green-700)' }}>{money(b.price_total)} บาท</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 4, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  <span>{formatDateTimeRange(b.start_datetime, b.end_datetime)}</span>
                  <span>ลูกค้า: {b.customer_name || 'ไม่ระบุ'}</span>
                  {isWalkIn && <Tag tone="info" size="sm">วอล์คอิน</Tag>}
                  {b.deposit_status && <Tag tone={b.deposit_status === 'paid' ? 'success' : b.deposit_status === 'pending_verify' ? 'warning' : 'neutral'} size="sm">มัดจำ: {b.deposit_status}</Tag>}
                </div>
                {b.booking_status === 'cancelled' && b.cancel_reason && (
                  <div style={{ marginTop: 10, fontSize: 'var(--text-xs)', color: 'var(--red-600)', background: 'var(--red-50)', borderRadius: 6, padding: '6px 10px' }}>
                    เหตุผลที่ยกเลิก: {b.cancel_reason}
                  </div>
                )}
                {b.evidence_url && (
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img
                      src={b.evidence_url}
                      alt="สลิปเงินมัดจำ"
                      style={{ width: 220, height: 220, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--border-default)', background: '#fff' }}
                    />
                    {b.payment_status === 'pending' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>ตรวจสอบสลิปเงินมัดจำ</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Button variant="danger" size="sm" onClick={() => handleVerifyPayment(b.payment_id, false)}>ปฏิเสธสลิป</Button>
                          <Button variant="accent" size="sm" iconLeft={<Check />} onClick={() => handleVerifyPayment(b.payment_id, true)}>อนุมัติสลิป</Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {rejectingId === b.booking_id && (
                  <div style={{ marginTop: 10 }}>
                    <Input placeholder="ระบุเหตุผลที่ปฏิเสธ (จะแจ้งลูกค้า)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                  </div>
                )}
              </div>
              <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                {b.booking_status === 'pending' && rejectingId === b.booking_id && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => { setRejectingId(null); setRejectReason(''); }}>ย้อนกลับ</Button>
                    <Button variant="danger" size="sm" onClick={() => submitReject(b.booking_id)}>ยืนยันยกเลิก</Button>
                  </>
                )}
                {b.booking_status === 'pending' && rejectingId !== b.booking_id && (
                  <>
                    <Tag tone="warning" dot>รอดำเนินการ</Tag>
                    <Button variant="outline" size="sm" onClick={() => setRejectingId(b.booking_id)}>ปฏิเสธ</Button>
                    <Button variant="accent" size="sm" iconLeft={<Check />} onClick={() => handleConfirm(b.booking_id)}>ยืนยัน</Button>
                  </>
                )}
                {/* ทั้งสองบรรทัดต้องเช็ค booking_status === 'confirmed' ซ้ำเสมอ — isAwaitingStart
                    เป็น false ให้ทั้งกรณี "confirmed แล้วเริ่มแล้ว" และกรณี "ไม่ใช่ confirmed เลย"
                    ถ้าตัดเช็คนี้ออก แถว completed/cancelled จะโชว์ "กำลังดำเนินการ" ผิดไปด้วย */}
                {b.booking_status === 'confirmed' && isAwaitingStart && <Tag tone="warning" dot>รอดำเนินการ</Tag>}
                {b.booking_status === 'confirmed' && !isAwaitingStart && <Tag tone="info" dot>กำลังดำเนินการ</Tag>}
                {b.booking_status === 'completed' && <Tag tone="success" dot>เสร็จสมบูรณ์</Tag>}
                {b.booking_status === 'cancelled' && <Tag tone="danger" dot>ยกเลิกแล้ว</Tag>}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
