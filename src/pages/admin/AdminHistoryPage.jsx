import { useEffect, useState } from 'react';
import Card from '../../components/Card.jsx';
import Tag from '../../components/Tag.jsx';
import api from '../../api/client.js';
import { getBookingDisplayStatus, formatDateTimeRange, money } from '../../utils/format.js';
import { resolveRoomImage } from '../../utils/roomImage.js';
import useNowTick from '../../hooks/useNowTick.js';

export default function AdminHistoryPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useNowTick(); // บังคับ re-render ทุก 30s ให้ getBookingDisplayStatus() คำนวณสถานะใหม่ตามเวลาจริง

  useEffect(() => {
    api.getBookingHistory().then(setRows).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 1900, margin: '0 auto' }}>
      {error && <div className="field-error" style={{ marginBottom: 12 }}>{error}</div>}
      <Card title="ประวัติการจองทั้งหมด" subtitle="รายการจองทุกสถานะ" pad={false}>
        {loading && <p style={{ color: 'var(--text-muted)', padding: 20 }}>กำลังโหลด...</p>}
        {!loading && !rows.length && <p style={{ color: 'var(--text-muted)', padding: 20 }}>ยังไม่มีข้อมูล</p>}
        {rows.map((b) => {
          const statusInfo = getBookingDisplayStatus(b);
          return (
            <div className="booking-row" key={b.booking_id}>
              <div className="booking-photo" style={{ backgroundImage: `url(${resolveRoomImage(b)})` }} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 'var(--text-md)', color: 'var(--text-strong)' }}>{b.room_name}</span>
                  <span className="num" style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{money(b.price_total)} บาท</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 4, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  <span>{formatDateTimeRange(b.start_datetime, b.end_datetime)}</span>
                  <span>ลูกค้า: {b.customer_name || 'ไม่ระบุ'}</span>
                </div>
                {b.evidence_url && (
                  <div style={{ marginTop: 10 }}>
                    <img
                      src={b.evidence_url}
                      alt="สลิปเงินมัดจำ"
                      style={{ width: 180, height: 180, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--border-default)', background: '#fff' }}
                    />
                  </div>
                )}
              </div>
              <Tag tone={statusInfo.tone} dot>{statusInfo.label}</Tag>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
