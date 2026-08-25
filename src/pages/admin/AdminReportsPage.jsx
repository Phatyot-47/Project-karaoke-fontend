import { useEffect, useMemo, useState } from 'react';
import Card from '../../components/Card.jsx';
import Tabs from '../../components/Tabs.jsx';
import api from '../../api/client.js';
import { money } from '../../utils/format.js';

const TABS = [
  { id: 'day', label: 'รายวัน' },
  { id: 'week', label: 'รายสัปดาห์' },
  { id: 'month', label: 'รายเดือน' },
];

const RANGE_LABEL = { day: '7 วันล่าสุด', week: '4 สัปดาห์ล่าสุด', month: '6 เดือนล่าสุด' };

function formatPeriodLabel(iso, period) {
  const d = new Date(iso);
  if (period === 'month') return d.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' });
  if (period === 'week') return `สัปดาห์ ${d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`;
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

export default function AdminReportsPage() {
  const [period, setPeriod] = useState('day');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.getReports(period).then(setReport).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [period]);

  const maxTrendValue = useMemo(() => {
    if (!report?.trend?.length) return 0;
    return Math.max(...report.trend.map((t) => Number(t.revenue) || 0));
  }, [report]);

  const maxRoomRevenue = useMemo(() => {
    if (!report?.byRoom?.length) return 0;
    return Math.max(...report.byRoom.map((r) => Number(r.revenue) || 0));
  }, [report]);

  return (
    <div style={{ maxWidth: 1900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Tabs items={TABS} value={period} onChange={setPeriod} />

      {error && <div className="field-error">{error}</div>}
      {loading && <p style={{ color: 'var(--text-muted)' }}>กำลังโหลด...</p>}

      {report && (
        <>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Card style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>รายได้รวม ({RANGE_LABEL[period]})</div>
              <div className="num" style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--green-700)' }}>฿ {money(report.totals.total_revenue)}</div>
            </Card>
            <Card style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>จำนวนการจอง</div>
              <div className="num" style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--primary-700)' }}>{report.totals.total_bookings}</div>
            </Card>
            <Card style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>ยอดเฉลี่ย/รายการ</div>
              <div className="num" style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text-strong)' }}>฿ {money(report.totals.avg_ticket)}</div>
            </Card>
          </div>

          <Card title="แนวโน้มรายได้" subtitle={`รายได้${period === 'day' ? 'รายวัน' : period === 'week' ? 'รายสัปดาห์' : 'รายเดือน'} (${RANGE_LABEL[period]})`}>
            {!report.trend.length && <p style={{ color: 'var(--text-muted)' }}>ยังไม่มีข้อมูล</p>}
            <div className="chart-bars">
              {report.trend.map((t, i) => (
                <div className="chart-bar-col" key={t.period}>
                  <span className="num" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{money(t.revenue)}</span>
                  <div
                    className={`chart-bar${i === report.trend.length - 1 ? ' last' : ''}`}
                    style={{ height: `${maxTrendValue ? Math.max(8, (Number(t.revenue) / maxTrendValue) * 220) : 8}px` }}
                  />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-subtle)', whiteSpace: 'nowrap' }}>{formatPeriodLabel(t.period, period)}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="รายได้แยกตามห้อง" pad={false}>
            {!report.byRoom.length && <p style={{ color: 'var(--text-muted)', padding: 20 }}>ยังไม่มีข้อมูล</p>}
            {report.byRoom.map((rb) => (
              <div className="room-breakdown-row" key={rb.room_name}>
                <span style={{ fontWeight: 600, color: 'var(--text-strong)', width: 182, flex: 'none' }}>{rb.room_name}</span>
                <div className="room-breakdown-track">
                  <div className="room-breakdown-fill" style={{ width: `${maxRoomRevenue ? (Number(rb.revenue) / maxRoomRevenue) * 100 : 0}%` }} />
                </div>
                <span className="num" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', width: 117, textAlign: 'right' }}>฿ {money(rb.revenue)}</span>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}
