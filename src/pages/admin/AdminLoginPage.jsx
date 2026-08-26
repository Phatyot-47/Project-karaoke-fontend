import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Card from '../../components/Card.jsx';
import Input from '../../components/Input.jsx';
import Button from '../../components/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/client.js';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async () => {
    if (!username.trim() || !password) {
      setError('กรุณากรอก username และ password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const admin = await api.loginAdmin(username.trim(), password);
      loginAdmin(admin);
      navigate(location.state?.from?.pathname || '/admin/bookings', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-screen" style={{ background: 'var(--surface-app)' }}>
      <Card style={{ width: 420, maxWidth: '100%', padding: '28px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <img src="/assets/logo.png" alt="Gens Karaoke logo" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
          <div style={{ fontWeight: 700, fontSize: 'var(--text-xl)', color: 'var(--text-strong)' }}>เข้าสู่ระบบแอดมิน</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center' }}>สำหรับพนักงานร้าน Gens Karaoke</div>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}
        >
          <Input label="Username" value={username} onChange={(e) => { setUsername(e.target.value); setError(''); }} />
          <Input label="Password" type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} />
          {error && <div className="field-error">{error}</div>}
          <Button type="submit" variant="primary" block disabled={loading}>
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </Button>
          <div style={{ textAlign: 'center', fontSize: 'var(--text-xs)', marginTop: 4 }}>
            <Link to="/login" style={{ color: 'var(--text-subtle)' }}>กลับหน้าลูกค้า</Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
