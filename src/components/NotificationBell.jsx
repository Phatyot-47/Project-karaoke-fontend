// กระดิ่งแจ้งเตือนบนเมนูลูกค้า — ตัวเลขสีแดง = แจ้งเตือนที่ยังไม่อ่าน, กดแล้วเปิดรายการแจ้งเตือน
// แจ้งเตือนมาจากตอนร้าน/ระบบเปลี่ยนสถานะการจอง (ยืนยัน, ยกเลิก, สลิปไม่ผ่าน, ย้ายห้อง ฯลฯ)
// ดึงใหม่ทุก 30 วินาที และทุกครั้งที่เปลี่ยนหน้า
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell } from './Icons.jsx';
import api from '../api/client.js';
import { formatBookedAt } from '../utils/format.js';

const POLL_MS = 30000;

// สีแถบซ้ายของแต่ละประเภท: ยืนยัน = เขียว / ย้ายห้อง = น้ำเงิน / ที่เหลือ (ยกเลิก, สลิปไม่ผ่าน ฯลฯ) = แดง
const TYPE_TONE = { booking_confirmed: 'success', room_changed: 'info' };

export default function NotificationBell() {
  const [data, setData] = useState({ unreadCount: 0, items: [] });
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const load = useCallback(
    () =>
      api
        .listNotifications()
        .then(setData)
        .catch(() => {}), // โหลดไม่ได้ก็แค่ไม่อัปเดตกระดิ่ง ไม่กระทบหน้าอื่น
    [],
  );

  useEffect(() => {
    load();
  }, [load, location.pathname]);

  useEffect(() => {
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  // คลิกนอกกล่องแจ้งเตือน = ปิด
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  // กดแจ้งเตือน = อ่านแล้ว + ไปหน้าประวัติการจองดูรายละเอียด
  const openItem = async (item) => {
    if (!item.is_read) await api.markNotificationRead(item.notification_id).catch(() => {});
    setOpen(false);
    load();
    navigate('/history');
  };

  const readAll = async () => {
    await api.markAllNotificationsRead().catch(() => {});
    load();
  };

  const count = data.unreadCount;

  return (
    <div className="notif-wrap" ref={wrapRef}>
      <button
        type="button"
        className="notif-btn"
        aria-label={count ? `แจ้งเตือน (ยังไม่อ่าน ${count})` : 'แจ้งเตือน'}
        title="แจ้งเตือน"
        onClick={() => setOpen((o) => !o)}
      >
        <Bell style={{ width: 18, height: 18 }} />
        {count > 0 && <span className="notif-badge">{count > 9 ? '9+' : count}</span>}
      </button>

      {open && (
        <div className="card notif-panel" role="dialog" aria-label="แจ้งเตือน">
          <div className="notif-panel-header">
            <span>แจ้งเตือน</span>
            {count > 0 && (
              <button type="button" className="notif-read-all" onClick={readAll}>
                อ่านทั้งหมด
              </button>
            )}
          </div>
          {!data.items.length && <p className="notif-empty">ยังไม่มีแจ้งเตือน</p>}
          {data.items.map((n) => (
            <button
              key={n.notification_id}
              type="button"
              className={`notif-item notif-${TYPE_TONE[n.type] || 'danger'}${n.is_read ? '' : ' unread'}`}
              onClick={() => openItem(n)}
            >
              <span className="notif-title">{n.title}</span>
              {n.message && <span className="notif-message">{n.message}</span>}
              <span className="notif-time">{formatBookedAt(n.created_at)} น.</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
