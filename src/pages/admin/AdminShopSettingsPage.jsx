// หน้าแอดมิน "ตั้งค่าร้าน" (/admin/shop-settings) — ข้อมูลร้าน, บัญชีรับโอน/QR, พีคไทม์,
// เวลาเปิด-ปิด และนโยบายมัดจำ/ยกเลิก
import { useEffect, useState } from 'react';
import Card from '../../components/Card.jsx';
import Input from '../../components/Input.jsx';
import Select from '../../components/Select.jsx';
import Button from '../../components/Button.jsx';
import UploadSlot from '../../components/UploadSlot.jsx';
import SavedNotice from '../../components/SavedNotice.jsx';
import useSavedFlag from '../../hooks/useSavedFlag.js';
import api from '../../api/client.js';
import { DAY_LABELS } from '../../utils/format.js';

const HOUR_OPTIONS = Array.from({ length: 25 }, (_, i) => i);
const BANKS = ['กรุงไทย', 'กสิกรไทย', 'ไทยพาณิชย์', 'กรุงเทพ', 'ทหารไทยธนชาต', 'ออมสิน'];

// นโยบายจาก API → ค่าที่ใช้ในฟอร์ม (ช่องตัวเลขเป็นสตริงทั้งหมด ช่องว่าง = ไม่กำหนด)
const toPolicyForm = (p) => ({
  depositPercent: p ? String(Number(p.deposit_percent)) : '20',
  cancelHoursBefore: p?.cancel_hours_before == null ? '1' : String(p.cancel_hours_before),
  allowEditBeforeHours: p?.allow_edit_before_hours == null ? '' : String(p.allow_edit_before_hours),
  refundPolicyDesc: p?.refund_policy_desc || '',
  noShowPolicyDesc: p?.no_show_policy_desc || '',
});

export default function AdminShopSettingsPage() {
  const [form, setForm] = useState(null);
  // นโยบายมัดจำ/ยกเลิก (ขอบเขตข้อ 2.3) — savedPolicy ไว้เทียบว่ามีการแก้ไขไหม (ไม่แก้ = ไม่สร้างฉบับใหม่)
  const [policy, setPolicy] = useState(toPolicyForm(null));
  const [savedPolicy, setSavedPolicy] = useState(toPolicyForm(null));
  const [hours, setHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { saved, flashSaved } = useSavedFlag();

  useEffect(() => {
    api
      .getShop()
      .then((data) => {
        setForm(data);
        setHours(data.hours || []);
        setPolicy(toPolicyForm(data.policy));
        setSavedPolicy(toPolicyForm(data.policy));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const setPolicyField = (field) => (e) => setPolicy((p) => ({ ...p, [field]: e.target.value }));

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
        floorPlanUrl: form.floor_plan_url,
      });
      if (JSON.stringify(policy) !== JSON.stringify(savedPolicy)) {
        const newPolicy = await api.updatePolicy(policy);
        setSavedPolicy(toPolicyForm(newPolicy));
      }
      if (hours.length) {
        await api.updateShopHours(
          hours.map((h) => ({ dayOfWeek: h.day_of_week, openHour: h.open_hour, closeHour: h.close_hour })),
        );
      }
      flashSaved();
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
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && <div className="field-error">{error}</div>}

      <Card title="ข้อมูลร้าน">
        <div className="admin-form-2col">
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

      <Card title="แผนผังห้องของร้าน" subtitle='แสดงในหน้าเลือกห้องของลูกค้า (ปุ่ม "ดูแผนผังห้อง")'>
        <div style={{ width: '100%', maxWidth: 480 }}>
          <UploadSlot
            placeholder="อัปโหลดรูปแผนผังห้อง"
            value={form.floor_plan_url || null}
            onChange={(url) => setForm((f) => ({ ...f, floor_plan_url: url }))}
            height={240}
          />
        </div>
      </Card>

      <Card title="เวลาเปิด-ปิดร้าน" subtitle="กำหนดเวลาเปิด-ปิดแยกแต่ละวันในสัปดาห์">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sortedHours.map((d) => (
            <div key={d.day_of_week} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  minWidth: 80,
                  width: 90,
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  color: 'var(--text-strong)',
                  flex: 'none',
                }}
              >
                {DAY_LABELS[d.day_of_week] ?? `วันที่ ${d.day_of_week}`}
              </span>
              <div style={{ flex: '1 1 110px', minWidth: 90 }}>
                <Select value={d.open_hour} onChange={setHourField(d.day_of_week, 'open_hour')}>
                  {HOUR_OPTIONS.map((h) => (
                    <option key={h} value={h}>
                      {h}:00
                    </option>
                  ))}
                </Select>
              </div>
              <span style={{ color: 'var(--text-muted)' }}>—</span>
              <div style={{ flex: '1 1 110px', minWidth: 90 }}>
                <Select value={d.close_hour} onChange={setHourField(d.day_of_week, 'close_hour')}>
                  {HOUR_OPTIONS.map((h) => (
                    <option key={h} value={h}>
                      {h}:00
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          ))}
          {!sortedHours.length && (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>ยังไม่มีข้อมูลเวลาเปิด-ปิด</p>
          )}
        </div>
      </Card>

      <Card title="นโยบายมัดจำและการยกเลิก" subtitle="มีผลกับการจองใหม่ — การจองที่ทำไปแล้วใช้นโยบาย ณ ตอนที่จอง">
        <div className="admin-form-2col">
          <Input
            label="มัดจำ (% ของยอดรวม)"
            type="number"
            value={policy.depositPercent}
            onChange={setPolicyField('depositPercent')}
          />
          <Input
            label="ยกเลิกได้ล่วงหน้า (ชั่วโมง)"
            type="number"
            value={policy.cancelHoursBefore}
            onChange={setPolicyField('cancelHoursBefore')}
          />
          <Input
            label="แก้ไขการจองได้ล่วงหน้า (ชั่วโมง)"
            type="number"
            value={policy.allowEditBeforeHours}
            onChange={setPolicyField('allowEditBeforeHours')}
            hint="เว้นว่าง = ใช้ค่าเดียวกับการยกเลิก"
          />
          <div />
          <div style={{ gridColumn: '1 / -1' }}>
            <Input
              label="นโยบายการคืนเงินมัดจำ"
              value={policy.refundPolicyDesc}
              onChange={setPolicyField('refundPolicyDesc')}
              placeholder="เช่น มัดจำไม่สามารถขอคืนได้ทุกกรณี"
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Input
              label="นโยบายกรณีไม่มาใช้บริการ (No-show)"
              value={policy.noShowPolicyDesc}
              onChange={setPolicyField('noShowPolicyDesc')}
              placeholder="เช่น ไม่มาตามเวลาที่จอง ร้านไม่คืนเงินมัดจำ"
            />
          </div>
        </div>
      </Card>

      <Card title="พีคไทม์" subtitle="ช่วงเวลาที่คิดค่าบริการเพิ่ม">
        <div className="admin-form-2col">
          <Input
            label="เริ่มพีคไทม์เวลา (HH:MM)"
            value={form.peak_start_time || ''}
            onChange={setField('peak_start_time')}
            placeholder="18:00"
          />
          <Input
            label="ค่าบริการเพิ่ม (บาท/ชม.)"
            type="number"
            value={form.peak_surcharge || ''}
            onChange={setField('peak_surcharge')}
          />
        </div>
      </Card>

      <Card title="บัญชีธนาคารสำหรับรับเงิน" subtitle="ใช้แสดงในหน้าชำระมัดจำของลูกค้า">
        <div className="admin-form-2col">
          <Select label="ธนาคาร" value={form.bank_name || ''} onChange={setField('bank_name')}>
            {BANKS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Select>
          <Input label="เลขบัญชี" value={form.bank_account_no || ''} onChange={setField('bank_account_no')} />
          <div style={{ gridColumn: '1 / -1' }}>
            <Input label="ชื่อบัญชี" value={form.bank_account_name || ''} onChange={setField('bank_account_name')} />
          </div>
        </div>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-body)' }}>
            รูป QR Code สำหรับรับชำระเงิน (PromptPay)
          </div>
          <div style={{ width: '100%', maxWidth: 240, height: 240 }}>
            <UploadSlot
              placeholder="อัปโหลดรูป QR Code"
              value={form.qr_code_url || null}
              onChange={(url) => setForm((f) => ({ ...f, qr_code_url: url }))}
              height={240}
              cropAspectRatio={1}
            />
          </div>
          <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>
            รูปนี้จะไปแสดงในหน้าชำระมัดจำของลูกค้าแทนช่องว่างเปล่า
          </span>
        </div>
      </Card>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
        <SavedNotice show={saved} />
        <Button variant="primary" size="md" onClick={handleSave} disabled={saving}>
          {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </Button>
      </div>
    </div>
  );
}
