import { useEffect, useState } from 'react';
import Card from '../../components/Card.jsx';
import Input from '../../components/Input.jsx';
import Select from '../../components/Select.jsx';
import Button from '../../components/Button.jsx';
import UploadSlot from '../../components/UploadSlot.jsx';
import { Check, Plus } from '../../components/Icons.jsx';
import api from '../../api/client.js';
import { resolveRoomImage, ROOM_PHOTO_WIDTH, ROOM_PHOTO_HEIGHT, ROOM_PHOTO_ASPECT_RATIO } from '../../utils/roomImage.js';

export default function AdminRoomSettingsPage() {
  const [rooms, setRooms] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [adding, setAdding] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    api.listAdminRooms()
      .then((data) => {
        setRooms(data);
        if (data.length) {
          const id = selectedId ?? data[0].room_id;
          setSelectedId(id);
          setDraft(data.find((r) => r.room_id === id) || data[0]);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectRoom = (room) => {
    setSelectedId(room.room_id);
    setDraft(room);
    setSaved(false);
    setConfirmingDelete(false);
  };

  const handleAddRoom = async () => {
    setAdding(true);
    setError('');
    try {
      const created = await api.createAdminRoom({ roomName: 'ห้องใหม่', size: 'S', capacity: 3, pricePerHour: 0 });
      setRooms((rs) => [...rs, created]);
      selectRoom(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteRoom = async () => {
    setDeleting(true);
    setError('');
    try {
      await api.deleteAdminRoom(draft.room_id);
      const remaining = rooms.filter((r) => r.room_id !== draft.room_id);
      setRooms(remaining);
      setConfirmingDelete(false);
      if (remaining.length) {
        selectRoom(remaining[0]);
      } else {
        setSelectedId(null);
        setDraft(null);
      }
    } catch (err) {
      setError(err.message);
      setConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const setField = (field) => (e) => setDraft((d) => ({ ...d, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await api.updateAdminRoom(draft.room_id, {
        roomName: draft.room_name,
        size: draft.size,
        capacity: Number(draft.capacity),
        pricePerHour: Number(draft.price_per_hour),
        imageUrl: draft.image_url,
        isActive: draft.is_active,
        description: draft.description ?? '',
      });
      setRooms((rs) => rs.map((r) => (r.room_id === updated.room_id ? updated : r)));
      setDraft(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>กำลังโหลด...</p>;

  return (
    <div style={{ maxWidth: 1900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(720px, 1fr) minmax(0, 2fr)', gap: 26, alignItems: 'start' }}>
      <Card
        title={`ห้องทั้งหมด (${rooms.length} ห้อง)`}
        actions={<Button variant="primary" size="sm" iconLeft={<Plus />} onClick={handleAddRoom} disabled={adding}>เพิ่มห้อง</Button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {rooms.map((r) => (
            <button
              key={r.room_id}
              type="button"
              className={`room-settings-list-item${r.room_id === selectedId ? ' active' : ''}`}
              onClick={() => selectRoom(r)}
            >
              {r.room_name}
            </button>
          ))}
          {!rooms.length && <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>ยังไม่มีห้อง กดปุ่ม "เพิ่มห้อง" เพื่อเริ่มต้น</p>}
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && <div className="field-error">{error}</div>}

        {!draft ? (
          <Card><p style={{ color: 'var(--text-muted)' }}>เลือกห้องทางซ้าย หรือกดปุ่ม "เพิ่มห้อง" เพื่อเริ่มตั้งค่าห้องใหม่</p></Card>
        ) : (
        <>
        <Card title="ข้อมูลพื้นฐาน">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <Input label="ชื่อห้อง" value={draft.room_name} onChange={setField('room_name')} />
            </div>
            <Select label="ขนาดห้อง" value={draft.size} onChange={setField('size')}>
              <option value="S">S — เล็ก</option>
              <option value="M">M — กลาง</option>
              <option value="L">L — ใหญ่</option>
              <option value="XL">XL — ใหญ่พิเศษ</option>
            </Select>
            <Input label="ความจุ (คน)" type="number" value={draft.capacity} onChange={setField('capacity')} />
          </div>
        </Card>

        <Card title="ราคา">
          <div style={{ width: 286 }}>
            <Input label="ราคาต่อชั่วโมง (บาท)" type="number" value={draft.price_per_hour} onChange={setField('price_per_hour')} />
          </div>
        </Card>

        <Card title="หมายเหตุห้อง">
          <div className="field-wrap">
            <label className="field-label" htmlFor="room-description">หมายเหตุ</label>
            <textarea
              id="room-description"
              className="field field-textarea"
              placeholder="เช่น ห้องธีมอวกาศ, สูบบุหรี่ได้, มีคาราโอเกะจอ 4K"
              value={draft.description ?? ''}
              onChange={setField('description')}
              maxLength={300}
            />
          </div>
        </Card>

        <Card title="รูปภาพห้อง">
          <div style={{ width: '100%', maxWidth: ROOM_PHOTO_WIDTH, height: ROOM_PHOTO_HEIGHT }}>
            <UploadSlot
              key={selectedId}
              placeholder="อัปโหลดรูปห้อง"
              value={draft.image_url && draft.image_url.startsWith('data:') ? draft.image_url : resolveRoomImage(draft)}
              onChange={(url) => setDraft((d) => ({ ...d, image_url: url }))}
              height={ROOM_PHOTO_HEIGHT}
              cropAspectRatio={ROOM_PHOTO_ASPECT_RATIO}
            />
          </div>
        </Card>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {!confirmingDelete ? (
              <Button variant="danger" onClick={() => setConfirmingDelete(true)}>ลบห้องนี้</Button>
            ) : (
              <>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--red-600)' }}>ยืนยันลบห้องนี้? ลบแล้วกู้คืนไม่ได้</span>
                <Button variant="outline" size="sm" onClick={() => setConfirmingDelete(false)}>ยกเลิก</Button>
                <Button variant="danger" size="sm" onClick={handleDeleteRoom} disabled={deleting}>
                  {deleting ? 'กำลังลบ...' : 'ยืนยันลบ'}
                </Button>
              </>
            )}
          </div>
          <div style={{ flex: 1 }} />
          {saved && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--green-700)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
              <Check style={{ width: 26, height: 26 }} /> บันทึกสำเร็จ
            </span>
          )}
          <Button variant="primary" size="lg" onClick={handleSave} disabled={saving}>
            {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </Button>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
