import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Select from '../components/Select.jsx';
import IconButton from '../components/IconButton.jsx';
import { ArrowLeft, ArrowRight } from '../components/Icons.jsx';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { resolveRoomImage, capacityLabel, ROOM_PHOTO_ASPECT_RATIO } from '../utils/roomImage.js';
import { calculateBookingPrice } from '../utils/pricing.js';
import {
  todayISODate,
  formatThaiDate,
  formatDateTimeRange,
  cancellationNote,
  addMinutesToTime,
  addMinutesToDateTime,
  money,
  roomNoteLines,
  DAY_LABELS,
  isSlotPastBangkok,
  findTodayHours,
  buildHalfHourSlots,
} from '../utils/format.js';
import useNowTick from '../hooks/useNowTick.js';

// ช่วงเวลา (สตริงเวลาไทย naive) → ช่องเริ่ม "HH:MM" + จำนวนช่อง 30 นาที
function toSelection(startDatetime, endDatetime) {
  const toMin = (dt) => Number(dt.slice(11, 13)) * 60 + Number(dt.slice(14, 16));
  let minutes = toMin(endDatetime) - toMin(startDatetime);
  if (minutes <= 0) minutes += 24 * 60; // ช่วงสุดท้ายของวันที่จบ 00:00
  return { start: startDatetime.slice(11, 16), durationSlots: minutes / 30 };
}

/**
 * หน้าจองห้อง — /book/:roomId
 * โหมดแก้ไข /book/:roomId?edit=<bookingId>: ลูกค้าเปลี่ยนห้อง/เวลาของการจองที่ชำระมัดจำแล้ว (ภายในวันเดิม)
 * ใช้มัดจำที่จ่ายแล้วเป็นฐาน ถ้ามัดจำของห้อง/เวลาใหม่สูงกว่าต้องจ่ายส่วนต่าง (ไปหน้าชำระเงินต่อ)
 */
export default function BookingPage() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { customer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [room, setRoom] = useState(null);
  const [shop, setShop] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  // ถ้ามาจากการค้นหาห้องว่างในหน้าเลือกห้อง (state.start + state.durationSlots) ให้เลือกช่วงเวลานั้นไว้ให้เลย
  const preset = location.state;
  const [selectedStart, setSelectedStart] = useState(preset?.start || null);
  const [selectedEnd, setSelectedEnd] = useState(
    preset?.start && preset.durationSlots > 1 ? addMinutesToTime(preset.start, (preset.durationSlots - 1) * 30) : null,
  );
  const [note, setNote] = useState('');
  // โหมดแก้ไข: การจองเดิม + รายการห้องให้เลือกเปลี่ยน
  const [editing, setEditing] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const nowTick = useNowTick();

  const today = todayISODate();

  useEffect(() => {
    if (!customer) {
      navigate('/login');
      return;
    }
    let alive = true;
    setLoading(true);
    Promise.all([
      api.getRoom(roomId),
      api.getShop(),
      api.getRoomAvailability(roomId, today),
      editId ? api.getBooking(editId) : null,
      editId ? api.listRooms() : [],
    ])
      .then(([roomData, shopData, availData, booking, roomList]) => {
        if (!alive) return;
        setRoom(roomData);
        setShop(shopData);
        setAvailability(availData);
        if (!editId) return;
        if (booking.customer_id !== customer.user_id) {
          setLoadError('ไม่พบรายการจองนี้');
          return;
        }
        setEditing(booking);
        setRooms(roomList);
        // ช่วงเวลาที่เลือกไว้: ที่เพิ่งเลือกก่อนสลับห้อง (state) หรือเวลาเดิมของการจองถ้าเป็นห้องเดิม
        const sel = location.state?.start
          ? location.state
          : booking.room_id === Number(roomId)
            ? toSelection(booking.start_datetime, booking.end_datetime)
            : null;
        setSelectedStart(sel?.start || null);
        setSelectedEnd(sel && sel.durationSlots > 1 ? addMinutesToTime(sel.start, (sel.durationSlots - 1) * 30) : null);
      })
      .catch((err) => {
        if (alive) setLoadError(err.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, editId]);

  const todayHours = useMemo(() => findTodayHours(shop?.hours) || { open_hour: 0, close_hour: 24 }, [shop]);

  const slotTimes = useMemo(
    () => buildHalfHourSlots(Number(todayHours.open_hour ?? 0), Number(todayHours.close_hour ?? 24)),
    [todayHours],
  );

  const order = useMemo(() => new Map(slotTimes.map((t, i) => [t, i])), [slotTimes]);

  const bookedTimes = useMemo(() => {
    const set = new Set();
    // โหมดแก้ไข: ช่วงเวลาของการจองตัวเองไม่นับว่าถูกจอง (เลือกเวลาเดิมหรือขยับทับเวลาเดิมได้)
    availability
      .filter((b) => String(b.booking_id) !== editId)
      .forEach((b) => {
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
  }, [availability, slotTimes, editId]);

  const pastTimes = useMemo(
    () => new Set(slotTimes.filter((t) => isSlotPastBangkok(today, t))),
    [slotTimes, today, nowTick], // eslint-disable-line react-hooks/exhaustive-deps -- nowTick: บังคับคำนวณใหม่ทุก 30 วิ ตามเวลาจริง
  );

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
    if (time === selectedStart) {
      setSelectedStart(null);
      setSelectedEnd(null);
      return;
    }
    const so = order.get(selectedStart);
    const eo = order.get(time);
    if (eo > so) {
      const hasBookedBetween = slotTimes.some((t, i) => i > so && i <= eo && bookedTimes.has(t));
      if (hasBookedBetween) {
        setSelectedStart(time);
        setSelectedEnd(null);
        return;
      }
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
  const slotCount = selectedStart ? (endOrder ?? startOrder) - startOrder + 1 : 0;
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

  // โหมดแก้ไข: มัดจำใหม่ = % ตามนโยบายของราคาใหม่ / จ่ายเพิ่มเฉพาะส่วนที่เกินยอดที่ชำระแล้ว (ไม่คืนเงิน)
  const paidAmount = Number(editing?.paid_amount || 0);
  const newDeposit = editing ? Math.round((pricePreview.priceTotal * Number(editing.deposit_percent)) / 100) : 0;
  const topUp = Math.max(0, newDeposit - paidAmount);

  const confirmDisabled = !selectedStart || rangeHasBooked || rangeHasPast || submitting;

  const changeRoom = (newRoomId) => {
    navigate(`/book/${newRoomId}?edit=${editId}`, {
      replace: true,
      state: selectedStart ? { start: selectedStart, durationSlots: slotCount } : null,
    });
  };

  const handleSaveEdit = async () => {
    if (confirmDisabled) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const startDatetime = `${today}T${selectedStart}:00`;
      const result = await api.editBooking(editId, {
        roomId: Number(roomId),
        startDatetime,
        endDatetime: addMinutesToDateTime(startDatetime, slotCount * 30),
      });
      navigate(result.topup_due > 0 ? `/pay/${editId}` : '/history', { replace: true });
    } catch (err) {
      setSubmitError(err.message);
      api
        .getRoomAvailability(roomId, today)
        .then(setAvailability)
        .catch(() => {});
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (confirmDisabled) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const startDatetime = `${today}T${selectedStart}:00`;
      const endDatetime = addMinutesToDateTime(startDatetime, slotCount * 30);
      const booking = await api.createBooking({
        roomId: Number(roomId),
        startDatetime,
        endDatetime,
        guestCount: room.capacity || null,
        note: note.trim() || undefined,
      });
      navigate(`/pay/${booking.booking_id}`, { state: { booking, room } });
    } catch (err) {
      setSubmitError(err.message);
      // รีเฟรชช่วงเวลาที่ถูกจองแล้ว เผื่อชนกับรายการใหม่ (exclusion constraint)
      api
        .getRoomAvailability(roomId, today)
        .then(setAvailability)
        .catch(() => {});
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-dark app-dark container-md">
        <p style={{ color: 'var(--text-muted)' }}>กำลังโหลด...</p>
      </div>
    );
  }
  if (loadError || !room) {
    return (
      <div className="page-dark app-dark container-md">
        <p className="field-error">{loadError || 'ไม่พบห้อง'}</p>
        <Link to="/" style={{ color: 'var(--primary-400)' }}>
          กลับหน้าเลือกห้อง
        </Link>
      </div>
    );
  }

  const openHour = Number(todayHours.open_hour ?? 0);
  const closeHour = Number(todayHours.close_hour ?? 24);
  const dow = new Date().getDay();
  const shopHoursLabel =
    openHour === 0 && closeHour === 24
      ? `ตลอด 24 ชั่วโมง (วัน${DAY_LABELS[dow]})`
      : `${String(openHour).padStart(2, '0')}:00 - ${String(closeHour).padStart(2, '0')}:00 น. (วัน${DAY_LABELS[dow]})`;

  return (
    <div className="page-dark app-dark">
      <header className="topbar" style={{ gap: 12, justifyContent: 'flex-start' }}>
        <IconButton label="ย้อนกลับ" onClick={() => navigate(editing ? '/history' : '/')}>
          <ArrowLeft />
        </IconButton>
        <span style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-strong)' }}>
          {editing ? 'แก้ไขการจอง' : 'จองห้อง'}: {room.room_name}
        </span>
      </header>

      <div className="container-md booking-layout">
        <Card pad={false} style={{ position: 'sticky', top: 80 }}>
          <div
            className="room-photo"
            style={{ aspectRatio: ROOM_PHOTO_ASPECT_RATIO, backgroundImage: `url(${resolveRoomImage(room)})` }}
          />
          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-strong)' }}>
              {room.room_name}
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span className="tag tag-neutral">{capacityLabel(room)}</span>
              <span className="tag tag-neutral">ประเภท {room.size}</span>
              {room.theme ? (
                <span className="tag tag-info">ห้องธีม: {room.theme}</span>
              ) : (
                <span className="tag tag-neutral">ห้องธรรมดา</span>
              )}
            </div>
            {roomNoteLines(room.description).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {roomNoteLines(room.description).map((line, i) => (
                  <span key={i} className="tag tag-success">
                    {line}
                  </span>
                ))}
              </div>
            )}
            <div style={{ borderTop: '1px solid var(--divider)', marginTop: 4, paddingTop: 12 }}>
              <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>ราคา</div>
              <div className="num" style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--green-700)' }}>
                {money(room.price_per_hour)} บาท
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 400 }}>/ชม.</span>
              </div>
            </div>
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-strong)' }}>
                วันนี้ · {formatThaiDate(today)}
              </span>
              <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
                เปิดบริการ {shopHoursLabel}
              </span>
            </div>
          </Card>

          {editing && (
            <Card
              title="เปลี่ยนห้อง"
              subtitle={`การจองเดิม: ${editing.room_name} ${formatDateTimeRange(editing.start_datetime, editing.end_datetime)}`}
            >
              <Select value={roomId} onChange={(e) => changeRoom(e.target.value)}>
                {rooms.map((r) => (
                  <option key={r.room_id} value={r.room_id}>
                    {r.room_name} ({money(r.price_per_hour)} บาท/ชม.)
                  </option>
                ))}
              </Select>
            </Card>
          )}

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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>ช่วงเวลาที่เลือก</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-strong)' }}>
                    {selectedRangeLabel}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>ยอดรวมโดยประมาณ</div>
                  <div
                    className="num"
                    style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-strong)' }}
                  >
                    {money(pricePreview.priceTotal)} บาท
                  </div>
                  {pricePreview.peakSurchargeTotal > 0 && (
                    <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--amber-600)', marginTop: 2 }}>
                      รวมค่าพีคไทม์ +{money(pricePreview.peakSurchargeTotal)} บาท
                    </div>
                  )}
                </div>
              </div>
              {editing && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: 8,
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-body)',
                    background: 'var(--surface-sunken)',
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <div>
                    มัดจำใหม่ ({Number(editing.deposit_percent)}%)
                    <div className="num" style={{ fontWeight: 700 }}>
                      {money(Math.max(newDeposit, paidAmount))} บาท
                    </div>
                  </div>
                  <div>
                    ชำระแล้ว
                    <div className="num" style={{ fontWeight: 700 }}>
                      {money(paidAmount)} บาท
                    </div>
                  </div>
                  <div>
                    ต้องชำระเพิ่ม
                    <div
                      className="num"
                      style={{ fontWeight: 700, color: topUp > 0 ? 'var(--amber-600)' : 'var(--green-700)' }}
                    >
                      {money(topUp)} บาท
                    </div>
                  </div>
                </div>
              )}
              {!editing && (
                <div className="field-wrap">
                  <label className="field-label" htmlFor="booking-note">
                    หมายเหตุถึงร้าน (ถ้ามี)
                  </label>
                  <textarea
                    id="booking-note"
                    className="field field-textarea"
                    placeholder="เช่น จัดวันเกิด, ขอไมค์เพิ่ม"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={300}
                  />
                </div>
              )}
              {rangeHasBooked && <div className="field-error">ช่วงเวลานี้มีบางส่วนถูกจองแล้ว กรุณาเลือกใหม่</div>}
              {!rangeHasBooked && rangeHasPast && (
                <div className="field-error">ช่วงเวลานี้ผ่านไปแล้ว กรุณาเลือกเวลาอื่น</div>
              )}
              {submitError && <div className="field-error">{submitError}</div>}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 10,
                  borderTop: '1px solid var(--divider)',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div
                  style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', lineHeight: 1.5, maxWidth: 300 }}
                >
                  {editing
                    ? 'มัดจำที่ชำระแล้วนำมาหักได้ ถ้ามัดจำใหม่ต่ำกว่าเดิมไม่คืนเงิน — การจองที่ต้องจ่ายเพิ่มจะรอร้านยืนยันอีกครั้ง'
                    : cancellationNote(shop?.policy)}
                </div>
                <Button
                  variant="accent"
                  size="md"
                  disabled={confirmDisabled}
                  onClick={editing ? handleSaveEdit : handleConfirm}
                  iconRight={<ArrowRight />}
                >
                  {submitting
                    ? 'กำลังบันทึก...'
                    : editing
                      ? topUp > 0
                        ? `บันทึกและชำระเพิ่ม ${money(topUp)} บาท`
                        : 'บันทึกการแก้ไข'
                      : 'ยืนยันและชำระมัดจำ'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
