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

const PAGE_TITLES = {
  '/admin/bookings': 'อนุมัติการจอง',
  '/admin/walkin': 'จองวอล์คอิน',
  '/admin/history': 'ประวัติการจอง',
  '/admin/shop-settings': 'ตั้งค่าร้าน',
  '/admin/room-settings': 'ตั้งค่าห้อง',
  '/admin/reports': 'รายงาน',
};

export default function AdminLayout() {
  const { admin, logoutAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let alive = true;
    api.getTodayBookings()
      .then((data) => { if (alive) setPendingCount(Number(data?.stats?.pending_count || 0)); })
      .catch(() => {});
    return () => { alive = false; };
  }, [location.pathname]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (!admin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  const go = (path) => {
    navigate(path);
    setMobileOpen(false);
  };
  const isActive = (path) => location.pathname === path;
  const title = PAGE_TITLES[location.pathname] || 'อนุมัติการจอง';

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen((o) => !o);
    } else {
      setCollapsed((c) => !c);
    }
  };

  return (
    <div className="admin-shell">
      {mobileOpen && (
        <div
          className="admin-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`admin-aside${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
        <div className="admin-aside-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/assets/logo.png" alt="Gens Karaoke logo" />
            <div className="name">Gens Karaoke</div>
          </div>
          {mobileOpen && (
            <IconButton label="ปิดเมนู" onClick={() => setMobileOpen(false)}>
              <X style={{ color: '#fff' }} />
            </IconButton>
          )}
        </div>
        <nav className="admin-nav">
          <div className="admin-nav-group">
            <div className="admin-nav-group-title">การจอง</div>
            <div className="admin-nav-items">
              <NavItem label="อนุมัติการจอง" icon={<ClipboardCheck />} active={isActive('/admin/bookings')} badge={pendingCount} onClick={() => go('/admin/bookings')} />
              <NavItem label="จองวอล์คอิน" icon={<Plus />} active={isActive('/admin/walkin')} onClick={() => go('/admin/walkin')} />
              <NavItem label="ประวัติการจอง" icon={<HistoryIcon />} active={isActive('/admin/history')} onClick={() => go('/admin/history')} />
            </div>
          </div>
          <div className="admin-nav-group">
            <div className="admin-nav-group-title">ตั้งค่า</div>
            <div className="admin-nav-items">
              <NavItem label="ตั้งค่าร้าน" icon={<Store />} active={isActive('/admin/shop-settings')} onClick={() => go('/admin/shop-settings')} />
              <NavItem label="ตั้งค่าห้อง" icon={<DoorOpen />} active={isActive('/admin/room-settings')} onClick={() => go('/admin/room-settings')} />
            </div>
          </div>
          <div className="admin-nav-group">
            <div className="admin-nav-group-title">รายงาน</div>
            <div className="admin-nav-items">
              <NavItem label="รายงานสรุป" icon={<CalendarIcon />} active={isActive('/admin/reports')} onClick={() => go('/admin/reports')} />
            </div>
          </div>
        </nav>
      </aside>

      <div className="admin-main-wrap">
        <header className="admin-header">
          <IconButton label="เมนู" onClick={toggleSidebar}><Menu /></IconButton>
          <h1>{title}</h1>
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
