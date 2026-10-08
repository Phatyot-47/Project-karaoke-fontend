import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card.jsx';
import Input from '../components/Input.jsx';
import Select from '../components/Select.jsx';
import Tag from '../components/Tag.jsx';
import Button from '../components/Button.jsx';
import { Search } from '../components/Icons.jsx';
import api from '../api/client.js';
import { resolveRoomImage, SIZE_CAPACITY_LABEL, ROOM_PHOTO_ASPECT_RATIO } from '../utils/roomImage.js';
import {
  money,
  roomNoteLines,
  todayISODate,
  addMinutesToDateTime,
  addMinutesToTime,
  isSlotPastBangkok,
  findTodayHours,
  buildHalfHourSlots,
} from '../utils/format.js';
import useNowTick from '../hooks/useNowTick.js';

export default function RoomListPage() {
  const [rooms, setRooms] = useState([]);
  const [shop, setShop] = useState(null);
  const [size, setSize] = useState('all');
  const [search, setSearch] = useState('');
  // ค้นหาห้องว่างตามเวลา/ระยะเวลา (จองได้เฉพาะวันนี้) — searchStart ว่าง = ไม่กรองตามเวลา
  const [searchStart, setSearchStart] = useState('');
  const [durationSlots, setDurationSlots] = useState(2);
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const nowTick = useNowTick();

  const today = todayISODate();

  useEffect(() => {
    api
      .getShop()
      .then(setShop)
      .catch(() => {});
  }, []);

  // ช่วงเวลาเริ่มที่เลือกค้นหาได้ = ทุกครึ่งชม. ภายในเวลาเปิด-ปิดร้านวันนี้ ที่ยังไม่ผ่านไป
  const startOptions = useMemo(() => {
    const hours = findTodayHours(shop?.hours);
    if (!hours) return [];
    const slots = buildHalfHourSlots(Number(hours.open_hour), Number(hours.close_hour));
    return slots
      .map((t, i) => ({ time: t, slotsLeft: slots.length - i }))
      .filter((s) => !isSlotPastBangkok(today, s.time));
  }, [shop, today, nowTick]);

  // ระยะเวลาสูงสุดที่เลือกได้ = ไม่เกินเวลาปิดร้าน
  const maxSlots = startOptions.find((s) => s.time === searchStart)?.slotsLeft ?? 0;

  useEffect(() => {
    if (searchStart && !startOptions.some((s) => s.time === searchStart)) setSearchStart('');
  }, [startOptions, searchStart]);

  useEffect(() => {
    if (maxSlots && durationSlots > maxSlots) setDurationSlots(maxSlots);
  }, [maxSlots, durationSlots]);

  const range = useMemo(() => {
    if (!searchStart) return null;
    const start = `${today}T${searchStart}:00`;
    return { start, end: addMinutesToDateTime(start, durationSlots * 30) };
  }, [searchStart, durationSlots, today]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    api
      .listRooms(size, range?.start, range?.end)
      .then((data) => {
        if (alive) setRooms(data);
      })
      .catch((err) => {
        if (alive) setError(err.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [size, range]);

  const filteredRooms = useMemo(
    () => rooms.filter((r) => r.room_name.toLowerCase().includes(search.trim().toLowerCase())),
    [rooms, search],
  );

  // ระหว่างโหลดผลค้นหาช่วงเวลาใหม่ ข้อมูลห้องชุดเดิมยังไม่มี is_available → ถือว่า "ยังไม่รู้" ไม่ใช่ "ไม่ว่าง"
  const searching = Boolean(range) && (loading || rooms.some((r) => r.is_available === undefined));
  const availableCount = range ? filteredRooms.filter((r) => r.is_available).length : filteredRooms.length;

  const bookRoom = (room) => {
    navigate(`/book/${room.room_id}`, range ? { state: { start: searchStart, durationSlots } } : undefined);
  };

  return (
    <div className="container-lg">
      <h1 style={{ fontSize: 'var(--text-xl)' }}>เลือกห้องคาราโอเกะ</h1>
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>
        เลือกห้องที่ว่าง แล้วจองเวลาได้ทันที (จองได้เฉพาะวันนี้)
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 220px', minWidth: 180 }}>
          <Input
            placeholder="ค้นหาชื่อห้อง"
            icon={<Search />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ flex: '0 1 180px', minWidth: 140 }}>
          <Select value={size} onChange={(e) => setSize(e.target.value)}>
            <option value="all">ขนาดห้อง: ทั้งหมด</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
          </Select>
        </div>
        <div style={{ flex: '0 1 170px', minWidth: 140 }}>
          <Select value={searchStart} onChange={(e) => setSearchStart(e.target.value)}>
            <option value="">เวลาเริ่ม: ทุกเวลา</option>
            {startOptions.map((s) => (
              <option key={s.time} value={s.time}>
                เริ่ม {s.time} น.
              </option>
            ))}
          </Select>
        </div>
        <div style={{ flex: '0 1 150px', minWidth: 120 }}>
          <Select
            value={durationSlots}
            onChange={(e) => setDurationSlots(Number(e.target.value))}
            disabled={!searchStart}
          >
            {Array.from({ length: Math.max(maxSlots, 1) }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n * 0.5} ชม.
              </option>
            ))}
          </Select>
        </div>
        {shop?.floor_plan_url && (
          <Button variant="outline" onClick={() => setShowFloorPlan((v) => !v)}>
            {showFloorPlan ? 'ซ่อนแผนผังห้อง' : 'ดูแผนผังห้อง'}
          </Button>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {searching
            ? 'กำลังตรวจสอบห้องว่าง...'
            : range
              ? `ว่าง ${availableCount} จาก ${filteredRooms.length} ห้อง (${searchStart}–${addMinutesToTime(searchStart, durationSlots * 30)} น.)`
              : `แสดง ${filteredRooms.length} ห้อง`}
        </span>
      </div>

      {showFloorPlan && shop?.floor_plan_url && (
        <Card title="แผนผังห้องของร้าน" style={{ marginTop: 16 }}>
          <img
            src={shop.floor_plan_url}
            alt="แผนผังห้องของร้าน"
            style={{ width: '100%', maxHeight: 520, objectFit: 'contain' }}
          />
        </Card>
      )}

      {error && (
        <div className="field-error" style={{ marginTop: 16 }}>
          {error}
        </div>
      )}
      {loading && <p style={{ color: 'var(--text-muted)', marginTop: 24 }}>กำลังโหลด...</p>}

      <div className="room-grid">
        {filteredRooms.map((room) => {
          const unavailable = range && room.is_available === false;
          return (
            <Card key={room.room_id} pad={false}>
              <div
                className="room-photo"
                style={{ aspectRatio: ROOM_PHOTO_ASPECT_RATIO, backgroundImage: `url(${resolveRoomImage(room)})` }}
              />
              <div className="room-card-body">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-strong)' }}>
                    {room.room_name}
                  </span>
                  <Tag tone="neutral" size="sm">
                    {SIZE_CAPACITY_LABEL[room.size] || `ความจุ ${room.capacity} คน`}
                  </Tag>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {room.theme && (
                    <Tag tone="info" size="sm">
                      ธีม: {room.theme}
                    </Tag>
                  )}
                  {range &&
                    room.is_available !== undefined &&
                    (room.is_available ? (
                      <Tag tone="success" dot size="sm">
                        ว่างช่วงเวลานี้
                      </Tag>
                    ) : (
                      <Tag tone="danger" dot size="sm">
                        ไม่ว่างช่วงเวลานี้
                      </Tag>
                    ))}
                </div>
                {!room.is_active && (
                  <Tag tone="danger" dot size="sm">
                    ปิดให้บริการชั่วคราว
                  </Tag>
                )}
                {roomNoteLines(room.description).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {roomNoteLines(room.description).map((line, i) => (
                      <Tag key={i} tone="success" size="sm">
                        {line}
                      </Tag>
                    ))}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>ราคาเริ่มต้น</div>
                  <div
                    className="num"
                    style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--green-700)' }}
                  >
                    {money(room.price_per_hour)} บาท
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 400 }}>
                      /ชม.
                    </span>
                  </div>
                </div>
                <Button variant="accent" block disabled={!room.is_active || unavailable} onClick={() => bookRoom(room)}>
                  {!room.is_active ? 'ปิดให้บริการ' : unavailable ? 'ไม่ว่างช่วงเวลานี้' : 'จองห้องนี้'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
