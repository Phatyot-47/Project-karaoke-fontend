import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import NavItem from '../components/NavItem.jsx';
import Avatar from '../components/Avatar.jsx';
import IconButton from '../components/IconButton.jsx';
import api from '../api/client.js';
import {
  Menu, ClipboardCheck, HistoryIcon, Store, DoorOpen, CalendarIcon, LogOut, Plus, X,
} from '../components/Icons.jsx';

// Map path → ชื่อหน้าที่แสดงใน header — เพิ่ม path ใหม่ที่นี่ถ้ามีหน้าเพิ่ม
const PAGE_TITLES = {
  '/admin/bookings': 'อนุมัติการจอง',
  '/admin/walkin': 'จองวอล์คอิน',
  '/admin/history': 'ประวัติการจอง',
  '/admin/shop-settings': 'ตั้งค่าร้าน',
  '/admin/room-settings': 'ตั้งค่าห้อง',
  '/admin/reports': 'รายงาน',
};

/**
 * Layout หลักของระบบแอดมิน — ทำหน้าที่:
 * 1. Guard: redirect ไป /admin/login ถ้ายังไม่ล็อกอิน
 * 2. Sidebar (aside): เมนูนำทาง รองรับ responsive (collapsed บน desktop / drawer บน mobile)
 * 3. Header: แสดงชื่อหน้าปัจจุบัน + ปุ่ม logout
 * 4. <Outlet />: render หน้าแอดมินตาม route ที่ match
 */
export default function AdminLayout() {
  const { admin, logoutAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // sidebar collapsed (desktop) / mobile drawer open
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // จำนวนรายการที่รอดำเนินการ — แสดงเป็น badge บน nav item "อนุมัติการจอง"
  const [pendingCount, setPendingCount] = useState(0);

  // โหลด pending count ทุกครั้งที่เปลี่ยนหน้า — ให้ badge อัปเดตเสมอ
  // ใช้ alive flag ป้องกัน setState หลัง component unmount (React warning)
  useEffect(() => {
    let alive = true;
    api.getTodayBookings()
      .then((data) => { if (alive) setPendingCount(Number(data?.stats?.pending_count || 0)); })
      .catch(() => {}); // ไม่แสดง error ถ้าโหลด badge ไม่สำเร็จ — ไม่ critical
    return () => { alive = false; };
  }, [location.pathname]);

  // ปิด mobile sidebar อัตโนมัติเมื่อ route เปลี่ยน (ผู้ใช้เลือก menu item แล้ว)
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Guard: ถ้าไม่มีข้อมูลแอดมิน (ยังไม่ล็อกอิน หรือ logout แล้ว) → redirect
  if (!admin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // navigate แล้วปิด mobile drawer ในก้าวเดียว
  const go = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const isActive = (path) => location.pathname === path;
  const title = PAGE_TITLES[location.pathname] || 'อนุมัติการจอง';

  // toggle sidebar: บน mobile → เปิด/ปิด drawer | บน desktop → ย่อ/ขยาย sidebar
  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen((o) => !o);
    } else {
      setCollapsed((c) => !c);
    }
  };

  return (
    <div className="admin-shell">
      {/* Backdrop สำหรับปิด mobile sidebar เมื่อแตะนอก drawer */}
      {mobileOpen && (
        <div
          className="admin-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — class .collapsed ย่อ sidebar บน desktop / .mobile-open เปิด drawer บน mobile */}
      <aside className={`admin-aside${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
        <div className="admin-aside-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/assets/logo.png" alt="Gens Karaoke logo" />
            <div className="name">Gens Karaoke</div>
          </div>
          {/* ปุ่มปิด drawer — แสดงเฉพาะบน mobile เมื่อ drawer เปิดอยู่ */}
          {mobileOpen && (
            <IconButton label="ปิดเมนู" onClick={() => setMobileOpen(false)}>
              <X style={{ color: '#fff' }} />
            </IconButton>
          )}
        </div>

        <nav className="admin-nav">
          {/* กลุ่มเมนู: การจอง */}
          <div className="admin-nav-group">
            <div className="admin-nav-group-title">การจอง</div>
            <div className="admin-nav-items">
              <NavItem label="อนุมัติการจอง" icon={<ClipboardCheck />} active={isActive('/admin/bookings')} badge={pendingCount} onClick={() => go('/admin/bookings')} />
              <NavItem label="จองวอล์คอิน" icon={<Plus />} active={isActive('/admin/walkin')} onClick={() => go('/admin/walkin')} />
              <NavItem label="ประวัติการจอง" icon={<HistoryIcon />} active={isActive('/admin/history')} onClick={() => go('/admin/history')} />
            </div>
          </div>

          {/* กลุ่มเมนู: ตั้งค่า */}
          <div className="admin-nav-group">
            <div className="admin-nav-group-title">ตั้งค่า</div>
            <div className="admin-nav-items">
              <NavItem label="ตั้งค่าร้าน" icon={<Store />} active={isActive('/admin/shop-settings')} onClick={() => go('/admin/shop-settings')} />
              <NavItem label="ตั้งค่าห้อง" icon={<DoorOpen />} active={isActive('/admin/room-settings')} onClick={() => go('/admin/room-settings')} />
            </div>
          </div>

          {/* กลุ่มเมนู: รายงาน */}
          <div className="admin-nav-group">
            <div className="admin-nav-group-title">รายงาน</div>
            <div className="admin-nav-items">
              <NavItem label="รายงานสรุป" icon={<CalendarIcon />} active={isActive('/admin/reports')} onClick={() => go('/admin/reports')} />
            </div>
          </div>
        </nav>
      </aside>

      {/* พื้นที่หลัก: header + Outlet */}
      <div className="admin-main-wrap">
        <header className="admin-header">
          {/* ปุ่ม toggle sidebar — ทำงานต่างกันบน mobile และ desktop */}
          <IconButton label="เมนู" onClick={toggleSidebar}><Menu /></IconButton>
          <h1>{title}</h1>
          {/* ปุ่ม logout แสดงชื่อแอดมินปัจจุบัน */}
          <button type="button" className="user-pill" onClick={logoutAdmin} title="ออกจากระบบ">
            <Avatar name={admin.name || admin.username} size="sm" />
            <span>{admin.name || admin.username}</span>
            <LogOut style={{ width: 16, height: 16, color: 'var(--text-subtle)', marginLeft: 4 }} />
          </button>
        </header>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
