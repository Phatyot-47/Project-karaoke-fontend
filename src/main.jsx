// จุดเริ่มต้นของแอปพลิเคชัน — ห่อด้วย Provider ตามลำดับความสำคัญ:
//   StrictMode   → ตรวจจับ side-effect ที่ไม่ปลอดภัยในโหมด development
//   BrowserRouter → จัดการ routing แบบ HTML5 history (URL เปลี่ยนโดยไม่โหลดหน้าใหม่)
//   AuthProvider  → เก็บ state ผู้ใช้ (ลูกค้า / แอดมิน) ให้ทุก component เข้าถึงได้ผ่าน useAuth()
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
