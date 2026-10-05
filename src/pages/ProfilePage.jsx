import { useState } from 'react';
import Card from '../components/Card.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import { Check } from '../components/Icons.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';

// หน้า "ข้อมูลส่วนตัว" — ลูกค้าแก้ไขชื่อและเบอร์โทรศัพท์ของตัวเอง (เบอร์ใหม่ใช้เข้าสู่ระบบครั้งถัดไป)
export default function ProfilePage() {
  const { customer, loginCustomer } = useAuth();
  const [name, setName] = useState(customer.name || '');
  const [phone, setPhone] = useState(customer.phone || '');
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
      const user = await api.updateProfile(customer.user_id, name.trim(), phone.trim());
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
        แก้ไขชื่อและเบอร์โทรศัพท์ — ใช้เบอร์ใหม่เข้าสู่ระบบครั้งถัดไป
      </p>

      <Card style={{ marginTop: 20 }}>
        <form
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
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
