/**
 * ส่วนแสดงรายละเอียดของรายการจองที่ใช้ซ้ำหลายหน้า (ประวัติลูกค้า / อนุมัติการจอง / ประวัติแอดมิน)
 */

import { fileUrl } from '../api/client.js';
import { formatPhone } from '../utils/format.js';

/**
 * ข้อมูลลูกค้าของการจอง (หน้าแอดมิน) — ชื่อ + เบอร์โทร กดโทรได้
 * จองออนไลน์ = ชื่อ/เบอร์ที่ลูกค้าใช้ล็อกอิน / วอล์คอิน = ชื่อ/เบอร์ที่แอดมินกรอก (ไม่กรอกเบอร์ = ไม่ระบุ)
 */
export function CustomerInfo({ booking }) {
  const isWalkIn = booking.booking_source === 'admin_walkin';
  const kind = isWalkIn ? 'ลูกค้าหน้าร้าน' : 'สมาชิก (จองออนไลน์)';
  const name = booking.customer_name || 'ไม่ระบุชื่อ';
  return (
    <div className="booking-customer">
      <span className="booking-customer-name">{name}</span>
      {/* วอล์คอินที่ไม่กรอกชื่อ ระบบตั้งชื่อเป็น "ลูกค้าหน้าร้าน" อยู่แล้ว ไม่ต้องแสดงซ้ำ */}
      {name !== kind && <span className="booking-customer-kind">{kind}</span>}
      {booking.customer_phone ? (
        <a className="booking-customer-phone num" href={`tel:${booking.customer_phone}`}>
          โทร {formatPhone(booking.customer_phone)}
        </a>
      ) : (
        <span className="booking-customer-kind">ไม่มีเบอร์โทร</span>
      )}
    </div>
  );
}

/** หมายเหตุของการจอง (รวมบรรทัดประวัติ [ย้ายห้อง ...] ที่ระบบต่อท้ายไว้) */
export function BookingNote({ note }) {
  if (!note) return null;
  return (
    <div style={{ marginTop: 8, fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', whiteSpace: 'pre-line' }}>
      หมายเหตุ: {note}
    </div>
  );
}

/** กล่องสีแดงเหตุผล — รายการที่ถูกยกเลิก หรือบันทึกว่าไม่มาใช้บริการ (No-show) */
export function CancelReason({ booking }) {
  const label = { cancelled: 'เหตุผลที่ยกเลิก', no_show: 'ไม่มาใช้บริการ' }[booking.booking_status];
  if (!label || !booking.cancel_reason) return null;
  return (
    <div
      style={{
        marginTop: 8,
        fontSize: 'var(--text-2xs)',
        color: 'var(--red-600)',
        background: 'var(--red-50)',
        borderRadius: 6,
        padding: '4px 8px',
      }}
    >
      {label}: {booking.cancel_reason}
    </div>
  );
}

/** รูปสลิปโอนเงินมัดจำขนาดย่อ */
export function SlipImage({ src }) {
  return (
    <img
      src={fileUrl(src)}
      alt="สลิปเงินมัดจำ"
      style={{
        width: 120,
        height: 120,
        objectFit: 'contain',
        borderRadius: 6,
        border: '1px solid var(--border-default)',
        background: '#fff',
      }}
    />
  );
}
