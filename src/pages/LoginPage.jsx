import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Card from '../components/Card.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';

// หน้าเข้าสู่ระบบลูกค้า: เบอร์โทร + รหัสผ่าน
// บัญชีเดิมที่ยังไม่เคยตั้งรหัสผ่าน (backend ตอบ PASSWORD_NOT_SET) → สลับเป็นโหมด "ตั้งรหัสผ่านครั้งแรก"
// ต้องกรอกชื่อที่ลงทะเบียนไว้ + รหัสผ่านใหม่ 2 ครั้ง
export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [setupMode, setSetupMode] = useState(false);
  const [name, setName] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginCustomer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async () => {
    if (phone.trim().length < 9) {
      setError('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง');
      return;
    }
    if (setupMode) {
      if (!name.trim()) {
        setError('กรุณากรอกชื่อที่ลงทะเบียนไว้');
        return;
      }
      if (password.length < 6) {
        setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
        return;
      }
      if (password !== confirm) {
        setError('ยืนยันรหัสผ่านไม่ตรงกัน');
        return;
      }
    } else if (!password) {
      setError('กรุณากรอกรหัสผ่าน');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = setupMode
        ? await api.setFirstPassword(phone.trim(), name.trim(), password)
        : await api.loginCustomer(phone.trim(), password);
      loginCustomer(user);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      if (err.data?.code === 'PASSWORD_NOT_SET') {
        setSetupMode(true);
        setPassword('');
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-dark app-dark center-screen">
      <Card style={{ width: 420, maxWidth: '100%', padding: '28px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <img
            src="/assets/logo.png"
            alt="Gens Karaoke logo"
            style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }}
          />
          <div style={{ fontWeight: 700, fontSize: 'var(--text-xl)', color: 'var(--text-strong)' }}>
            {setupMode ? 'ตั้งรหัสผ่านครั้งแรก' : 'เข้าสู่ระบบ'}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center' }}>
            {setupMode
              ? 'บัญชีนี้ยังไม่มีรหัสผ่าน กรอกชื่อที่ลงทะเบียนไว้แล้วตั้งรหัสผ่านใหม่'
              : 'เข้าสู่ระบบด้วยเบอร์โทรศัพท์และรหัสผ่านของคุณ'}
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}
        >
          <Input
            label="เบอร์โทรศัพท์"
            placeholder="08x-xxx-xxxx"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, ''));
              setError('');
            }}
            disabled={setupMode}
          />
          {setupMode && (
            <Input
              label="ชื่อที่ลงทะเบียนไว้"
              placeholder="ชื่อ-นามสกุล"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
            />
          )}
          <Input
            label={setupMode ? 'รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)' : 'รหัสผ่าน'}
            type="password"
            placeholder="รหัสผ่าน"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
          />
          {setupMode && (
            <Input
              label="ยืนยันรหัสผ่านใหม่"
              type="password"
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setError('');
              }}
            />
          )}
          {error && <div className="field-error">{error}</div>}
          <Button type="submit" variant="accent" block disabled={loading}>
            {loading ? 'กำลังดำเนินการ...' : setupMode ? 'ตั้งรหัสผ่านและเข้าสู่ระบบ' : 'เข้าสู่ระบบ'}
          </Button>
          {setupMode && (
            <Button
              variant="outline"
              block
              onClick={() => {
                setSetupMode(false);
                setPassword('');
                setConfirm('');
                setError('');
              }}
            >
              กลับไปหน้าเข้าสู่ระบบ
            </Button>
          )}
          <div style={{ textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            ยังไม่มีบัญชี?{' '}
            <Link to="/register" style={{ color: 'var(--primary-600)', fontWeight: 600 }}>
              สมัครสมาชิก
            </Link>
          </div>
          <div
            style={{
              textAlign: 'center',
              fontSize: 'var(--text-2xs)',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: 12,
              marginTop: 4,
            }}
          >
            <Link to="/admin/login" style={{ color: 'var(--text-subtle)' }}>
              สำหรับพนักงาน / แอดมิน
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
