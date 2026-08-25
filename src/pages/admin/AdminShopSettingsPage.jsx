import { useEffect, useState } from 'react';
import Card from '../../components/Card.jsx';
import Input from '../../components/Input.jsx';
import Select from '../../components/Select.jsx';
import Button from '../../components/Button.jsx';
import UploadSlot from '../../components/UploadSlot.jsx';
import { Check } from '../../components/Icons.jsx';
import api from '../../api/client.js';
import { DAY_LABELS } from '../../utils/format.js';

const HOUR_OPTIONS = Array.from({ length: 25 }, (_, i) => i);
const BANKS = ['กรุงไทย', 'กสิกรไทย', 'ไทยพาณิชย์', 'กรุงเทพ', 'ทหารไทยธนชาต', 'ออมสิน'];

export default function AdminShopSettingsPage() {
  const [form, setForm] = useState(null);
  const [hours, setHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getShop()
      .then((data) => { setForm(data); setHours(data.hours || []); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const setHourField = (dayOfWeek, field) => (e) => {
    const value = Number(e.target.value);
    setHours((hrs) => hrs.map((h) => (h.day_of_week === dayOfWeek ? { ...h, [field]: value } : h)));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.updateShop({
        name: form.name,
        taxId: form.tax_id,
        phone: form.phone,
        address: form.address,
        bankName: form.bank_name,
        bankAccountNo: form.bank_account_no,
        bankAccountName: form.bank_account_name,
        qrCodeUrl: form.qr_code_url,
        peakStartTime: form.peak_start_time,
        peakSurcharge: form.peak_surcharge,
      });
      if (hours.length) {
        await api.updateShopHours(hours.map((h) => ({ dayOfWeek: h.day_of_week, openHour: h.open_hour, closeHour: h.close_hour })));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>กำลังโหลด...</p>;
  if (!form) return <div className="field-error">{error || 'ไม่พบข้อมูลร้าน'}</div>;

  const sortedHours = [...hours].sort((a, b) => a.day_of_week - b.day_of_week);

  return (
    <div style={{ maxWidth: 1900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && <div className="field-error">{error}</div>}

      <Card title="ข้อมูลร้าน">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <Input label="ชื่อร้าน" value={form.name} onChange={setField('name')} />
          </div>
          <Input label="เลขทะเบียนพาณิชย์ / ผู้เสียภาษี" value={form.tax_id || ''} onChange={setField('tax_id')} />
          <Input label="เบอร์โทรร้าน" value={form.phone || ''} onChange={setField('phone')} />
          <div style={{ gridColumn: '1 / -1' }}>
            <Input label="ที่อยู่ร้าน" value={form.address || ''} onChange={setField('address')} />
          </div>
        </div>
      </Card>

      <Card title="เวลาเปิด-ปิดร้าน" subtitle="กำหนดเวลาเปิด-ปิดแยกแต่ละวันในสัปดาห์">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sortedHours.map((d) => (
            <div key={d.day_of_week} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ width: 117, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-strong)', flex: 'none' }}>
                {DAY_LABELS[d.day_of_week] ?? `วันที่ ${d.day_of_week}`}
              </span>
              <div style={{ width: 221 }}>
                <Select value={d.open_hour} onChange={setHourField(d.day_of_week, 'open_hour')}>
                  {HOUR_OPTIONS.map((h) => <option key={h} value={h}>{h}:00</option>)}
                </Select>
              </div>
              <span style={{ color: 'var(--text-muted)' }}>—</span>
              <div style={{ width: 221 }}>
                <Select value={d.close_hour} onChange={setHourField(d.day_of_week, 'close_hour')}>
                  {HOUR_OPTIONS.map((h) => <option key={h} value={h}>{h}:00</option>)}
                </Select>
              </div>
            </div>
          ))}
          {!sortedHours.length && <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>ยังไม่มีข้อมูลเวลาเปิด-ปิด</p>}
        </div>
      </Card>

      <Card title="พีคไทม์" subtitle="ช่วงเวลาที่คิดค่าบริการเพิ่ม">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Input label="เริ่มพีคไทม์เวลา (HH:MM)" value={form.peak_start_time || ''} onChange={setField('peak_start_time')} placeholder="18:00" />
          <Input label="ค่าบริการเพิ่ม (บาท/ชม.)" type="number" value={form.peak_surcharge || ''} onChange={setField('peak_surcharge')} />
        </div>
      </Card>

      <Card title="บัญชีธนาคารสำหรับรับเงิน" subtitle="ใช้แสดงในหน้าชำระมัดจำของลูกค้า">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Select label="ธนาคาร" value={form.bank_name || ''} onChange={setField('bank_name')}>
            {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
          </Select>
          <Input label="เลขบัญชี" value={form.bank_account_no || ''} onChange={setField('bank_account_no')} />
          <div style={{ gridColumn: '1 / -1' }}>
            <Input label="ชื่อบัญชี" value={form.bank_account_name || ''} onChange={setField('bank_account_name')} />
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-body)' }}>
            รูป QR Code สำหรับรับชำระเงิน (PromptPay)
          </div>
          <div style={{ width: '100%', maxWidth: 320, height: 320 }}>
            <UploadSlot
              placeholder="อัปโหลดรูป QR Code"
              value={form.qr_code_url || null}
              onChange={(url) => setForm((f) => ({ ...f, qr_code_url: url }))}
              height={320}
              cropAspectRatio={1}
            />
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-subtle)' }}>
            รูปนี้จะไปแสดงในหน้าชำระมัดจำของลูกค้าแทนช่องว่างเปล่า
          </span>
        </div>
      </Card>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
        {saved && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--green-700)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
            <Check style={{ width: 26, height: 26 }} /> บันทึกสำเร็จ
          </span>
        )}
        <Button variant="primary" size="lg" onClick={handleSave} disabled={saving}>
          {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </Button>
      </div>
    </div>
  );
}
