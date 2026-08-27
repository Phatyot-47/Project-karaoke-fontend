import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import Button from './Button.jsx';
import { getCroppedImageFile } from '../utils/cropImage.js';

/**
 * ImageCropModal — โมดัลลาก/ซูมรูปในกรอบสัดส่วนคงที่ (คล้าย crop รูปโปรไฟล์) ก่อนอัปโหลดจริง
 *
 * การทำงาน:
 * 1. รับ imageSrc (data URL จาก FileReader) มาแสดงใน Cropper
 * 2. ผู้ใช้ปรับตำแหน่ง/zoom → onCropComplete บันทึก croppedAreaPixels ลง ref
 * 3. กด "ยืนยัน" → getCroppedImageFile() สร้าง File จาก canvas → onConfirm(file)
 * 4. กด "ยกเลิก" หรือ Esc หรือคลิก backdrop → onCancel()
 *
 * @param {string}   imageSrc  - Data URL ของรูปต้นฉบับ
 * @param {number}   aspect    - สัดส่วน (width/height) ของ crop frame เช่น 16/9
 * @param {string}   fileName  - ชื่อไฟล์ผลลัพธ์
 * @param {Function} onConfirm - รับ File ที่ crop แล้ว
 * @param {Function} onCancel  - ปิดโมดัลโดยไม่มีผลข้างเคียง
 */
export default function ImageCropModal({ imageSrc, aspect, fileName, onConfirm, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [ready, setReady] = useState(false);       // true เมื่อ Cropper พร้อมและมี croppedAreaPixels แล้ว
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  // ใช้ ref แทน state เพื่อไม่ให้ re-render ทุกครั้งที่ผู้ใช้ขยับ crop
  const croppedAreaPixelsRef = useRef(null);

  // ล็อก scroll ของ body ตลอดที่โมดัลเปิดอยู่ — คืนค่าเดิมเมื่อปิด
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  // ปิดโมดัลเมื่อกด Escape — cleanup listener เมื่อ onCancel เปลี่ยนหรือ unmount
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  // Cropper เรียก callback นี้ทุกครั้งที่ผู้ใช้หยุดขยับ/zoom
  const handleCropComplete = (_croppedArea, croppedAreaPixels) => {
    croppedAreaPixelsRef.current = croppedAreaPixels;
    setReady(true); // เปิดใช้งานปุ่ม "ยืนยัน"
  };

  // สร้าง File จากพื้นที่ที่ crop แล้วส่งให้ parent
  const handleConfirm = async () => {
    if (!croppedAreaPixelsRef.current) return;
    setConfirming(true);
    setError('');
    try {
      const file = await getCroppedImageFile(imageSrc, croppedAreaPixelsRef.current, fileName);
      onConfirm(file);
    } catch (err) {
      setError(err.message);
      setConfirming(false);
    }
  };

  // ปิดโมดัลเมื่อคลิก backdrop โดยตรง (ไม่ปิดถ้าคลิกที่ตัว modal)
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onCancel();
  };

  // ใช้ createPortal เพื่อ render โมดัลที่ document.body โดยตรง
  // ป้องกัน stacking context ของ parent element บดบังโมดัล (z-index issue)
  return createPortal(
    <div className="crop-modal-backdrop" onClick={handleBackdropClick}>
      <div className="crop-modal" role="dialog" aria-modal="true" aria-label="ครอปรูปภาพ">
        {/* พื้นที่ Cropper — ผู้ใช้ลากและ zoom รูปที่นี่ */}
        <div className="crop-modal-stage">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        {/* Slider ควบคุม zoom */}
        <div className="crop-modal-zoom">
          <span>ซูม</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </div>

        {error && <div className="field-error">{error}</div>}

        {/* ปุ่มยกเลิก/ยืนยัน — ปุ่มยืนยัน disabled จนกว่า Cropper จะพร้อม */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="outline" onClick={onCancel} disabled={confirming}>ยกเลิก</Button>
          <Button variant="accent" onClick={handleConfirm} disabled={!ready || confirming}>
            {confirming ? 'กำลังบันทึก...' : 'ยืนยัน'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
