import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import Tag from '../../components/Tag.jsx';
import Input from '../../components/Input.jsx';
import Select from '../../components/Select.jsx';
import { Check } from '../../components/Icons.jsx';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatDateTimeRange, formatTimeHM, money } from '../../utils/format.js';
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
  // ย้ายห้อง: rooms = ห้องทั้งหมดไว้ให้เลือก, movingId = booking ที่กำลังเลือกห้องใหม่
  const [rooms, setRooms] = useState([]);
  const [movingId, setMovingId] = useState(null);
  const [moveRoomId, setMoveRoomId] = useState('');
  // ต่อเวลา: จำนวนนาทีที่เลือกไว้ของแต่ละ booking (ค่าเริ่มต้น 30 นาที)
  const [extendMinutes, setExtendMinutes] = useState({});
  const [notice, setNotice] = useState('');
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

  useEffect(() => {
    api.listAdminRooms().then(setRooms).catch(() => {});
  }, []);

  const handleConfirm = async (id) => {
    try { await api.confirmBooking(id); load(); } catch (err) { setError(err.message); }
  };

  const handleVerifyPayment = async (paymentId, approve) => {
    try { await api.verifyPayment(paymentId, approve, admin.user_id); load(); } catch (err) { setError(err.message); }
  };

  const startMove = (b) => {
    setMovingId(b.booking_id);
    setMoveRoomId('');
    setRejectingId(null);
  };

  const submitMove = async (id) => {
    if (!moveRoomId) { setError('กรุณาเลือกห้องที่จะย้ายไป'); return; }
    try {
      await api.changeBookingRoom(id, Number(moveRoomId));
      setMovingId(null);
      setMoveRoomId('');
      setError('');
      load();
    } catch (err) { setError(err.message); }
  };

  // Check-in / ต่อเวลา / Check-out — แสดงผลลัพธ์สั้นๆ ใน notice แล้วโหลดรายการใหม่
  const runSessionAction = async (action, successMessage) => {
    setError('');
    setNotice('');
    try {
      const result = await action();
      setNotice(successMessage(result));
      load();
    } catch (err) { setError(err.message); }
  };

  const handleCheckIn = (b) => runSessionAction(
    () => api.checkIn(b.booking_id, admin.user_id),
    () => `Check-in ${b.room_name} แล้ว`
  );

  const handleExtend = (b) => {
    const minutes = extendMinutes[b.booking_id] || 30;
    return runSessionAction(
      () => api.extendBooking(b.booking_id, minutes, admin.user_id),
      (ext) => `ต่อเวลา ${b.room_name} ${minutes} นาที ถึง ${formatTimeHM(ext.new_end_datetime)} น. (+${money(ext.extra_amount)} บาท)`
    );
  };

  const handleCheckOut = (b) => runSessionAction(
    () => api.checkOut(b.booking_id, admin.user_id),
    (s) => (Number(s.overtime_amount) > 0
      ? `Check-out ${b.room_name} แล้ว — ออกช้า ${s.minutes_late} นาที คิดค่าเกินเวลา ${money(s.overtime_amount)} บาท`
      : `Check-out ${b.room_name} แล้ว`)
  );

  const submitReject = async (id) => {
    try {
      await api.rejectBooking(id, rejectReason.trim() || 'ไม่ระบุเหตุ');
      setRejectingId(null);
      setRejectReason('');
      load();
    } catch (err) { setError(err.message); }
  };

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
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
      {notice && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--green-700)' }}>{notice}</div>}

      <Card
        title="รายการจองวันนี้"
        subtitle="รอการยืนยันจากคุณ"
        pad={false}
        actions={<Button variant="primary" size="sm" onClick={() => navigate('/admin/walkin')}>จองวอล์คอิน</Button>}
      >
        {loading && <p style={{ color: 'var(--text-muted)', padding: 16 }}>กำลังโหลด...</p>}
        {!loading && !bookings.length && <p style={{ color: 'var(--text-muted)', padding: 16 }}>ยังไม่มีรายการจองวันนี้</p>}
        {bookings.map((b) => {
          const isWalkIn = b.booking_source === 'admin_walkin';
          const inSession = b.session_status === 'in_progress';
          return (
            <div className="booking-row" key={b.booking_id}>
              <div className="booking-photo" style={{ backgroundImage: `url(${resolveRoomImage(b)})` }} />
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-strong)' }}>{b.room_name}</span>
                  <span className="num" style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--green-700)' }}>{money(b.price_total)} บาท</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4, fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
                  <span>{formatDateTimeRange(b.start_datetime, b.end_datetime)}</span>
                  <span>ลูกค้า: {b.customer_name || 'ไม่ระบุ'}</span>
                  {isWalkIn && <Tag tone="info" size="sm">วอล์คอิน</Tag>}
                  {b.deposit_status && <Tag tone={b.deposit_status === 'paid' ? 'success' : b.deposit_status === 'pending_verify' ? 'warning' : 'neutral'} size="sm">มัดจำ: {b.deposit_status}</Tag>}
                </div>
                {b.booking_status === 'cancelled' && b.cancel_reason && (
                  <div style={{ marginTop: 8, fontSize: 'var(--text-2xs)', color: 'var(--red-600)', background: 'var(--red-50)', borderRadius: 6, padding: '4px 8px' }}>
                    เหตุผลที่ยกเลิก: {b.cancel_reason}
                  </div>
                )}
                {b.session_id && (
                  <div style={{ marginTop: 6, fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
                    เข้า {formatTimeHM(b.checkin_time)} น.
                    {b.checkout_time && ` · ออก ${formatTimeHM(b.checkout_time)} น.`}
                    {Number(b.extended_minutes) > 0 && ` · ต่อเวลา ${b.extended_minutes} นาที (+${money(b.extension_amount)} บาท)`}
                    {Number(b.overtime_amount) > 0 && ` · ค่าเกินเวลา ${money(b.overtime_amount)} บาท`}
                  </div>
                )}
                {b.note && (
                  <div style={{ marginTop: 8, fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', whiteSpace: 'pre-line' }}>
                    หมายเหตุ: {b.note}
                  </div>
                )}
                {movingId === b.booking_id && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'flex-end', gap: 6, flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 200px', minWidth: 160 }}>
                      <Select label="ย้ายไปห้อง (ช่วงเวลาและราคาเดิม)" value={moveRoomId} onChange={(e) => setMoveRoomId(e.target.value)}>
                        <option value="" disabled>เลือกห้อง</option>
                        {rooms.filter((r) => r.is_active && r.room_id !== b.room_id).map((r) => (
                          <option key={r.room_id} value={r.room_id}>{r.room_name}</option>
                        ))}
                      </Select>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setMovingId(null)}>ย้อนกลับ</Button>
                    <Button variant="primary" size="sm" onClick={() => submitMove(b.booking_id)}>ยืนยันย้ายห้อง</Button>
                  </div>
                )}
                {b.evidence_url && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <img
                      src={b.evidence_url}
                      alt="สลิปเงินมัดจำ"
                      style={{ width: 120, height: 120, objectFit: 'contain', borderRadius: 6, border: '1px solid var(--border-default)', background: '#fff' }}
                    />
                    {b.payment_status === 'pending' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>ตรวจสอบสลิปเงินมัดจำ</span>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <Button variant="danger" size="sm" onClick={() => handleVerifyPayment(b.payment_id, false)}>ปฏิเสธสลิป</Button>
                          <Button variant="accent" size="sm" iconLeft={<Check />} onClick={() => handleVerifyPayment(b.payment_id, true)}>อนุมัติสลิป</Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {rejectingId === b.booking_id && (
                  <div style={{ marginTop: 8 }}>
                    <Input placeholder="ระบุเหตุผลที่ปฏิเสธ (จะแจ้งลูกค้า)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {b.booking_status === 'pending' && rejectingId === b.booking_id && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => { setRejectingId(null); setRejectReason(''); }}>ย้อนกลับ</Button>
                    <Button variant="danger" size="sm" onClick={() => submitReject(b.booking_id)}>ยืนยันยกเลิก</Button>
                  </>
                )}
                {b.booking_status === 'pending' && rejectingId !== b.booking_id && (
                  <>
                    <Tag tone="warning" dot>รอดำเนินการ</Tag>
                    <Button variant="outline" size="sm" onClick={() => { setRejectingId(b.booking_id); setMovingId(null); }}>ปฏิเสธ</Button>
                    <Button variant="accent" size="sm" iconLeft={<Check />} onClick={() => handleConfirm(b.booking_id)}>ยืนยัน</Button>
                  </>
                )}
                {(b.booking_status === 'pending' || b.booking_status === 'confirmed') && movingId !== b.booking_id && rejectingId !== b.booking_id && (
                  <Button variant="outline" size="sm" onClick={() => startMove(b)}>ย้ายห้อง</Button>
                )}
                {b.booking_status === 'confirmed' && !b.session_id && (
                  <>
                    <Tag tone="warning" dot>รอ Check-in</Tag>
                    <Button variant="accent" size="sm" onClick={() => handleCheckIn(b)}>Check-in</Button>
                  </>
                )}
                {b.booking_status === 'confirmed' && inSession && (
                  <>
                    <Tag tone="info" dot>กำลังใช้ห้อง</Tag>
                    <div style={{ width: 110 }}>
                      <Select
                        value={extendMinutes[b.booking_id] || 30}
                        onChange={(e) => setExtendMinutes((m) => ({ ...m, [b.booking_id]: Number(e.target.value) }))}
                      >
                        {[30, 60, 90, 120].map((m) => <option key={m} value={m}>+{m} นาที</option>)}
                      </Select>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleExtend(b)}>ต่อเวลา</Button>
                    <Button variant="primary" size="sm" onClick={() => handleCheckOut(b)}>Check-out</Button>
                  </>
                )}
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
