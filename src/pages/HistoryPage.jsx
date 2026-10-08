// หน้า "ประวัติการจอง" ของลูกค้า (/history) — ดูสถานะ, ชำระมัดจำต่อ, แก้ไข และยกเลิกการจอง
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card.jsx';
import Tag from '../components/Tag.jsx';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import { BookingNote, CancelReason } from '../components/BookingDetails.jsx';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getBookingDisplayStatus, formatDateTimeRange, money } from '../utils/format.js';
import { SIZE_CAPACITY_LABEL } from '../utils/roomImage.js';
import useNowTick from '../hooks/useNowTick.js';

export default function HistoryPage() {
  const { customer } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelingId, setCancelingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  useNowTick(); // บังคับ re-render ทุก 30s ให้ getBookingDisplayStatus() คำนวณสถานะใหม่ตามเวลาจริง

  const load = () => {
    setLoading(true);
    api
      .listCustomerBookings(customer.user_id)
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
      <h1 style={{ fontSize: 'var(--text-xl)' }}>ประวัติการจอง</h1>
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>
        ตรวจสอบและจัดการรายการจองห้องคาราโอเกะของคุณ
      </p>

      {error && (
        <div className="field-error" style={{ marginTop: 16 }}>
          {error}
        </div>
      )}
      {loading && <p style={{ color: 'var(--text-muted)', marginTop: 20 }}>กำลังโหลด...</p>}
      {!loading && !bookings.length && <p style={{ color: 'var(--text-muted)', marginTop: 20 }}>ยังไม่มีรายการจอง</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
        {bookings.map((b) => {
          const statusInfo = getBookingDisplayStatus(b);
          // แก้ไข (เปลี่ยนห้อง/เวลา) ได้เมื่อส่งสลิปมัดจำแล้ว ยังไม่ Check-in — เงื่อนไขเวลาล่วงหน้า backend เป็นคนตรวจ
          const paidAmount = Number(b.paid_amount || 0);
          const canEdit = ['pending', 'confirmed'].includes(b.booking_status) && paidAmount > 0 && !b.session_status;
          // ยังไม่ได้ส่งสลิป (และยังไม่หมดเวลาชำระ ซึ่ง backend จะยกเลิกให้เอง) → กลับไปหน้าชำระมัดจำต่อได้
          const canPay = b.booking_status === 'pending' && b.deposit_status === 'unpaid';
          // Check-in แล้ว (มี session_status) ยกเลิกเองไม่ได้ ต้องให้ร้านจัดการ
          const canCancel = ['pending', 'confirmed'].includes(b.booking_status) && !b.session_status;
          const isDone = ['completed', 'cancelled', 'no_show'].includes(b.booking_status);
          const isCanceling = cancelingId === b.booking_id;
          return (
            <Card key={b.booking_id} style={{ padding: 18 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <Tag tone={statusInfo.tone} dot size="sm">
                    {statusInfo.label}
                  </Tag>
                  <div
                    style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-strong)', marginTop: 6 }}
                  >
                    {b.room_name}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
                    {formatDateTimeRange(b.start_datetime, b.end_datetime)} ·{' '}
                    {SIZE_CAPACITY_LABEL[b.size] || `ความจุ ${b.capacity || '-'} คน`}
                  </div>
                  <BookingNote note={b.note} />
                  <CancelReason booking={b} />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>ยอดรวม</div>
                  <div
                    className="num"
                    style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-strong)' }}
                  >
                    {money(b.price_total)} บาท
                  </div>
                </div>
              </div>

              {isCanceling && (
                <div style={{ marginTop: 10 }}>
                  <Input
                    placeholder="ระบุเหตุผลที่ยกเลิก"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                {isCanceling ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCancelingId(null);
                        setCancelReason('');
                      }}
                    >
                      ย้อนกลับ
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => submitCancel(b.booking_id)}>
                      ยืนยันยกเลิก
                    </Button>
                  </>
                ) : (
                  <>
                    {canPay && (
                      <Button variant="accent" size="sm" onClick={() => navigate(`/pay/${b.booking_id}`)}>
                        {paidAmount > 0
                          ? `ชำระส่วนต่างมัดจำ ${money(Number(b.deposit_required) - paidAmount)} บาท`
                          : 'ชำระมัดจำ'}
                      </Button>
                    )}
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/book/${b.room_id}?edit=${b.booking_id}`)}
                      >
                        แก้ไข
                      </Button>
                    )}
                    {canCancel && (
                      <Button variant="outline" size="sm" onClick={() => setCancelingId(b.booking_id)}>
                        ยกเลิก
                      </Button>
                    )}
                    {isDone && (
                      <Button variant="subtle" size="sm" disabled>
                        สิ้นสุดแล้ว
                      </Button>
                    )}
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
