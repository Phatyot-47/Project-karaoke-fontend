import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import { LogOut } from '../components/Icons.jsx';

/**
 * Layout หลักสำหรับหน้าลูกค้า — ทำหน้าที่:
 * 1. Guard: redirect ไป /login ถ้ายังไม่ล็อกอิน (พร้อมส่ง state.from ไว้ให้หน้า login redirect กลับมาได้)
 * 2. Topbar: brand logo + navigation (เลือกห้อง / ประวัติการจอง) + ปุ่ม logout
 * 3. <Outlet />: render หน้าลูกค้าตาม route ที่ match (RoomListPage / HistoryPage)
 * 4. Footer: ข้อมูลติดต่อร้าน
 */
export default function CustomerLayout() {
  const { customer, logoutCustomer } = useAuth();
  const location = useLocation();

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
        </nav>

        {/* ปุ่ม logout — แสดงชื่อลูกค้าปัจจุบัน */}
        <button type="button" className="user-pill" onClick={logoutCustomer} title="ออกจากระบบ">
          <Avatar name={customer.name} size="sm" />
          <span>คุณ {customer.name}</span>
          <LogOut style={{ width: 14, height: 14, color: 'var(--text-subtle)', marginLeft: 2 }} />
        </button>
      </header>

      {/* พื้นที่ render หน้าลูกค้า */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Footer แสดงข้อมูลติดต่อร้าน — shopPhone มาจาก customer object ที่ backend ส่งมา */}
      <footer className="footer">
        <div className="name">Gens Karaoke &amp; Board Game</div>
        <div className="meta">โทร: {customer.shopPhone || '081-234-5678'}</div>
        <div className="meta">629 ถ.ธรรมนูญวิถี ตำบล หาดใหญ่ อำเภอหาดใหญ่ สงขลา 90110</div>
      </footer>
    </div>
  );
}
