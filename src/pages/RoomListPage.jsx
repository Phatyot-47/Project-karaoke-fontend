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
import { money, roomNoteLines } from '../utils/format.js';

export default function RoomListPage() {
  const [rooms, setRooms] = useState([]);
  const [size, setSize] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.listRooms(size)
      .then((data) => { if (alive) setRooms(data); })
      .catch((err) => { if (alive) setError(err.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [size]);

  const filteredRooms = useMemo(
    () => rooms.filter((r) => r.room_name.toLowerCase().includes(search.trim().toLowerCase())),
    [rooms, search]
  );

  return (
    <div className="container-lg">
      <h1 style={{ fontSize: 'var(--text-xl)' }}>เลือกห้องคาราโอเกะ</h1>
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>
        เลือกห้องที่ว่าง แล้วจองเวลาได้ทันที
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 220px', minWidth: 180 }}>
          <Input placeholder="ค้นหาชื่อห้อง" icon={<Search />} value={search} onChange={(e) => setSearch(e.target.value)} />
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
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          แสดง {filteredRooms.length} ห้องที่ว่าง
        </span>
      </div>

      {error && <div className="field-error" style={{ marginTop: 16 }}>{error}</div>}
      {loading && <p style={{ color: 'var(--text-muted)', marginTop: 24 }}>กำลังโหลด...</p>}

      <div className="room-grid">
        {filteredRooms.map((room) => (
          <Card key={room.room_id} pad={false}>
            <div className="room-photo" style={{ aspectRatio: ROOM_PHOTO_ASPECT_RATIO, backgroundImage: `url(${resolveRoomImage(room)})` }} />
            <div className="room-card-body">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-strong)' }}>{room.room_name}</span>
                <Tag tone="neutral" size="sm">{SIZE_CAPACITY_LABEL[room.size] || `ความจุ ${room.capacity} คน`}</Tag>
              </div>
              {!room.is_active && <Tag tone="danger" dot size="sm">ปิดให้บริการชั่วคราว</Tag>}
              {roomNoteLines(room.description).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {roomNoteLines(room.description).map((line, i) => (
                    <Tag key={i} tone="success" size="sm">{line}</Tag>
                  ))}
                </div>
              )}
              <div>
                <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>ราคาเริ่มต้น</div>
                <div className="num" style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--green-700)' }}>
                  {money(room.price_per_hour)} บาท
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 400 }}>/ชม.</span>
                </div>
              </div>
              <Button variant="accent" block disabled={!room.is_active} onClick={() => navigate(`/book/${room.room_id}`)}>
                {room.is_active ? 'จองห้องนี้' : 'ปิดให้บริการ'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
