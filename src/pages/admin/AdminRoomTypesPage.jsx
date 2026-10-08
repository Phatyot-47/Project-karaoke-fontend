// หน้าแอดมิน "ประเภทห้อง" (/admin/room-types) — จัดการประเภท S/M/L/XL (หรือเพิ่มเอง เช่น VIP)
// แต่ละประเภทมีชื่อ ช่วงความจุ และราคาห้องธรรมดา — เปลี่ยนราคาแล้วเลือกได้ว่าห้องธรรมดาห้องไหนเปลี่ยนตาม
// (ห้องธีมไม่เปลี่ยนตาม เพราะแอดมินตั้งราคาห้องธีมเองที่หน้า "ตั้งค่าห้อง")
import { useEffect, useState } from 'react';
import Card from '../../components/Card.jsx';
import Input from '../../components/Input.jsx';
import Button from '../../components/Button.jsx';
import Tag from '../../components/Tag.jsx';
import { Plus } from '../../components/Icons.jsx';
import SavedNotice from '../../components/SavedNotice.jsx';
import useSavedFlag from '../../hooks/useSavedFlag.js';
import api from '../../api/client.js';
import { money } from '../../utils/format.js';

// ค่าเริ่มต้นของฟอร์มตอนกด "เพิ่มประเภท" (type_id = null = ยังไม่ได้บันทึก)
const NEW_TYPE = {
  type_id: null,
  code: '',
  name: '',
  capacity_min: 1,
  capacity_max: 4,
  base_price_per_hour: 0,
  description: '',
};

export default function AdminRoomTypesPage() {
  const [types, setTypes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [draft, setDraft] = useState(null);
  // ห้องธรรมดาที่ติ๊กให้เปลี่ยนเป็นราคาใหม่ (เก็บเป็น Set ของ room_id)
  const [applyIds, setApplyIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const { saved, flashSaved, clearSaved } = useSavedFlag();

  const selectType = (type) => {
    setDraft({ ...type, description: type.description ?? '' });
    setApplyIds(new Set());
    setError('');
    setNotice('');
    setConfirmingDelete(false);
    clearSaved();
  };

  // โหลดประเภท + ห้องทั้งหมด (ไว้ทำรายการห้องให้เลือกเปลี่ยนราคา) — keepId = เลือกประเภทเดิมไว้หลังบันทึก
  const load = (keepId) =>
    Promise.all([api.listAdminRoomTypes(), api.listAdminRooms()])
      .then(([typeList, roomList]) => {
        setTypes(typeList);
        setRooms(roomList);
        const current = typeList.find((t) => t.type_id === keepId) || typeList[0];
        if (current) selectType(current);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const original = types.find((t) => t.type_id === draft?.type_id);
  const priceChanged = original && Number(draft.base_price_per_hour) !== Number(original.base_price_per_hour);
  const typeRooms = draft?.type_id ? rooms.filter((r) => r.type_id === draft.type_id) : [];
  const normalRooms = typeRooms.filter((r) => !r.theme);
  const themeRooms = typeRooms.filter((r) => r.theme);

  // พอแก้ราคา ติ๊กห้องธรรมดาทุกห้องไว้ให้ก่อน (แอดมินเอาติ๊กออกได้ถ้าจะเปลี่ยนแค่บางห้อง)
  const setPrice = (e) => {
    const value = e.target.value;
    setDraft((d) => ({ ...d, base_price_per_hour: value }));
    if (!priceChanged) setApplyIds(new Set(normalRooms.map((r) => r.room_id)));
  };

  const toggleRoom = (roomId) =>
    setApplyIds((ids) => {
      const next = new Set(ids);
      if (next.has(roomId)) next.delete(roomId);
      else next.add(roomId);
      return next;
    });

  const setField = (field) => (e) => setDraft((d) => ({ ...d, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setNotice('');
    const payload = {
      code: draft.code,
      name: draft.name,
      capacityMin: Number(draft.capacity_min),
      capacityMax: Number(draft.capacity_max),
      basePricePerHour: draft.base_price_per_hour === '' ? '' : Number(draft.base_price_per_hour),
      description: draft.description,
    };
    try {
      if (draft.type_id) {
        const result = await api.updateRoomType(draft.type_id, {
          ...payload,
          applyToRoomIds: priceChanged ? [...applyIds] : [],
        });
        await load(draft.type_id); // โหลดใหม่ก่อน เพราะ selectType() ล้างข้อความแจ้งเตือน
        if (priceChanged) setNotice(`เปลี่ยนราคาห้องธรรมดาแล้ว ${result.updated_room_count} ห้อง`);
      } else {
        const created = await api.createRoomType(payload);
        await load(created.type_id);
      }
      flashSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setError('');
    try {
      await api.deleteRoomType(draft.type_id);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirmingDelete(false);
    }
  };

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>กำลังโหลด...</p>;

  return (
    <div className="admin-grid-split" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Card
        title={`ประเภทห้อง (${types.length})`}
        actions={
          <Button variant="primary" size="sm" iconLeft={<Plus />} onClick={() => selectType(NEW_TYPE)}>
            เพิ่มประเภท
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {types.map((t) => (
            <button
              key={t.type_id}
              type="button"
              className={`room-settings-list-item${t.type_id === draft?.type_id ? ' active' : ''}`}
              onClick={() => selectType(t)}
            >
              <span style={{ flex: 1, textAlign: 'left' }}>
                {t.code} — {t.name}
              </span>
              <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', fontWeight: 400 }}>
                {t.room_count} ห้อง
              </span>
            </button>
          ))}
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && <div className="field-error">{error}</div>}
        {notice && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--green-700)' }}>{notice}</div>}

        {draft && (
          <>
            <Card title={draft.type_id ? `ประเภท ${original?.code}` : 'เพิ่มประเภทห้องใหม่'}>
              <div className="admin-form-2col">
                <Input label="รหัสประเภท (เช่น S, M, VIP)" value={draft.code} onChange={setField('code')} />
                <Input label="ชื่อประเภท" placeholder="เช่น ห้องเล็ก" value={draft.name} onChange={setField('name')} />
                <Input
                  label="ความจุต่ำสุด (คน)"
                  type="number"
                  value={draft.capacity_min}
                  onChange={setField('capacity_min')}
                />
                <Input
                  label="ความจุสูงสุด (คน)"
                  type="number"
                  value={draft.capacity_max}
                  onChange={setField('capacity_max')}
                />
                <Input
                  label="ราคาห้องธรรมดา (บาท/ชม.)"
                  type="number"
                  value={draft.base_price_per_hour}
                  onChange={setPrice}
                />
                <div style={{ gridColumn: '1 / -1' }}>
                  <Input
                    label="คำอธิบาย (แสดงให้ลูกค้าเห็น)"
                    placeholder="เช่น เหมาะกับกลุ่มเพื่อน 3-5 คน"
                    value={draft.description}
                    onChange={setField('description')}
                  />
                </div>
              </div>
            </Card>

            {priceChanged && (
              <Card
                title="ใช้ราคาใหม่กับห้องไหนบ้าง?"
                subtitle={`ราคาห้องธรรมดา ${money(original.base_price_per_hour)} → ${money(draft.base_price_per_hour)} บาท/ชม. — ห้องที่ไม่ติ๊กจะคงราคาเดิม`}
              >
                {!normalRooms.length && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                    ประเภทนี้ยังไม่มีห้องธรรมดา — ราคาใหม่จะใช้กับห้องที่เพิ่มหลังจากนี้
                  </p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {normalRooms.map((r) => (
                    <label
                      key={r.room_id}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 'var(--text-sm)' }}
                    >
                      <input type="checkbox" checked={applyIds.has(r.room_id)} onChange={() => toggleRoom(r.room_id)} />
                      <span style={{ flex: 1 }}>{r.room_name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                        ตอนนี้ {money(r.price_per_hour)} บาท
                      </span>
                    </label>
                  ))}
                </div>
                {normalRooms.length > 1 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setApplyIds(new Set(normalRooms.map((r) => r.room_id)))}
                    >
                      เลือกทั้งหมด
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setApplyIds(new Set())}>
                      ไม่เลือกเลย
                    </Button>
                  </div>
                )}
                {themeRooms.length > 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-2xs)', marginTop: 12 }}>
                    ห้องธีม ({themeRooms.map((r) => r.room_name).join(', ')}) ไม่เปลี่ยนราคา — แก้ราคาได้ที่หน้า
                    "ตั้งค่าห้อง"
                  </p>
                )}
              </Card>
            )}

            {draft.type_id && (
              <Card title={`ห้องในประเภทนี้ (${typeRooms.length})`}>
                {!typeRooms.length && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                    ยังไม่มีห้อง — เพิ่มห้องตามประเภทได้ที่หน้า "ตั้งค่าห้อง"
                  </p>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {typeRooms.map((r) => (
                    <Tag key={r.room_id} tone={r.theme ? 'info' : 'neutral'} size="sm">
                      {r.room_name}
                      {r.theme ? ` (ธีม ${r.theme})` : ''} · {money(r.price_per_hour)} บาท
                    </Tag>
                  ))}
                </div>
              </Card>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {draft.type_id &&
                (!confirmingDelete ? (
                  <Button variant="danger" size="sm" onClick={() => setConfirmingDelete(true)}>
                    ลบประเภทนี้
                  </Button>
                ) : (
                  <>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--red-600)' }}>ยืนยันลบประเภทนี้?</span>
                    <Button variant="outline" size="sm" onClick={() => setConfirmingDelete(false)}>
                      ยกเลิก
                    </Button>
                    <Button variant="danger" size="sm" onClick={handleDelete}>
                      ยืนยันลบ
                    </Button>
                  </>
                ))}
              <div style={{ flex: 1 }} />
              <SavedNotice show={saved} />
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'กำลังบันทึก...' : draft.type_id ? 'บันทึกประเภท' : 'บันทึกประเภทใหม่'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
