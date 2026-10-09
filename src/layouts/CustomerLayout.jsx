import { useEffect, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import { LogOut } from '../components/Icons.jsx';
import api from '../api/client.js';
import NotificationBell from '../components/NotificationBell.jsx';

/**
 * Layout หลักสำหรับหน้าลูกค้า — ทำหน้าที่:
 * 1. Guard: redirect ไป /login ถ้ายังไม่ล็อกอิน (พร้อมส่ง state.from ไว้ให้หน้า login redirect กลับมาได้)
 * 2. Topbar: brand logo + navigation (เลือกห้อง / ประวัติการจอง / ข้อมูลส่วนตัว) + ปุ่ม logout
 * 3. <Outlet />: render หน้าลูกค้าตาม route ที่ match (RoomListPage / HistoryPage)
 * 4. Footer: ข้อมูลติดต่อร้าน (ชื่อ / เบอร์โทร / ที่อยู่ ดึงจากหน้าตั้งค่าร้านของแอดมิน)
 */
export default function CustomerLayout() {
  const { customer, logoutCustomer } = useAuth();
  const location = useLocation();
  // ข้อมูลร้านสำหรับ footer — แอดมินแก้ได้ที่หน้า "ตั้งค่าร้าน" (ไม่เขียนเบอร์/ที่อยู่ตายตัวในโค้ด)
  const [shop, setShop] = useState(null);

  useEffect(() => {
    api
      .getShop()
      .then(setShop)
      .catch(() => {}); // โหลดไม่ได้ก็แค่ไม่แสดงข้อมูลติดต่อ ไม่กระทบการใช้งานหน้าอื่น
  }, []);

  // Guard: ถ้าไม่มีข้อมูลลูกค้า → redirect ไป /login
  // ส่ง state.from ไว้เพื่อให้หน้า login นำกลับมายังหน้าที่ต้องการหลังล็อกอินสำเร็จ
  if (!customer) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="page-dark app-dark">
      <header className="topbar">
        {/* Brand logo — คลิกกลับหน้าหลัก (/) */}
        <NavLink to="/" className="topbar-brand">
          <img src="/assets/logo.png" alt="Gens Karaoke logo" />
          <span>Gens Karaoke</span>
        </NavLink>

        {/* Navigation หลัก — NavLink ใช้ className function เพื่อเพิ่ม class .active อัตโนมัติ */}
        <nav className="topbar-nav">
          <NavLink to="/" end className={({ isActive }) => `topbar-nav-item${isActive ? ' active' : ''}`}>
            เลือกห้อง
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => `topbar-nav-item${isActive ? ' active' : ''}`}>
            ประวัติการจอง
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `topbar-nav-item${isActive ? ' active' : ''}`}>
            ข้อมูลส่วนตัว
          </NavLink>
        </nav>

        {/* กระดิ่งแจ้งเตือน + ปุ่ม logout (แสดงชื่อลูกค้าปัจจุบัน) */}
        <div className="topbar-actions">
          <NotificationBell />
          <button type="button" className="user-pill" onClick={logoutCustomer} title="ออกจากระบบ">
            <Avatar name={customer.name} src={customer.avatar_url} size="sm" />
            <span>คุณ {customer.name}</span>
            <LogOut style={{ width: 14, height: 14, color: 'var(--text-subtle)', marginLeft: 2 }} />
          </button>
        </div>
      </header>

      {/* พื้นที่ render หน้าลูกค้า */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Footer แสดงข้อมูลติดต่อร้าน — shopPhone มาจาก customer object ที่ backend ส่งมา */}
      <footer className="footer">
        <div className="name">{shop?.name || 'Gens Karaoke & Board Game'}</div>
        {shop?.phone && <div className="meta">โทร: {shop.phone}</div>}
        {shop?.address && <div className="meta">{shop.address}</div>}
      </footer>
    </div>
  );
}
