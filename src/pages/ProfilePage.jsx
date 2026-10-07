import { useState } from 'react';
import Card from '../components/Card.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import Avatar from '../components/Avatar.jsx';
import UploadSlot from '../components/UploadSlot.jsx';
import { Check } from '../components/Icons.jsx';
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
  const [saved, setSaved] = useState(false);

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
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
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
            {saved && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--green-700)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                <Check style={{ width: 16, height: 16 }} /> บันทึกสำเร็จ
              </span>
            )}
            <Button type="submit" variant="accent" disabled={saving}>
              {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
