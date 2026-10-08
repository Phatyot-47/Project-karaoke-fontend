// หน้าสมัครสมาชิกลูกค้า (/register) — ชื่อ + เบอร์โทร + รหัสผ่าน
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/Card.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginCustomer } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!name.trim() || phone.trim().length < 9) {
      setError('กรุณากรอกชื่อและเบอร์โทรศัพท์ให้ครบถ้วน');
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
    setLoading(true);
    setError('');
    try {
      const user = await api.registerCustomer(name.trim(), phone.trim(), password);
      loginCustomer(user);
      navigate('/', { replace: true });
    } catch (err) {
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
          <div style={{ fontWeight: 700, fontSize: 'var(--text-xl)', color: 'var(--text-strong)' }}>สมัครสมาชิก</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center' }}>
            กรอกชื่อ เบอร์โทรศัพท์ และตั้งรหัสผ่านเพื่อสมัครสมาชิก
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
            label="ชื่อ"
            placeholder="ชื่อ-นามสกุล"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
          />
          <Input
            label="เบอร์โทรศัพท์"
            placeholder="08x-xxx-xxxx"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, ''));
              setError('');
            }}
          />
          <Input
            label="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
            type="password"
            placeholder="รหัสผ่าน"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
          />
          <Input
            label="ยืนยันรหัสผ่าน"
            type="password"
            placeholder="กรอกรหัสผ่านอีกครั้ง"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              setError('');
            }}
          />
          {error && <div className="field-error">{error}</div>}
          <Button type="submit" variant="accent" block disabled={loading}>
            {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
          </Button>
          <div style={{ textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            มีบัญชีแล้ว?{' '}
            <Link to="/login" style={{ color: 'var(--primary-600)', fontWeight: 600 }}>
              เข้าสู่ระบบ
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
