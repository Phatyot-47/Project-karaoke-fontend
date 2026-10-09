import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import NavItem from '../components/NavItem.jsx';
import Avatar from '../components/Avatar.jsx';
import IconButton from '../components/IconButton.jsx';
import api from '../api/client.js';
import AdminSlipToasts, { playAlertSound } from '../components/AdminSlipToasts.jsx';
import {
  Menu,
  ClipboardCheck,
  HistoryIcon,
  Store,
  DoorOpen,
  LayoutGrid,
  CalendarIcon,
  LogOut,
  Plus,
  X,
  Volume2,
  VolumeX,
} from '../components/Icons.jsx';

// แจ้งเตือนแอดมิน: เช็คสลิปใหม่ทุก 15 วินาที / เก็บค่าเปิด-ปิดเสียงไว้ใน localStorage
const ALERT_POLL_MS = 15000;
const MAX_TOASTS = 5;
const SOUND_KEY = 'gens_karaoke_admin_sound';
// จำกล่องแจ้งเตือน + payment_id ล่าสุดไว้ในแท็บนี้ (sessionStorage) — กดรีเฟรชแล้วกล่องที่ยังไม่ปิดไม่หาย และไม่เด้งซ้ำ
const ALERTS_KEY = 'gens_karaoke_admin_alerts';

function loadSavedAlerts() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(ALERTS_KEY));
    if (saved && Array.isArray(saved.toasts)) return saved;
  } catch {
    /* ไม่มี/ข้อมูลเสีย = เริ่มใหม่ */
  }
  return { toasts: [], lastPaymentId: null };
}

// Map path → ชื่อหน้าที่แสดงใน header — เพิ่ม path ใหม่ที่นี่ถ้ามีหน้าเพิ่ม
const PAGE_TITLES = {
  '/admin/bookings': 'อนุมัติการจอง',
  '/admin/walkin': 'จองวอล์คอิน',
  '/admin/history': 'ประวัติการจอง',
  '/admin/shop-settings': 'ตั้งค่าร้าน',
  '/admin/room-types': 'ประเภทห้อง',
  '/admin/room-settings': 'ตั้งค่าห้อง',
  '/admin/reports': 'รายงาน',
};

/**
 * Layout หลักของระบบแอดมิน — ทำหน้าที่:
 * 1. Guard: redirect ไป /admin/login ถ้ายังไม่ล็อกอิน
 * 2. Sidebar (aside): เมนูนำทาง รองรับ responsive (collapsed บน desktop / drawer บน mobile)
 * 3. Header: แสดงชื่อหน้าปัจจุบัน + ปุ่มเปิด/ปิดเสียงแจ้งเตือน + ปุ่ม logout
 * 4. <Outlet />: render หน้าแอดมินตาม route ที่ match
 * 5. แจ้งเตือน: เช็คทุก 15 วิ — อัปเดต badge + จำนวนบนแท็บเบราว์เซอร์, มีสลิปใหม่ = กล่องแจ้งเตือน + เสียง
 */
export default function AdminLayout() {
  const { admin, logoutAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // sidebar collapsed (desktop) / mobile drawer open
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // จำนวนรายการที่รอดำเนินการ (รอยืนยันวันนี้ + ค้างจากวันก่อน) — แสดงเป็น badge บน nav item "อนุมัติการจอง"
  const [pendingCount, setPendingCount] = useState(0);
  const updateBadgeFromStats = (stats) => {
    setPendingCount(Number(stats?.pending_count || 0) + Number(stats?.overdue_count || 0));
  };

  // ---- แจ้งเตือนสลิปใหม่ ----
  // slipToasts = กล่องแจ้งเตือนที่ยังไม่ปิด / alertsVersion เพิ่มทุกครั้งที่มีสลิปใหม่ (หน้าอนุมัติการจองใช้รีเฟรชรายการ)
  const [savedAlerts] = useState(loadSavedAlerts);
  const [slipToasts, setSlipToasts] = useState(savedAlerts.toasts);
  const [alertsVersion, setAlertsVersion] = useState(0);
  const [soundOn, setSoundOn] = useState(() => {
    try {
      return localStorage.getItem(SOUND_KEY) !== 'off';
    } catch {
      return true;
    }
  });
  const soundOnRef = useRef(soundOn);
  soundOnRef.current = soundOn;
  // payment_id ล่าสุดที่เห็นแล้ว — null = ยังไม่เคยเช็ค (ครั้งแรกแค่จำค่าไว้ ไม่เด้งแจ้งเตือนสลิปที่ค้างอยู่ก่อนเปิดหน้า)
  const lastPaymentIdRef = useRef(savedAlerts.lastPaymentId);

  const slipToastsRef = useRef(slipToasts);
  slipToastsRef.current = slipToasts;
  const saveAlerts = () => {
    try {
      sessionStorage.setItem(
        ALERTS_KEY,
        JSON.stringify({ toasts: slipToastsRef.current, lastPaymentId: lastPaymentIdRef.current }),
      );
    } catch {
      /* เก็บไม่ได้ก็แค่รีเฟรชแล้วกล่องหาย */
    }
  };
  useEffect(saveAlerts, [slipToasts]);

  const checkAlerts = useCallback(() => {
    const first = lastPaymentIdRef.current === null;
    return api
      .getAdminAlerts(first ? 0 : lastPaymentIdRef.current)
      .then((a) => {
        setPendingCount(a.pendingCount);
        if (!first && a.newSlips.length) {
          setSlipToasts((list) => [...list, ...a.newSlips].slice(-MAX_TOASTS));
          setAlertsVersion((v) => v + 1);
          if (soundOnRef.current) playAlertSound();
        }
        lastPaymentIdRef.current = Math.max(a.latestPaymentId, lastPaymentIdRef.current ?? 0);
        saveAlerts();
      })
      .catch(() => {}); // เช็คไม่สำเร็จ (เช่น เน็ตหลุด) รอบหน้าค่อยเช็คใหม่
  }, []);

  // เช็คทุกครั้งที่เปลี่ยนหน้า + ทุก 15 วินาที (เฉพาะตอนล็อกอินอยู่)
  useEffect(() => {
    if (admin) checkAlerts();
  }, [admin, checkAlerts, location.pathname]);

  useEffect(() => {
    if (!admin) return undefined;
    const id = setInterval(checkAlerts, ALERT_POLL_MS);
    return () => clearInterval(id);
  }, [admin, checkAlerts]);

  // จำนวนรอดำเนินการบนแท็บเบราว์เซอร์ เช่น "(2) Gens Karaoke" — เห็นได้แม้เปิดแท็บอื่นอยู่
  const baseTitleRef = useRef(document.title);
  useEffect(() => {
    document.title = pendingCount ? `(${pendingCount}) ${baseTitleRef.current}` : baseTitleRef.current;
  }, [pendingCount]);
  useEffect(() => () => (document.title = baseTitleRef.current), []);

  // ออกจากระบบ = ล้างแจ้งเตือนที่จำไว้ด้วย (คนถัดไปที่ล็อกอินในแท็บนี้จะไม่เห็นของเก่า)
  const handleLogout = () => {
    try {
      sessionStorage.removeItem(ALERTS_KEY);
    } catch {
      /* ไม่เป็นไร */
    }
    document.title = baseTitleRef.current; // เอาตัวเลขออกจากชื่อแท็บทันที
    logoutAdmin();
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    try {
      localStorage.setItem(SOUND_KEY, next ? 'on' : 'off');
    } catch {
      /* เก็บค่าไม่ได้ก็ใช้แค่รอบนี้ */
    }
    if (next) playAlertSound(); // เปิดเสียงแล้วเล่นให้ฟังหนึ่งครั้ง
  };

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
      {mobileOpen && <div className="admin-backdrop" onClick={() => setMobileOpen(false)} aria-hidden="true" />}

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
              <NavItem
                label="อนุมัติการจอง"
                icon={<ClipboardCheck />}
                active={isActive('/admin/bookings')}
                badge={pendingCount}
                onClick={() => go('/admin/bookings')}
              />
              <NavItem
                label="จองวอล์คอิน"
                icon={<Plus />}
                active={isActive('/admin/walkin')}
                onClick={() => go('/admin/walkin')}
              />
              <NavItem
                label="ประวัติการจอง"
                icon={<HistoryIcon />}
                active={isActive('/admin/history')}
                onClick={() => go('/admin/history')}
              />
            </div>
          </div>

          {/* กลุ่มเมนู: ตั้งค่า */}
          <div className="admin-nav-group">
            <div className="admin-nav-group-title">ตั้งค่า</div>
            <div className="admin-nav-items">
              <NavItem
                label="ตั้งค่าร้าน"
                icon={<Store />}
                active={isActive('/admin/shop-settings')}
                onClick={() => go('/admin/shop-settings')}
              />
              <NavItem
                label="ประเภทห้อง"
                icon={<LayoutGrid />}
                active={isActive('/admin/room-types')}
                onClick={() => go('/admin/room-types')}
              />
              <NavItem
                label="ตั้งค่าห้อง"
                icon={<DoorOpen />}
                active={isActive('/admin/room-settings')}
                onClick={() => go('/admin/room-settings')}
              />
            </div>
          </div>

          {/* กลุ่มเมนู: รายงาน */}
          <div className="admin-nav-group">
            <div className="admin-nav-group-title">รายงาน</div>
            <div className="admin-nav-items">
              <NavItem
                label="รายงานสรุป"
                icon={<CalendarIcon />}
                active={isActive('/admin/reports')}
                onClick={() => go('/admin/reports')}
              />
            </div>
          </div>
        </nav>
      </aside>

      {/* พื้นที่หลัก: header + Outlet */}
      <div className="admin-main-wrap">
        <header className="admin-header">
          {/* ปุ่ม toggle sidebar — ทำงานต่างกันบน mobile และ desktop */}
          <IconButton label="เมนู" onClick={toggleSidebar}>
            <Menu />
          </IconButton>
          <h1>{title}</h1>
          <div className="admin-header-actions">
            {/* เปิด/ปิดเสียงแจ้งเตือนสลิปใหม่ */}
            <IconButton label={soundOn ? 'ปิดเสียงแจ้งเตือน' : 'เปิดเสียงแจ้งเตือน'} onClick={toggleSound}>
              {soundOn ? <Volume2 /> : <VolumeX />}
            </IconButton>
            {/* ปุ่ม logout แสดงชื่อแอดมินปัจจุบัน */}
            <button type="button" className="user-pill" onClick={handleLogout} title="ออกจากระบบ">
              <Avatar name={admin.name || admin.username} size="sm" />
              <span>{admin.name || admin.username}</span>
              <LogOut style={{ width: 16, height: 16, color: 'var(--text-subtle)', marginLeft: 4 }} />
            </button>
          </div>
        </header>
        <main className="admin-main">
          <Outlet context={{ updateBadgeFromStats, alertsVersion }} />
        </main>
      </div>

      <AdminSlipToasts
        slips={slipToasts}
        onDismiss={(id) => setSlipToasts((list) => list.filter((s) => s.payment_id !== id))}
        onDismissAll={() => setSlipToasts([])}
      />
    </div>
  );
}
