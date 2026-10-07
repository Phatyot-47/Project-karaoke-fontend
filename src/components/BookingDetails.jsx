/**
 * ส่วนแสดงรายละเอียดของรายการจองที่ใช้ซ้ำหลายหน้า (ประวัติลูกค้า / อนุมัติการจอง / ประวัติแอดมิน)
 */

/** หมายเหตุของการจอง (รวมบรรทัดประวัติ [ย้ายห้อง ...] ที่ระบบต่อท้ายไว้) */
export function BookingNote({ note }) {
  if (!note) return null;
  return (
    <div style={{ marginTop: 8, fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', whiteSpace: 'pre-line' }}>
      หมายเหตุ: {note}
    </div>
  );
}

/** กล่องสีแดง "เหตุผลที่ยกเลิก" — แสดงเฉพาะรายการที่ถูกยกเลิกและมีเหตุผล */
export function CancelReason({ booking }) {
  if (booking.booking_status !== 'cancelled' || !booking.cancel_reason) return null;
  return (
    <div style={{ marginTop: 8, fontSize: 'var(--text-2xs)', color: 'var(--red-600)', background: 'var(--red-50)', borderRadius: 6, padding: '4px 8px' }}>
      เหตุผลที่ยกเลิก: {booking.cancel_reason}
    </div>
  );
}

/** รูปสลิปโอนเงินมัดจำขนาดย่อ */
export function SlipImage({ src }) {
  return (
    <img
      src={src}
      alt="สลิปเงินมัดจำ"
      style={{ width: 120, height: 120, objectFit: 'contain', borderRadius: 6, border: '1px solid var(--border-default)', background: '#fff' }}
    />
  );
}
