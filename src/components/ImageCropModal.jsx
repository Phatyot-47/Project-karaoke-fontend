// หน้าต่างครอปรูป (ลาก/ซูม) ก่อนอัปโหลด — ใช้กับรูปห้องและรูปโปรไฟล์
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import Button from './Button.jsx';
import { getCroppedImageFile } from '../utils/cropImage.js';

/**
 * หน้าต่างเด้ง (โมดัล) ให้ลาก/ซูมรูปให้พอดีกรอบ ก่อนอัปโหลด — เหมือนตอนตั้งรูปโปรไฟล์ในโซเชียล
 *
 * ขั้นตอน:
 * 1. รับรูปที่ผู้ใช้เลือก (imageSrc) มาแสดงในกรอบ
 * 2. ผู้ใช้ลาก/ซูม → จำตำแหน่งที่ครอปไว้
 * 3. กด "ยืนยัน" → ตัดรูปเฉพาะส่วนในกรอบ แล้วส่งไฟล์ใหม่กลับไปที่ onConfirm(file)
 * 4. กด "ยกเลิก" / กด Esc / คลิกพื้นที่มืดรอบๆ → onCancel() ปิดหน้าต่าง
 *
 * @param {string}   imageSrc  - รูปต้นฉบับ
 * @param {number}   aspect    - สัดส่วนกรอบ (กว้าง/สูง) เช่น 16/9
 * @param {string}   fileName  - ชื่อไฟล์ที่จะได้
 * @param {Function} onConfirm - ได้ไฟล์รูปที่ครอปแล้ว
 * @param {Function} onCancel  - ปิดโดยไม่ทำอะไร
 */
export default function ImageCropModal({ imageSrc, aspect, fileName, onConfirm, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [ready, setReady] = useState(false); // true = รูปโหลดเสร็จและรู้ตำแหน่งครอปแล้ว (กดยืนยันได้)
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  // เก็บตำแหน่งครอปใน ref (ไม่ใช่ state) เพราะไม่ต้องวาดหน้าจอใหม่ทุกครั้งที่ขยับ
  const croppedAreaPixelsRef = useRef(null);

  // ระหว่างเปิดหน้าต่างนี้ ห้ามหน้าเว็บด้านหลังเลื่อน (ปิดแล้วเลื่อนได้ตามเดิม)
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // กดปุ่ม Esc = ปิดหน้าต่าง (เลิกฟังปุ่มเมื่อหน้าต่างปิดไปแล้ว)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  // ทำงานทุกครั้งที่ผู้ใช้หยุดลาก/ซูม → จำตำแหน่งครอปล่าสุด
  const handleCropComplete = (_croppedArea, croppedAreaPixels) => {
    croppedAreaPixelsRef.current = croppedAreaPixels;
    setReady(true); // เปิดใช้งานปุ่ม "ยืนยัน"
  };

  // ตัดรูปตามกรอบ แล้วส่งไฟล์ให้หน้าที่เปิดหน้าต่างนี้
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

  // คลิกพื้นที่มืดรอบๆ = ปิด (คลิกในกล่องไม่ปิด)
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onCancel();
  };

  // วางหน้าต่างไว้ท้าย <body> โดยตรง (createPortal) จะได้ลอยอยู่บนสุดเสมอ ไม่โดนกล่องอื่นบัง
  return createPortal(
    <div className="crop-modal-backdrop" onClick={handleBackdropClick}>
      <div className="crop-modal" role="dialog" aria-modal="true" aria-label="ครอปรูปภาพ">
        {/* พื้นที่ลากและซูมรูป */}
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

        {/* แถบเลื่อนซูม */}
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

        {/* ปุ่มยกเลิก/ยืนยัน — ปุ่มยืนยันกดได้เมื่อรูปพร้อมแล้ว */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="outline" onClick={onCancel} disabled={confirming}>
            ยกเลิก
          </Button>
          <Button variant="accent" onClick={handleConfirm} disabled={!ready || confirming}>
            {confirming ? 'กำลังบันทึก...' : 'ยืนยัน'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
