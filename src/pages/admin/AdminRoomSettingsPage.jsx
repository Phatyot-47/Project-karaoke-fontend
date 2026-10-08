// หน้าแอดมิน "ตั้งค่าห้อง" (/admin/room-settings) — เพิ่มห้องตามประเภททีละหลายห้อง (เช่น S 3 ห้อง, M 2 ห้อง)
// รายการห้องจัดกลุ่มตามประเภท / แก้ไขห้อง: ประเภท, ห้องธรรมดาหรือห้องธีม, ราคา, รูป และลบห้อง
import { useEffect, useMemo, useState } from 'react';
import Card from '../../components/Card.jsx';
import Input from '../../components/Input.jsx';
import Select from '../../components/Select.jsx';
import Button from '../../components/Button.jsx';
import UploadSlot from '../../components/UploadSlot.jsx';
import { Plus } from '../../components/Icons.jsx';
import SavedNotice from '../../components/SavedNotice.jsx';
import useSavedFlag from '../../hooks/useSavedFlag.js';
import api from '../../api/client.js';
import { money } from '../../utils/format.js';
import { resolveRoomImage, capacityLabel, ROOM_PHOTO_ASPECT_RATIO } from '../../utils/roomImage.js';

// ห้องจาก API → ข้อมูลในฟอร์ม (is_theme แยกไว้ เพราะติ๊กเป็นห้องธีมแล้วอาจยังไม่ได้พิมพ์ชื่อธีม)
const toDraft = (room) => ({ ...room, theme: room.theme ?? '', is_theme: Boolean(room.theme) });

export default function AdminRoomSettingsPage() {
  const [rooms, setRooms] = useState([]);
  const [types, setTypes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const { saved, flashSaved, clearSaved } = useSavedFlag();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // จำนวนห้องที่จะเพิ่มของแต่ละประเภท { [type_id]: จำนวน }
  const [bulkCounts, setBulkCounts] = useState({});
  const [adding, setAdding] = useState(false);

  const selectRoom = (room) => {
    setSelectedId(room.room_id);
    setDraft(toDraft(room));
    clearSaved();
    setConfirmingDelete(false);
  };

  // keepId = ห้องที่จะให้เลือกค้างไว้หลังโหลดใหม่
  const load = (keepId = selectedId) =>
    Promise.all([api.listAdminRooms(), api.listAdminRoomTypes()])
      .then(([roomList, typeList]) => {
        setRooms(roomList);
        setTypes(typeList);
        const current = roomList.find((r) => r.room_id === keepId) || roomList[0];
        if (current) selectRoom(current);
        else {
          setSelectedId(null);
          setDraft(null);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // รายการห้องจัดกลุ่มตามประเภท (ลำดับเดียวกับประเภทจาก API: เล็ก → ใหญ่)
  const groups = useMemo(
    () => types.map((t) => ({ type: t, rooms: rooms.filter((r) => r.type_id === t.type_id) })),
    [types, rooms],
  );

  const bulkTotal = Object.values(bulkCounts).reduce((sum, n) => sum + (Number(n) || 0), 0);

  const handleBulkAdd = async () => {
    setAdding(true);
    setError('');
    setNotice('');
    try {
      const items = Object.entries(bulkCounts)
        .filter(([, n]) => Number(n) > 0)
        .map(([typeId, n]) => ({ typeId: Number(typeId), count: Number(n) }));
      const created = await api.bulkCreateAdminRooms(items);
      setBulkCounts({});
      await load(created[0]?.room_id);
      setNotice(`เพิ่มห้องแล้ว ${created.length} ห้อง: ${created.map((r) => r.room_name).join(', ')}`);
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
      await load(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  const setField = (field) => (e) => setDraft((d) => ({ ...d, [field]: e.target.value }));
  const draftType = types.find((t) => t.type_id === Number(draft?.type_id));

  // เปลี่ยนประเภท: ห้องธรรมดาใช้ราคา/ความจุของประเภทใหม่ให้เลย (ห้องธีมคงราคาที่ตั้งเอง)
  const changeType = (e) => {
    const type = types.find((t) => t.type_id === Number(e.target.value));
    setDraft((d) => ({
      ...d,
      type_id: type.type_id,
      capacity: type.capacity_max,
      ...(!d.is_theme && { price_per_hour: type.base_price_per_hour }),
    }));
  };

  const handleSave = async () => {
    if (draft.is_theme && !draft.theme.trim()) {
      setError('ห้องธีมต้องใส่ชื่อธีม เช่น One Piece');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const updated = await api.updateAdminRoom(draft.room_id, {
        roomName: draft.room_name,
        typeId: Number(draft.type_id),
        capacity: Number(draft.capacity),
        pricePerHour: draft.price_per_hour === '' ? '' : Number(draft.price_per_hour),
        imageUrl: draft.image_url,
        isActive: draft.is_active,
        description: draft.description ?? '',
        theme: draft.is_theme ? draft.theme : '', // '' = ห้องธรรมดา
      });
      setRooms((rs) => rs.map((r) => (r.room_id === updated.room_id ? updated : r)));
      setDraft(toDraft(updated));
      flashSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>กำลังโหลด...</p>;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card
        title="เพิ่มห้องตามประเภท"
        subtitle="ใส่จำนวนห้องที่จะเพิ่มของแต่ละประเภท ระบบตั้งชื่อให้อัตโนมัติ (เช่น S-01, S-02) เป็นห้องธรรมดาราคาตามประเภท — แก้ชื่อหรือเปลี่ยนเป็นห้องธีมได้ทีหลัง"
      >
        <div className="table-scroll">
          <table className="simple-table">
            <thead>
              <tr>
                <th>ประเภท</th>
                <th>ความจุ</th>
                <th>ราคาห้องธรรมดา/ชม.</th>
                <th>มีอยู่แล้ว</th>
                <th style={{ width: 130 }}>จำนวนที่จะเพิ่ม</th>
              </tr>
            </thead>
            <tbody>
              {types.map((t) => (
                <tr key={t.type_id}>
                  <td>
                    <strong>{t.code}</strong> — {t.name}
                  </td>
                  <td>{capacityLabel(t).replace('ความจุ ', '')}</td>
                  <td>{money(t.base_price_per_hour)} บาท</td>
                  <td>{t.room_count} ห้อง</td>
                  <td>
                    <input
                      className="field"
                      type="number"
                      min={0}
                      max={20}
                      aria-label={`จำนวนห้อง ${t.code} ที่จะเพิ่ม`}
                      value={bulkCounts[t.type_id] ?? ''}
                      placeholder="0"
                      onChange={(e) => setBulkCounts((c) => ({ ...c, [t.type_id]: e.target.value }))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            {bulkTotal > 0
              ? `จะเพิ่ม: ${types
                  .filter((t) => Number(bulkCounts[t.type_id]) > 0)
                  .map((t) => `${t.code} ${bulkCounts[t.type_id]} ห้อง`)
                  .join(', ')} (รวม ${bulkTotal} ห้อง)`
              : 'ยังไม่ได้ใส่จำนวน'}
          </span>
          <Button variant="primary" iconLeft={<Plus />} onClick={handleBulkAdd} disabled={adding || bulkTotal < 1}>
            {adding ? 'กำลังเพิ่ม...' : 'เพิ่มห้อง'}
          </Button>
        </div>
      </Card>

      {error && <div className="field-error">{error}</div>}
      {notice && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--green-700)' }}>{notice}</div>}

      <div className="admin-grid-split">
        <Card title={`ห้องทั้งหมด (${rooms.length} ห้อง)`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {groups.map(({ type, rooms: groupRooms }) => (
              <div key={type.type_id}>
                <div className="room-settings-group-title">
                  ประเภท {type.code} · {type.name} ({groupRooms.length} ห้อง)
                </div>
                {groupRooms.map((r) => (
                  <button
                    key={r.room_id}
                    type="button"
                    className={`room-settings-list-item${r.room_id === selectedId ? ' active' : ''}`}
                    onClick={() => selectRoom(r)}
                  >
                    <span style={{ flex: 1, textAlign: 'left' }}>{r.room_name}</span>
                    <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', fontWeight: 400 }}>
                      {!r.is_active ? 'ปิดอยู่' : r.theme ? 'ธีม' : ''}
                    </span>
                  </button>
                ))}
                {!groupRooms.length && (
                  <p style={{ color: 'var(--text-subtle)', fontSize: 'var(--text-2xs)', padding: '4px 14px' }}>
                    ยังไม่มีห้อง
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!draft ? (
            <Card>
              <p style={{ color: 'var(--text-muted)' }}>
                ยังไม่มีห้อง — ใส่จำนวนห้องในส่วน "เพิ่มห้องตามประเภท" ด้านบน
              </p>
            </Card>
          ) : (
            <>
              <Card title="ข้อมูลพื้นฐาน">
                <div className="admin-form-2col">
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Input label="ชื่อห้อง" value={draft.room_name} onChange={setField('room_name')} />
                  </div>
                  <Select label="ประเภทห้อง" value={draft.type_id} onChange={changeType}>
                    {types.map((t) => (
                      <option key={t.type_id} value={t.type_id}>
                        {t.code} — {t.name}
                      </option>
                    ))}
                  </Select>
                  <Input label="ความจุ (คน)" type="number" value={draft.capacity} onChange={setField('capacity')} />
                  <Select
                    label="ห้องธรรมดา / ห้องธีม"
                    value={draft.is_theme ? 'theme' : 'normal'}
                    onChange={(e) => setDraft((d) => ({ ...d, is_theme: e.target.value === 'theme' }))}
                  >
                    <option value="normal">ห้องธรรมดา</option>
                    <option value="theme">ห้องธีม</option>
                  </Select>
                  {draft.is_theme ? (
                    <Input
                      label="ชื่อธีม"
                      placeholder="เช่น One Piece, สงกรานต์"
                      value={draft.theme}
                      onChange={setField('theme')}
                    />
                  ) : (
                    <div />
                  )}
                  <Select
                    label="สถานะห้อง"
                    value={draft.is_active ? 'open' : 'closed'}
                    onChange={(e) => setDraft((d) => ({ ...d, is_active: e.target.value === 'open' }))}
                  >
                    <option value="open">เปิดให้จอง</option>
                    <option value="closed">ปิดให้บริการชั่วคราว</option>
                  </Select>
                </div>
              </Card>

              <Card title="ราคา">
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ maxWidth: 280, width: '100%' }}>
                    <Input
                      label="ราคาต่อชั่วโมง (บาท)"
                      type="number"
                      value={draft.price_per_hour}
                      onChange={setField('price_per_hour')}
                    />
                  </div>
                  {draftType &&
                    !draft.is_theme &&
                    Number(draft.price_per_hour) !== Number(draftType.base_price_per_hour) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDraft((d) => ({ ...d, price_per_hour: draftType.base_price_per_hour }))}
                      >
                        ใช้ราคาประเภท ({money(draftType.base_price_per_hour)} บาท)
                      </Button>
                    )}
                </div>
                {draftType && (
                  <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', marginTop: 8 }}>
                    {draft.is_theme
                      ? `ห้องธีมตั้งราคาเองได้ (ห้องธรรมดาประเภท ${draftType.code} ราคา ${money(draftType.base_price_per_hour)} บาท/ชม.)`
                      : `ราคาห้องธรรมดาของประเภท ${draftType.code} คือ ${money(draftType.base_price_per_hour)} บาท/ชม. — เปลี่ยนราคาทั้งประเภทได้ที่หน้า "ประเภทห้อง"`}
                  </p>
                )}
              </Card>

              <Card title="หมายเหตุห้อง">
                <div className="field-wrap">
                  <label className="field-label" htmlFor="room-description">
                    หมายเหตุ
                  </label>
                  <textarea
                    id="room-description"
                    className="field field-textarea"
                    placeholder="เช่น สูบบุหรี่ได้, มีคาราโอเกะจอ 4K"
                    value={draft.description ?? ''}
                    onChange={setField('description')}
                    maxLength={300}
                  />
                </div>
              </Card>

              <Card title="รูปภาพห้อง">
                <div style={{ width: '100%', maxWidth: 480 }}>
                  <UploadSlot
                    key={selectedId}
                    placeholder="อัปโหลดรูปห้อง"
                    value={
                      draft.image_url && draft.image_url.startsWith('data:') ? draft.image_url : resolveRoomImage(draft)
                    }
                    onChange={(url) => setDraft((d) => ({ ...d, image_url: url }))}
                    height={200}
                    cropAspectRatio={ROOM_PHOTO_ASPECT_RATIO}
                  />
                </div>
              </Card>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {!confirmingDelete ? (
                    <Button variant="danger" size="sm" onClick={() => setConfirmingDelete(true)}>
                      ลบห้องนี้
                    </Button>
                  ) : (
                    <>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--red-600)' }}>ยืนยันลบห้องนี้?</span>
                      <Button variant="outline" size="sm" onClick={() => setConfirmingDelete(false)}>
                        ยกเลิก
                      </Button>
                      <Button variant="danger" size="sm" onClick={handleDeleteRoom} disabled={deleting}>
                        {deleting ? 'กำลังลบ...' : 'ยืนยันลบ'}
                      </Button>
                    </>
                  )}
                </div>
                <div style={{ flex: 1 }} />
                <SavedNotice show={saved} />
                <Button variant="primary" size="md" onClick={handleSave} disabled={saving}>
                  {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
