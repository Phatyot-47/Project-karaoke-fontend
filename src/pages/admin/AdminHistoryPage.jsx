// หน้าแอดมิน "ประวัติการจอง" (/admin/history) — รายการจองทุกสถานะ 7 วันล่าสุด
// แบ่งเป็นการ์ดรายวัน วันล่าสุดอยู่บน (วันที่ไม่มีการจองก็แสดง ให้เห็นครบ 7 วัน)
import { useEffect, useState } from 'react';
import Card from '../../components/Card.jsx';
import Tag from '../../components/Tag.jsx';
import { SlipImage } from '../../components/BookingDetails.jsx';
import api from '../../api/client.js';
import {
  getBookingDisplayStatus,
  formatDateTimeRange,
  formatThaiDate,
  money,
  recentBangkokDates,
  DAY_LABELS,
} from '../../utils/format.js';
import { resolveRoomImage } from '../../utils/roomImage.js';
import useNowTick from '../../hooks/useNowTick.js';

const HISTORY_DAYS = 7; // ต้องตรงกับ backend (GET /api/admin/bookings/history)

/** หัวการ์ดของแต่ละวัน เช่น "วันนี้ · วันจันทร์ที่ 12 ตุลาคม 2569" */
function dayTitle(dateISO, index) {
  const [y, m, d] = dateISO.split('-').map(Number);
  const weekday = DAY_LABELS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  const full = `วัน${weekday}ที่ ${formatThaiDate(dateISO)}`;
  if (index === 0) return `วันนี้ · ${full}`;
  if (index === 1) return `เมื่อวาน · ${full}`;
  return full;
}

/** รายการจอง 1 แถว (รูปห้อง, ชื่อห้อง/ยอด, เวลา/ลูกค้า, สลิป, สถานะ) */
function HistoryRow({ b }) {
  const statusInfo = getBookingDisplayStatus(b);
  return (
    <div className="booking-row">
      <div className="booking-photo" style={{ backgroundImage: `url(${resolveRoomImage(b)})` }} />
      <div style={{ flex: 1, minWidth: 180 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-strong)' }}>
            {b.room_name}
          </span>
          <span className="num" style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-strong)' }}>
            {money(b.price_total)} บาท
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
            marginTop: 4,
            fontSize: 'var(--text-2xs)',
            color: 'var(--text-muted)',
          }}
        >
          <span>{formatDateTimeRange(b.start_datetime, b.end_datetime)}</span>
          <span>ลูกค้า: {b.customer_name || 'ไม่ระบุ'}</span>
        </div>
        {b.evidence_url && (
          <div style={{ marginTop: 8 }}>
            {(b.slip_urls || [b.evidence_url]).map((url, i) => (
              <SlipImage key={`${i}-${url}`} src={url} />
            ))}
          </div>
        )}
      </div>
      <Tag tone={statusInfo.tone} dot>
        {statusInfo.label}
      </Tag>
    </div>
  );
}

export default function AdminHistoryPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useNowTick(); // วาดหน้าใหม่ทุก 30 วินาที ป้ายสถานะ (เช่น "รอ Check-in") จะได้เปลี่ยนตามเวลาจริง

  useEffect(() => {
    api
      .getBookingHistory()
      .then(setRows)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto' }}>
      {error && (
        <div className="field-error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 12 }}>
        รายการจองทุกสถานะ 7 วันล่าสุด แบ่งตามวันที่ใช้บริการ — วันล่าสุดอยู่ด้านบน
      </p>
      {loading && <p style={{ color: 'var(--text-muted)' }}>กำลังโหลด...</p>}
      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {recentBangkokDates(HISTORY_DAYS).map((dateISO, index) => {
            const dayRows = rows.filter((b) => b.booking_date === dateISO);
            return (
              <Card
                key={dateISO}
                className="history-day"
                title={dayTitle(dateISO, index)}
                subtitle={dayRows.length ? `${dayRows.length} รายการ` : 'ไม่มีการจอง'}
                pad={false}
              >
                {dayRows.map((b) => (
                  <HistoryRow key={b.booking_id} b={b} />
                ))}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
