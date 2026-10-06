import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import IconButton from '../components/IconButton.jsx';
import UploadSlot from '../components/UploadSlot.jsx';
import { ArrowLeft, Check } from '../components/Icons.jsx';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { resolveRoomImage } from '../utils/roomImage.js';
import { formatDateTimeRange, money, pad2 } from '../utils/format.js';

// ต้องตรงกับ HOLD_MINUTES ฝั่ง backend (utils/expireBookings.js) — เวลาที่ระบบล็อกเวลานี้ไว้ให้
const HOLD_SECONDS = 5 * 60;

function secondsLeft(booking) {
  const createdAt = booking?.created_at ? new Date(booking.created_at).getTime() : Date.now();
  const elapsed = Math.floor((Date.now() - createdAt) / 1000);
  return Math.max(0, HOLD_SECONDS - elapsed);
}

export default function PaymentPage() {
  const { bookingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { customer } = useAuth();

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [room, setRoom] = useState(location.state?.room || null);
  const [shop, setShop] = useState(null);
  const [evidence, setEvidence] = useState(null);
  const [countdown, setCountdown] = useState(() => secondsLeft(location.state?.booking));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [expired, setExpired] = useState(false);
  // timer อ่าน booking จาก ref แล้วคำนวณเวลาที่เหลือจาก created_at ทุกวินาที (ไม่ลบทีละ 1 จากค่าเดิม)
  // จึงถูกต้องแม้หน้าเพิ่งโหลด booking ทีหลัง หรือแท็บถูกพักไว้นาน
  const bookingRef = useRef(booking);

  useEffect(() => {
    if (!customer) { navigate('/login'); return; }
    let alive = true;
    // มาจากหน้าจองจะมี booking ใน state อยู่แล้ว / รีเฟรชหรือกดชำระต่อจากหน้าประวัติ ให้โหลดจาก server
    (booking ? Promise.resolve(booking) : api.getBooking(bookingId))
      .then((b) => {
        if (!alive) return;
        if (b.customer_id !== customer.user_id) { setLoadError('ไม่พบรายการจองนี้'); return; }
        if (b.booking_status !== 'pending' || b.deposit_status !== 'unpaid') {
          setLoadError(b.deposit_status !== 'unpaid'
            ? 'รายการนี้ส่งสลิปการชำระเงินไปแล้ว กรุณารอร้านตรวจสอบ'
            : 'รายการนี้ไม่อยู่ในสถานะรอชำระมัดจำแล้ว (อาจหมดเวลาชำระหรือถูกยกเลิก)');
          return;
        }
        bookingRef.current = b;
        setBooking(b);
        const left = secondsLeft(b);
        setCountdown(left);
        if (left === 0) setExpired(true);
        if (!room) api.getRoom(b.room_id).then((r) => { if (alive) setRoom(r); }).catch(() => {});
      })
      .catch((err) => { if (alive) setLoadError(err.message); });
    api.getShop().then((s) => { if (alive) setShop(s); }).catch(() => {});
    const timer = setInterval(() => {
      if (!bookingRef.current) return;
      const left = secondsLeft(bookingRef.current);
      setCountdown(left);
      if (left === 0) setExpired(true);
    }, 1000);
    return () => { alive = false; clearInterval(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loadError) {
    return (
      <div className="page-dark app-dark center-screen">
        <Card style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-body)' }}>{loadError}</div>
            <Button variant="primary" onClick={() => navigate('/history', { replace: true })}>ไปหน้าประวัติการจอง</Button>
          </div>
        </Card>
      </div>
    );
  }
  if (!booking) {
    return <div className="page-dark app-dark container-sm"><p style={{ color: 'var(--text-muted)' }}>กำลังโหลด...</p></div>;
  }

  const countdownLabel = `${pad2(Math.floor(countdown / 60))}:${pad2(countdown % 60)}`;

  const handleConfirmPayment = async () => {
    if (expired) return;
    if (!evidence) {
      setError('กรุณาแนบสลิปการโอนเงินก่อนยืนยันการชำระเงิน');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payment = await api.createPayment({
        bookingId: booking.booking_id,
        method: 'qrcode',
        evidenceUrl: evidence,
      });
      bookingRef.current = null; // หยุดนับถอยหลัง
      navigate('/success', { state: { booking, room, payment } });
    } catch (err) {
      setError(err.message);
      if (err.status === 409 && /หมดเวลา/.test(err.message)) setExpired(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-dark app-dark">
      <header className="topbar" style={{ gap: 12, justifyContent: 'flex-start' }}>
        <IconButton label="ย้อนกลับ" onClick={() => navigate(-1)}><ArrowLeft /></IconButton>
        <span style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-strong)' }}>ยืนยันและชำระมัดจำ</span>
      </header>

      <div className="container-sm" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {room && <div style={{ width: 64, height: 64, borderRadius: 8, flex: 'none', backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: `url(${resolveRoomImage(room)})` }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-strong)' }}>{room?.room_name || `ห้อง #${booking.room_id}`}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
                {formatDateTimeRange(booking.start_datetime, booking.end_datetime)}
              </div>
            </div>
          </div>
        </Card>

        {expired ? (
          <Card style={{ background: 'var(--red-50)', border: '1px solid var(--red-200)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--red-700)' }}>หมดเวลาชำระเงิน</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                คุณไม่ได้ชำระเงินภายใน 5 นาทีที่ระบบล็อกเวลาไว้ให้ ช่วงเวลานี้จึงถูกปล่อยกลับเป็นว่างแล้ว
                กรุณาเลือกเวลาใหม่อีกครั้ง
              </div>
              <Button variant="primary" onClick={() => navigate(`/book/${booking.room_id}`, { replace: true })}>
                เลือกเวลาใหม่
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                    สแกนเพื่อจ่ายมัดจำ (PromptPay)
                  </div>
                  <div className="num" style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-strong)', marginTop: 4 }}>
                    ฿ {money(booking.deposit_required)}
                  </div>
                </div>
                <div className="qr-box">
                  {shop?.qr_code_url ? (
                    <img src={shop.qr_code_url} alt="QR PromptPay" />
                  ) : (
                    <span style={{ color: 'var(--text-subtle)', fontSize: 'var(--text-xs)', padding: 16, textAlign: 'center' }}>
                      วาง QR PromptPay ของร้านที่นี่ (รูปภาพจริงตั้งค่าได้ในหน้าตั้งค่าร้านฝั่งแอดมิน)
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: countdown <= 60 ? 'var(--danger-text)' : 'var(--text-subtle)' }}>
                  ระบบล็อกเวลานี้ไว้ให้อีก {countdownLabel} นาที — กรุณาชำระเงินก่อนหมดเวลา
                </div>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-body)' }}>
                    แนบสลิปการโอนเงิน <span style={{ color: 'var(--danger-text)' }}>*</span>
                  </div>
                  <UploadSlot placeholder="ลากไฟล์สลิปมาวาง หรือคลิกเพื่อเลือก" onChange={setEvidence} height={140} />
                  {!evidence && (
                    <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>
                      จำเป็นต้องแนบสลิปก่อนจึงจะยืนยันการชำระเงินได้
                    </span>
                  )}
                </div>
              </div>
            </Card>

            {error && <div className="field-error">{error}</div>}

            <Button variant="accent" size="lg" block iconLeft={<Check />} onClick={handleConfirmPayment} disabled={submitting || !evidence}>
              {submitting ? 'กำลังบันทึก...' : evidence ? 'ยืนยันการชำระเงิน' : 'กรุณาแนบสลิปก่อน'}
            </Button>
            <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', textAlign: 'center', lineHeight: 1.5 }}>
              ยกเลิกได้ล่วงหน้าก่อนเวลาเริ่ม 1 ชั่วโมง — มัดจำไม่สามารถขอคืนได้ทุกกรณี
            </div>

            {shop?.bank_account_no && (
              <Card style={{ background: 'var(--surface-sunken)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
                    กรณี QR ใช้งานไม่ได้ สามารถโอนเงินมัดจำเข้าบัญชีนี้แทนได้
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-strong)' }}>
                    {shop.bank_name || 'ธนาคาร (ยังไม่ได้ตั้งค่า)'}
                  </div>
                  <div className="num" style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-strong)' }}>
                    {shop.bank_account_no}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    ชื่อบัญชี: {shop.bank_account_name || '-'}
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
