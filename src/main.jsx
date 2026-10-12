// ไฟล์แรกที่หน้าเว็บรัน — เอาแอป (App.jsx) ไปแสดงในกล่อง <div id="root"> ของ index.html
// ห่อแอปไว้ 3 ชั้น:
//   StrictMode    → ตอนพัฒนา ช่วยเตือนถ้าเขียนโค้ด React ผิดวิธี (ไม่มีผลตอนใช้งานจริง)
//   BrowserRouter → ทำให้เปลี่ยนหน้าตาม URL ได้ โดยไม่ต้องโหลดหน้าเว็บใหม่ทั้งหน้า
//   AuthProvider  → เก็บว่าใครล็อกอินอยู่ (ลูกค้า/แอดมิน) ทุกหน้าเรียกดูได้ด้วย useAuth()
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
  </StrictMode>,
);
