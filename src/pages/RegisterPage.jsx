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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginCustomer } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!name.trim() || phone.trim().length < 9) {
      setError('กรุณากรอกชื่อและเบอร์โทรศัพท์ให้ครบถ้วน');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await api.registerCustomer(name.trim(), phone.trim());
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
      <Card style={{ width: 884, maxWidth: '100%', padding: 21 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, marginBottom: 16 }}>
          <img src="/assets/logo.png" alt="Gens Karaoke logo" style={{ width: 135, height: 135, borderRadius: '50%', objectFit: 'cover' }} />
          <div style={{ fontWeight: 700, fontSize: 'var(--text-2xl)', color: 'var(--text-strong)' }}>สมัครสมาชิก</div>
          <div style={{ fontSize: 'var(--text-lg)', color: 'var(--text-muted)', textAlign: 'center' }}>
            กรอกชื่อและเบอร์โทรศัพท์เพื่อสมัครสมาชิก
          </div>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          style={{ display: 'flex', flexDirection: 'column', gap: 29, marginTop: 31 }}
        >
          <Input label="ชื่อ" placeholder="ชื่อ-นามสกุล" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} />
          <Input label="เบอร์โทรศัพท์" placeholder="08x-xxx-xxxx" value={phone} onChange={(e) => { setPhone(e.target.value); setError(''); }} />
          {error && <div className="field-error">{error}</div>}
          <Button type="submit" variant="accent" block disabled={loading}>
            {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
          </Button>
          <div style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            มีบัญชีแล้ว? <Link to="/login" style={{ color: 'var(--primary-600)', fontWeight: 600 }}>เข้าสู่ระบบ</Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
