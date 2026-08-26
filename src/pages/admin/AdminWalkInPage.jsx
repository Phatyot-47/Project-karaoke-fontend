import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import Select from '../../components/Select.jsx';
import { Check } from '../../components/Icons.jsx';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { todayISODate, addMinutesToTime, addMinutesToDateTime, timeToMinutes, isSlotPastBangkok, formatTimeHM, DAY_LABELS } from '../../utils/format.js';
import useNowTick from '../../hooks/useNowTick.js';

export default function AdminWalkInPage() {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [roomId, setRoomId] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  // บังคับ re-render ทุก 30s ให้ "สถานะห้องตอนนี้" และช่วงเวลาที่ผ่านไปแล้วอัปเดตตามเวลาจริง
  const nowTick = useNowTick();

  // silent: true = รีเฟรชเงียบๆ (โพลลิ่งพื้นหลัง) ไม่โชว์ "กำลังโหลด..." ทับหน้าจอ
  const load = ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    Promise.all([api.getTodayBookings(), api.listAdminRooms(), api.getShop()])
      .then(([today, roomList, shopData]) => {
        setBookings(today.bookings);
        setRooms(roomList);
        setShop(shopData);
      })
      .catch((err) => setError(err.message))
      .finally(() => { if (!silent) setLoading(false); });
  };

  // โหลดครั้งแรก + รีเฟรชอัตโนมัติทุก 15 วิ ให้สถานะห้องเป็นเรียลไทม์
  useEffect(() => {
    load();
    const interval = setInterval(() => load({ silent: true }), 15000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // เวลาเปิด-ปิดร้านของ "วันนี้" ตาม day_of_week (0=อาทิตย์...6=เสาร์) จากการตั้งค่าร้าน (ตั้งค่าร้าน > เวลาเปิด-ปิด)
  const todayHours = useMemo(() => {
    if (!shop?.hours?.length) return null;
    const dow = new Date().getDay();
    return shop.hours.find((h) => Number(h.day_of_week) === dow) || shop.hours[0];
  }, [shop]);

  // ช่วงเวลาที่เลือกได้ (ทุกครึ่งชม.) เฉพาะภายในเวลาเปิด-ปิดร้านวันนี้เท่านั้น — เดียวกับที่หน้าจองของลูกค้าใช้
  const slotTimes = useMemo(() => {
    if (!todayHours) return [];
    const open = Number(todayHours.open_hour ?? 0);
    const close = Number(todayHours.close_hour ?? 24);
    const times = [];
    for (let h = open; h < close; h++) {
      times.push(`${String(h).padStart(2, '0')}:00`);
      times.push(`${String(h).padStart(2, '0')}:30`);
    }
    return times;
  }, [todayHours]);

  const endOptions = useMemo(() => slotTimes.map((t) => addMinutesToTime(t, 30)), [slotTimes]);

  const lockedStartTimes = useMemo(() => new Set(slotTimes.filter((t) => isSlotPastBangkok(todayISODate(), t))), [slotTimes, nowTick]);

  // ปล่อยเวลาว่างไว้จนกว่าแอดมินจะเลือกเอง — เคลียร์เฉพาะตอนที่ค่าที่เลือกไว้ใช้ไม่ได้แล้ว (เช่น เวลาเลยไปแล้ว หรือเวลาร้านเปลี่ยน)
  useEffect(() => {
    setStart((prev) => (prev === '' || slotTimes.includes(prev) ? prev : ''));
  }, [slotTimes]);

  useEffect(() => {
    setEnd((prev) => (prev === '' || endOptions.includes(prev) ? prev : ''));
  }, [endOptions]);

  // เปลี่ยนห้อง = เริ่มเลือกเวลาใหม่เสมอ ไม่เอาช่วงเวลาที่เลือกไว้จากห้องก่อนหน้ามาใช้ต่อ
  useEffect(() => {
    setStart('');
    setEnd('');
  }, [roomId]);

  const order = useMemo(() => new Map(slotTimes.map((t, i) => [t, i])), [slotTimes]);
  const startOrder = start ? order.get(start) : null;
  const selectedEndSlot = end ? addMinutesToTime(end, -30) : null;
  const endOrder = selectedEndSlot != null ? order.get(selectedEndSlot) : null;
  const inRange = (t) => {
    if (startOrder == null) return false;
    const o = order.get(t);
    if (endOrder != null) return o >= startOrder && o <= endOrder;
    return o === startOrder;
  };

  // คลิกเลือกเวลาเริ่ม แล้วคลิกอีกครั้งเพื่อเลือกเวลาสิ้นสุด — แบบเดียวกับหน้าจองของลูกค้า (BookingPage)
  const selectSlot = (time, disabled) => {
    if (disabled) return;
    setFormError('');
    if (!start || end) {
      setStart(time);
      setEnd('');
      return;
    }
    if (time === start) { setStart(''); setEnd(''); return; }
    const so = order.get(start);
    const eo = order.get(time);
    if (eo > so) {
      const daySlots = roomDaySchedule.get(Number(roomId)) || [];
      const hasBlockedBetween = daySlots.some((s, i) => i > so && i <= eo && (s.status || s.isPast));
      if (hasBlockedBetween) { setStart(time); setEnd(''); return; }
      setEnd(addMinutesToTime(time, 30));
    } else {
      setStart(time);
      setEnd('');
    }
  };

  // ต่อวันที่ + เวลาสิ้นสุดให้เป็น datetime จริง — ถ้าเวลาสิ้นสุด <= เวลาเริ่ม (เช่น ร้านเปิดถึงเที่ยงคืน
  // เลือกช่วงสุดท้าย 23:30-00:00) แปลว่าข้ามไปวันถัดไปแล้ว ไม่ใช่ 00:00 ของวันเดิม (ซึ่งจะอยู่ก่อน start)
  const endDatetime = (dateStr, startTime, endTime) => {
    const startDatetime = `${dateStr}T${startTime}:00`;
    let deltaMinutes = timeToMinutes(endTime) - timeToMinutes(startTime);
    if (deltaMinutes <= 0) deltaMinutes += 24 * 60;
    return addMinutesToDateTime(startDatetime, deltaMinutes);
  };

  // สถานะห้องว่าง/ไม่ว่างสำหรับช่วงเวลาที่แอดมินกำลังจะจองวอล์คอินให้ — เทียบกับรายการจองวันนี้ที่โหลดมาแล้ว
  const roomAvailability = useMemo(() => {
    const map = new Map();
    if (!start || !end) return map;
    const today = todayISODate();
    const selStart = new Date(`${today}T${start}:00`);
    const selEnd = new Date(endDatetime(today, start, end));
    if (!(selStart < selEnd)) return map;
    rooms.forEach((r) => {
      const conflict = bookings.find((b) => (
        b.room_id === r.room_id
        && (b.booking_status === 'pending' || b.booking_status === 'confirmed')
        && new Date(b.start_datetime) < selEnd
        && new Date(b.end_datetime) > selStart
      ));
      map.set(r.room_id, { available: !conflict, conflict });
    });
    return map;
  }, [rooms, bookings, start, end]);

  // ตารางเวลาห้องช่วงที่ร้านเปิด (ทุกครึ่งชม.) — ใช้วาดแถบสถานะว่าง/ไม่ว่างของแต่ละห้อง
  const roomDaySchedule = useMemo(() => {
    const today = todayISODate();
    const map = new Map();
    rooms.forEach((r) => {
      const slots = slotTimes.map((t) => {
        const slotStart = new Date(`${today}T${t}:00`);
        const slotEnd = new Date(slotStart.getTime() + 30 * 60000);
        const booking = bookings.find((b) => (
          b.room_id === r.room_id
          && (b.booking_status === 'pending' || b.booking_status === 'confirmed')
          && new Date(b.start_datetime) < slotEnd
          && new Date(b.end_datetime) > slotStart
        ));
        return { time: t, isPast: lockedStartTimes.has(t), status: booking ? booking.booking_status : null };
      });
      map.set(r.room_id, slots);
    });
    return map;
  }, [rooms, bookings, slotTimes, lockedStartTimes]);

  // สถานะห้อง ณ เวลานี้จริงๆ (ไม่ผูกกับช่วงเวลาที่เลือกในฟอร์ม) — ใช้กับการ์ดสรุปด้านบนสุด
  // เขียว = ว่างตอนนี้ / ส้ม = ไม่ว่างตอนนี้แต่ยังมีช่วงว่างเหลือวันนี้ / แดง = จองเต็มวัน ไม่มีช่วงว่างเหลือแล้ว
  const roomCurrentStatus = useMemo(() => {
    const now = new Date();
    const map = new Map();
    rooms.forEach((r) => {
      const roomBookings = bookings.filter((b) => (
        b.room_id === r.room_id && (b.booking_status === 'pending' || b.booking_status === 'confirmed')
      ));
      const daySlots = roomDaySchedule.get(r.room_id) || [];
      const remainingSlots = daySlots.filter((s) => !s.isPast);
      const fullyBooked = remainingSlots.length > 0 && remainingSlots.every((s) => s.status);
      const current = roomBookings.find((b) => new Date(b.start_datetime) <= now && new Date(b.end_datetime) > now);
      if (current) {
        map.set(r.room_id, { busy: true, fullyBooked, until: current.end_datetime });
        return;
      }
      const next = roomBookings
        .filter((b) => new Date(b.start_datetime) > now)
        .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime))[0];
      map.set(r.room_id, { busy: false, fullyBooked: false, nextStart: next ? next.start_datetime : null });
    });
    return map;
  }, [rooms, bookings, roomDaySchedule, nowTick]);

  const submit = async () => {
    setSuccessMsg('');
    if (!roomId) { setFormError('กรุณาเลือกห้อง'); return; }
    if (!start || !end) { setFormError('กรุณาเลือกเวลาเริ่มและเวลาสิ้นสุด'); return; }
    if (lockedStartTimes.has(start)) { setFormError('เวลาที่เลือกผ่านไปแล้ว กรุณาเลือกเวลาใหม่'); return; }
    const avail = roomAvailability.get(Number(roomId));
    if (avail && avail.available === false) {
      setFormError('ห้องนี้ไม่ว่างในช่วงเวลาที่เลือก กรุณาเลือกห้องหรือเวลาอื่น');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const today = todayISODate();
      await api.createWalkInBooking({
        roomId: Number(roomId),
        startDatetime: `${today}T${start}:00`,
        endDatetime: endDatetime(today, start, end),
        customerName: customerName.trim() || 'ลูกค้าหน้าร้าน',
        customerPhone: customerPhone.trim() || null,
        adminUserId: admin.user_id,
      });
      setCustomerName('');
      setCustomerPhone('');
      setSuccessMsg('เพิ่มรายการจองวอล์คอินสำเร็จ');
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && <div className="field-error">{error}</div>}

      <Card title="สถานะห้องตอนนี้">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          {rooms.map((r) => {
            const status = roomCurrentStatus.get(r.room_id) || {};
            const { busy: isBusy, fullyBooked } = status;
            const tone = fullyBooked ? 'red' : isBusy ? 'amber' : 'green';
            const palette = {
              red: { bg: 'var(--red-50)', border: 'var(--red-500)', text: 'var(--red-600)' },
              amber: { bg: 'var(--amber-50)', border: 'var(--amber-400)', text: 'var(--amber-600)' },
              green: { bg: 'var(--green-50)', border: 'var(--green-500)', text: 'var(--green-700)' },
            }[tone];
            const label = fullyBooked ? 'จองเต็มวัน' : isBusy ? 'ไม่ว่างตอนนี้' : 'ว่างตอนนี้';
            const detail = fullyBooked
              ? 'ไม่มีช่วงว่างเหลือวันนี้'
              : isBusy
                ? `ถึง ${formatTimeHM(status.until)} น.`
                : (status.nextStart ? `ว่างถึง ${formatTimeHM(status.nextStart)} น.` : 'ว่างตลอดวันนี้');
            const isSelected = Number(roomId) === r.room_id;
            return (
              <div
                key={r.room_id}
                className="stat-card"
                role="button"
                tabIndex={0}
                onClick={() => setRoomId(String(r.room_id))}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setRoomId(String(r.room_id)); }}
                style={{
                  background: palette.bg,
                  border: `1px solid ${palette.border}`,
                  borderLeft: `4px solid ${palette.border}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  outline: isSelected ? '2px solid var(--primary-500)' : 'none',
                  outlineOffset: -2,
                  minWidth: 0,
                  flex: 'none',
                  padding: '12px 14px',
                }}
              >
                <div className="label" style={{ fontWeight: 600 }}>{r.room_name}</div>
                <div className="value" style={{ fontSize: 'var(--text-md)', color: palette.text }}>
                  {label}
                </div>
                <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', marginTop: 4 }}>
                  {detail}
                </div>
              </div>
            );
          })}
          {!loading && !rooms.length && <p style={{ color: 'var(--text-muted)' }}>ยังไม่มีข้อมูลห้อง</p>}
        </div>
      </Card>

      <Card
        title="เพิ่มรายการจองวอล์คอิน"
        subtitle={
          todayHours
            ? `สำหรับลูกค้าที่มาจองหน้าร้านโดยตรง — ร้านเปิดวันนี้ (${DAY_LABELS[new Date().getDay()]}) เวลา ${String(todayHours.open_hour).padStart(2, '0')}:00–${String(todayHours.close_hour).padStart(2, '0')}:00 น.`
            : 'สำหรับลูกค้าที่มาจองหน้าร้านโดยตรง'
        }
      >
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px', minWidth: 160 }}>
            <Select label="ห้อง" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
              <option value="" disabled>เลือกห้อง</option>
              {rooms.map((r) => {
                const avail = roomAvailability.get(r.room_id);
                const busy = avail && avail.available === false;
                return (
                  <option key={r.room_id} value={r.room_id} disabled={busy}>
                    {r.room_name}{busy ? ' — ไม่ว่างช่วงนี้' : ''}
                  </option>
                );
              })}
            </Select>
          </div>
          <div style={{ flex: '1 1 160px', minWidth: 140 }}>
            <Input label="ชื่อลูกค้า" placeholder="เช่น คุณสมชาย" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div style={{ flex: '1 1 160px', minWidth: 140 }}>
            <Input label="เบอร์โทร (ถ้ามี)" placeholder="08x-xxx-xxxx" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: 'auto' }}>
            <Button variant="outline" onClick={() => navigate('/admin/bookings')}>ยกเลิก</Button>
            <Button
              variant="accent"
              iconLeft={<Check />}
              onClick={submit}
              disabled={submitting || !slotTimes.length || !roomId || !start || !end || lockedStartTimes.has(start)}
            >
              เพิ่มรายการจอง
            </Button>
          </div>
        </div>

        {!loading && shop && !slotTimes.length && (
          <div className="field-error" style={{ marginTop: 8 }}>ร้านปิดวันนี้ตามการตั้งค่าร้าน จึงยังไม่สามารถเพิ่มรายการจองวอล์คอินได้</div>
        )}

        <div style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-strong)' }}>
              เวลาว่างของห้องนี้ (เรียลไทม์)
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {start && end ? `ช่วงที่เลือก ${start}–${end}` : 'คลิกเลือกเวลาเริ่ม แล้วคลิกอีกครั้งเพื่อเลือกเวลาสิ้นสุด (ทีละ 30 นาที)'}
            </span>
          </div>
          {!roomId && <p style={{ color: 'var(--text-muted)' }}>เลือกห้องก่อนเพื่อดูเวลาว่าง</p>}
          {roomId && (
            <div className="slot-grid">
              {(roomDaySchedule.get(Number(roomId)) || []).map((s) => {
                const disabled = !!s.status || s.isPast;
                const selected = inRange(s.time);
                const title = s.status ? (s.status === 'confirmed' ? 'จองแล้ว' : 'รอดำเนินการ') : (s.isPast ? 'เวลาผ่านไปแล้ว' : undefined);
                return (
                  <button
                    key={s.time}
                    type="button"
                    className={`slot-btn${selected ? ' selected' : ''}`}
                    disabled={disabled}
                    title={title}
                    onClick={() => selectSlot(s.time, disabled)}
                  >
                    {s.time}
                  </button>
                );
              })}
              {!slotTimes.length && <p style={{ color: 'var(--text-muted)' }}>ร้านปิดให้บริการวันนี้</p>}
            </div>
          )}
        </div>

        {formError && <div className="field-error" style={{ marginTop: 8 }}>{formError}</div>}
        {successMsg && <div style={{ marginTop: 8, fontSize: 'var(--text-xs)', color: 'var(--green-700)' }}>{successMsg}</div>}
      </Card>
    </div>
  );
}
