import { useState } from 'react';
import Card from '../components/Card.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import Avatar from '../components/Avatar.jsx';
import UploadSlot from '../components/UploadSlot.jsx';
import SavedNotice from '../components/SavedNotice.jsx';
import useSavedFlag from '../hooks/useSavedFlag.js';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';

// หน้า "ข้อมูลส่วนตัว" — ลูกค้าแก้ไขรูปโปรไฟล์ ชื่อ และเบอร์โทรศัพท์ของตัวเอง (เบอร์ใหม่ใช้เข้าสู่ระบบครั้งถัดไป)
export default function ProfilePage() {
  const { customer, loginCustomer } = useAuth();
  const [name, setName] = useState(customer.name || '');
  const [phone, setPhone] = useState(customer.phone || '');
  // รูปโปรไฟล์: อัปโหลด/ครอปเป็นสี่เหลี่ยมจัตุรัสก่อน แล้วบันทึกพร้อมชื่อ-เบอร์ ('' = ลบรูป)
  const [avatarUrl, setAvatarUrl] = useState(customer.avatar_url || '');
  // เปลี่ยน key ของ UploadSlot เพื่อล้างพรีวิวในช่องอัปโหลดตอนกด "ลบรูป"
  const [uploadKey, setUploadKey] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { saved, flashSaved } = useSavedFlag();

  const handleSubmit = async () => {
    if (!name.trim() || phone.trim().length < 9) {
      setError('กรุณากรอกชื่อและเบอร์โทรศัพท์ให้ครบถ้วน');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const user = await api.updateProfile(customer.user_id, name.trim(), phone.trim(), avatarUrl);
      loginCustomer({ ...customer, ...user });
      flashSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-sm">
      <h1 style={{ fontSize: 'var(--text-xl)' }}>ข้อมูลส่วนตัว</h1>
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>
        แก้ไขรูปโปรไฟล์ ชื่อ และเบอร์โทรศัพท์ — ใช้เบอร์ใหม่เข้าสู่ระบบครั้งถัดไป
      </p>

      <Card style={{ marginTop: 20 }}>
        <form
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <Avatar name={name || customer.name} src={avatarUrl} size="lg" />
            <div style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="field-label">รูปโปรไฟล์</span>
              <div style={{ width: '100%', maxWidth: 220 }}>
                <UploadSlot
                  key={uploadKey}
                  placeholder="คลิกเพื่อเลือกรูป"
                  onChange={(url) => { setAvatarUrl(url); setError(''); }}
                  height={110}
                  cropAspectRatio={1}
                />
              </div>
              {avatarUrl && (
                <Button variant="outline" size="sm" style={{ width: 'fit-content' }} onClick={() => { setAvatarUrl(''); setUploadKey((k) => k + 1); }}>
                  ลบรูปโปรไฟล์
                </Button>
              )}
              <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>เลือกรูปแล้วกด "บันทึกข้อมูล" เพื่อยืนยัน</span>
            </div>
          </div>
          <Input label="ชื่อ" placeholder="ชื่อ-นามสกุล" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} />
          <Input label="เบอร์โทรศัพท์" placeholder="08x-xxx-xxxx" value={phone} onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '')); setError(''); }} />
          {error && <div className="field-error">{error}</div>}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
            <SavedNotice show={saved} />
            <Button type="submit" variant="accent" disabled={saving}>
              {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </Button>
          </div>
        </form>
      </Card>

      <ChangePasswordCard userId={customer.user_id} />
    </div>
  );
}

// การ์ด "เปลี่ยนรหัสผ่าน" — ต้องกรอกรหัสผ่านเดิมให้ถูกก่อน
function ChangePasswordCard({ userId }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { saved, flashSaved } = useSavedFlag();
  const clearError = (setter) => (e) => { setter(e.target.value); setError(''); };

  const handleSubmit = async () => {
    if (!current) { setError('กรุณากรอกรหัสผ่านเดิม'); return; }
    if (next.length < 6) { setError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร'); return; }
    if (next !== confirm) { setError('ยืนยันรหัสผ่านใหม่ไม่ตรงกัน'); return; }
    setSaving(true);
    setError('');
    try {
      await api.changePassword(userId, current, next);
      setCurrent(''); setNext(''); setConfirm('');
      flashSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={{ marginTop: 20 }}>
      <form
        onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <span style={{ fontWeight: 700, color: 'var(--text-strong)' }}>เปลี่ยนรหัสผ่าน</span>
        <Input label="รหัสผ่านเดิม" type="password" placeholder="รหัสผ่านปัจจุบัน" value={current} onChange={clearError(setCurrent)} />
        <Input label="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)" type="password" placeholder="รหัสผ่านใหม่" value={next} onChange={clearError(setNext)} />
        <Input label="ยืนยันรหัสผ่านใหม่" type="password" placeholder="กรอกรหัสผ่านใหม่อีกครั้ง" value={confirm} onChange={clearError(setConfirm)} />
        {error && <div className="field-error">{error}</div>}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
          <SavedNotice show={saved} />
          <Button type="submit" variant="accent" disabled={saving}>
            {saving ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
