import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import IconButton from '../components/IconButton.jsx';
import { ArrowLeft, ArrowRight } from '../components/Icons.jsx';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { resolveRoomImage, SIZE_CAPACITY_LABEL, ROOM_PHOTO_ASPECT_RATIO } from '../utils/roomImage.js';
import { calculateBookingPrice } from '../utils/pricing.js';
import { todayISODate, formatThaiDate, addMinutesToTime, addMinutesToDateTime, timeToMinutes, money, roomNoteLines, DAY_LABELS, isSlotPastBangkok } from '../utils/format.js';

export default function BookingPage() {
  const { roomId } = useParams();
  const { customer } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [shop, setShop] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedStart, setSelectedStart] = useState(null);
  const [selectedEnd, setSelectedEnd] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [nowTick, setNowTick] = useState(0);

  const today = todayISODate();

  useEffect(() => {
    const id = setInterval(() => setNowTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!customer) { navigate('/login'); return; }
    let alive = true;
    setLoading(true);
    Promise.all([api.getRoom(roomId), api.getShop(), api.getRoomAvailability(roomId, today)])
      .then(([roomData, shopData, availData]) => {
        if (!alive) return;
        setRoom(roomData);
        setShop(shopData);
        setAvailability(availData);
      })
      .catch((err) => { if (alive) setLoadError(err.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const todayHours = useMemo(() => {
    if (!shop?.hours?.length) return { open_hour: 0, close_hour: 24 };
    const dow = new Date().getDay();
    return shop.hours.find((h) => Number(h.day_of_week) === dow) || shop.hours[0];
  }, [shop]);

  const slotTimes = useMemo(() => {
    const open = Number(todayHours.open_hour ?? 0);
    const close = Number(todayHours.close_hour ?? 24);
    const times = [];
    for (let h = open; h < close; h++) {
      times.push(`${String(h).padStart(2, '0')}:00`);
      times.push(`${String(h).padStart(2, '0')}:30`);
    }
    return times;
  }, [todayHours]);

  const order = useMemo(() => new Map(slotTimes.map((t, i) => [t, i])), [slotTimes]);

  const bookedTimes = useMemo(() => {
    const set = new Set();
    availability.forEach((b) => {
      const start = new Date(b.start_datetime);
      const end = new Date(b.end_datetime);
      slotTimes.forEach((t) => {
        const [h, m] = t.split(':').map(Number);
        const slotDate = new Date(start);
        slotDate.setHours(h, m, 0, 0);
        if (slotDate >= start && slotDate < end) set.add(t);
      });
    });
    return set;
  }, [availability, slotTimes]);

  const pastTimes = useMemo(() => new Set(slotTimes.filter((t) => isSlotPastBangkok(today, t))), [slotTimes, today, nowTick]);

  const startOrder = selectedStart ? order.get(selectedStart) : null;
  const endOrder = selectedEnd ? order.get(selectedEnd) : null;
  const inRange = (t) => {
    if (startOrder == null) return false;
    const o = order.get(t);
    if (endOrder != null) return o >= startOrder && o <= endOrder;
    return o === startOrder;
  };

  const selectSlot = (time, disabled) => {
    if (disabled) return;
    setSubmitError('');
    if (!selectedStart || selectedEnd) {
      setSelectedStart(time);
      setSelectedEnd(null);
      return;
    }
    if (time === selectedStart) { setSelectedStart(null); setSelectedEnd(null); return; }
    const so = order.get(selectedStart);
    const eo = order.get(time);
    if (eo > so) {
      const hasBookedBetween = slotTimes.some((t, i) => i > so && i <= eo && bookedTimes.has(t));
      if (hasBookedBetween) { setSelectedStart(time); setSelectedEnd(null); return; }
      setSelectedEnd(time);
    } else {
      setSelectedStart(time);
      setSelectedEnd(null);
    }
  };

  const rangeHasBooked = selectedStart
    ? slotTimes.some((t, i) => i >= startOrder && i <= (endOrder ?? startOrder) && bookedTimes.has(t))
    : false;

  const rangeHasPast = selectedStart
    ? slotTimes.some((t, i) => i >= startOrder && i <= (endOrder ?? startOrder) && pastTimes.has(t))
    : false;

  const rangeEndTime = selectedStart ? addMinutesToTime(selectedEnd || selectedStart, 30) : null;
  const slotCount = selectedStart ? ((endOrder ?? startOrder) - startOrder + 1) : 0;
  const durationHours = slotCount * 0.5;

  const selectedRangeLabel = selectedStart
    ? `${selectedStart} - ${rangeEndTime} น. (${durationHours} ชม.)`
    : 'ยังไม่ได้เลือกเวลา — คลิกเลือกเวลาเริ่มและเวลาสิ้นสุด';

  const pricePreview = useMemo(() => {
    if (!selectedStart || !room) return { basePrice: 0, peakSurchargeTotal: 0, priceTotal: 0 };
    const startDatetime = `${today}T${selectedStart}:00`;
    // ใช้จำนวนช่วง (slotCount * 30 นาที) บวกจาก startDatetime โดยตรง แทนการต่อสตริงเวลาที่ wrap ข้ามเที่ยงคืนแล้ว
    // (ถ้าช่วงสุดท้ายของวันคือ 23:30 การบวก 30 นาทีแบบ string จะได้ "00:00" ของวันเดิม ทำให้ end ก่อน start)
    const endDatetime = addMinutesToDateTime(startDatetime, slotCount * 30);
    return calculateBookingPrice({
      pricePerHour: Number(room.price_per_hour),
      peakStartTime: shop?.peak_start_time,
      peakSurcharge: Number(shop?.peak_surcharge || 0),
      startDatetime,
      endDatetime,
    });
  }, [selectedStart, slotCount, room, shop, today]);

  const confirmDisabled = !selectedStart || rangeHasBooked || rangeHasPast || submitting;

  const handleConfirm = async () => {
    if (confirmDisabled) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const startDatetime = `${today}T${selectedStart}:00`;
      const endDatetime = addMinutesToDateTime(startDatetime, slotCount * 30);
      const booking = await api.createBooking({
        customerId: customer.user_id,
        roomId: Number(roomId),
        startDatetime,
        endDatetime,
        guestCount: room.capacity || null,
      });
      navigate(`/pay/${booking.booking_id}`, { state: { booking, room } });
    } catch (err) {
      setSubmitError(err.message);
      // รีเฟรชช่วงเวลาที่ถูกจองแล้ว เผื่อชนกับรายการใหม่ (exclusion constraint)
      api.getRoomAvailability(roomId, today).then(setAvailability).catch(() => {});
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-dark app-dark container-md"><p style={{ color: 'var(--text-muted)' }}>กำลังโหลด...</p></div>;
  }
  if (loadError || !room) {
    return (
      <div className="page-dark app-dark container-md">
        <p className="field-error">{loadError || 'ไม่พบห้อง'}</p>
        <Link to="/" style={{ color: 'var(--primary-400)' }}>กลับหน้าเลือกห้อง</Link>
      </div>
    );
  }

  const openHour = Number(todayHours.open_hour ?? 0);
  const closeHour = Number(todayHours.close_hour ?? 24);
  const dow = new Date().getDay();
  const shopHoursLabel = (openHour === 0 && closeHour === 24)
    ? `ตลอด 24 ชั่วโมง (วัน${DAY_LABELS[dow]})`
    : `${String(openHour).padStart(2, '0')}:00 - ${String(closeHour).padStart(2, '0')}:00 น. (วัน${DAY_LABELS[dow]})`;

  return (
    <div className="page-dark app-dark">
      <header className="topbar" style={{ gap: 12, justifyContent: 'flex-start' }}>
        <IconButton label="ย้อนกลับ" onClick={() => navigate('/')}><ArrowLeft /></IconButton>
        <span style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-strong)' }}>จองห้อง: {room.room_name}</span>
      </header>

      <div className="container-md booking-layout">
        <Card pad={false} style={{ position: 'sticky', top: 80 }}>
          <div className="room-photo" style={{ aspectRatio: ROOM_PHOTO_ASPECT_RATIO, backgroundImage: `url(${resolveRoomImage(room)})` }} />
          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-strong)' }}>{room.room_name}</span>
            <span className="tag tag-neutral" style={{ width: 'fit-content' }}>{SIZE_CAPACITY_LABEL[room.size] || `ความจุ ${room.capacity} คน`}</span>
            {roomNoteLines(room.description).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {roomNoteLines(room.description).map((line, i) => (
                  <span key={i} className="tag tag-success">{line}</span>
                ))}
              </div>
            )}
            <div style={{ borderTop: '1px solid var(--divider)', marginTop: 4, paddingTop: 12 }}>
              <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>ราคา</div>
              <div className="num" style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--green-700)' }}>
                {money(room.price_per_hour)} บาท<span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 400 }}>/ชม.</span>
              </div>
            </div>
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-strong)' }}>วันนี้ · {formatThaiDate(today)}</span>
              <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>เปิดบริการ {shopHoursLabel}</span>
            </div>
          </Card>

          <Card title="เลือกเวลา" subtitle="คลิกเลือกเวลาเริ่ม แล้วคลิกอีกครั้งเพื่อเลือกเวลาสิ้นสุด (ทีละ 30 นาที)">
            <div className="slot-grid">
              {slotTimes.map((t) => {
                const isBooked = bookedTimes.has(t);
                const isPast = pastTimes.has(t);
                const disabled = isBooked || isPast;
                const selected = inRange(t);
                const title = isBooked ? 'จองไปแล้ว' : isPast ? 'เวลาผ่านไปแล้ว' : undefined;
                return (
                  <button
                    key={t}
                    type="button"
                    className={`slot-btn${selected ? ' selected' : ''}`}
                    disabled={disabled}
                    title={title}
                    onClick={() => selectSlot(t, disabled)}
                  >
                    {t}
                  </button>
                );
              })}
              {!slotTimes.length && <p style={{ color: 'var(--text-muted)' }}>ร้านปิดให้บริการวันนี้</p>}
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>ช่วงเวลาที่เลือก</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-strong)' }}>{selectedRangeLabel}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>ยอดรวมโดยประมาณ</div>
                  <div className="num" style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-strong)' }}>
                    {money(pricePreview.priceTotal)} บาท
                  </div>
                  {pricePreview.peakSurchargeTotal > 0 && (
                    <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--amber-600)', marginTop: 2 }}>
                      รวมค่าพีคไทม์ +{money(pricePreview.peakSurchargeTotal)} บาท
                    </div>
                  )}
                </div>
              </div>
              {rangeHasBooked && <div className="field-error">ช่วงเวลานี้มีบางส่วนถูกจองแล้ว กรุณาเลือกใหม่</div>}
              {!rangeHasBooked && rangeHasPast && <div className="field-error">ช่วงเวลานี้ผ่านไปแล้ว กรุณาเลือกเวลาอื่น</div>}
              {submitError && <div className="field-error">{submitError}</div>}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--divider)', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', lineHeight: 1.5, maxWidth: 300 }}>
                  ยกเลิกได้ล่วงหน้าก่อนเวลาเริ่ม 1 ชั่วโมง — มัดจำไม่สามารถขอคืนได้ทุกกรณี
                </div>
                <Button variant="accent" size="md" disabled={confirmDisabled} onClick={handleConfirm} iconRight={<ArrowRight />}>
                  {submitting ? 'กำลังบันทึก...' : 'ยืนยันและชำระมัดจำ'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
