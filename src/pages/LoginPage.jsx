import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Card from '../components/Card.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
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
    setLoading(true);
    setError('');
    try {
      const user = await api.loginCustomer(phone.trim());
      loginCustomer(user);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-dark app-dark center-screen">
      <Card style={{ width: 884, maxWidth: '100%', padding: 21 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, marginBottom: 16 }}>
          <img src="/assets/logo.png" alt="Gens Karaoke logo" style={{ width: 135, height: 135, borderRadius: '50%', objectFit: 'cover' }} />
          <div style={{ fontWeight: 700, fontSize: 'var(--text-2xl)', color: 'var(--text-strong)' }}>เข้าสู่ระบบ</div>
          <div style={{ fontSize: 'var(--text-lg)', color: 'var(--text-muted)', textAlign: 'center' }}>
            เข้าสู่ระบบด้วยเบอร์โทรศัพท์ของคุณ
          </div>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          style={{ display: 'flex', flexDirection: 'column', gap: 29, marginTop: 31 }}
        >
          <Input
            label="เบอร์โทรศัพท์"
            placeholder="08x-xxx-xxxx"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setError(''); }}
          />
          {error && <div className="field-error">{error}</div>}
          <Button type="submit" variant="accent" block disabled={loading}>
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </Button>
          <div style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            ยังไม่มีบัญชี? <Link to="/register" style={{ color: 'var(--primary-600)', fontWeight: 600 }}>สมัครสมาชิก</Link>
          </div>
          <div style={{ textAlign: 'center', fontSize: 'var(--text-xs)' }}>
            <Link to="/admin/login" style={{ color: 'var(--text-subtle)' }}>เข้าสู่ระบบสำหรับแอดมิน</Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
