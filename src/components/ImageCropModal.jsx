import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import Button from './Button.jsx';
import { getCroppedImageFile } from '../utils/cropImage.js';

/**
 * โมดัลลาก/ซูมรูปในกรอบสัดส่วนคงที่ (แบบครอปรูปโปรไฟล์) ก่อนอัปโหลดจริง
 * onConfirm(file) ได้ไฟล์ที่ครอปแล้วเป็น File — onCancel() ปิดโมดัลเฉยๆ ไม่มีผลข้างเคียง
 */
export default function ImageCropModal({ imageSrc, aspect, fileName, onConfirm, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [ready, setReady] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const croppedAreaPixelsRef = useRef(null);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleCropComplete = (_croppedArea, croppedAreaPixels) => {
    croppedAreaPixelsRef.current = croppedAreaPixels;
    setReady(true);
  };

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

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onCancel();
  };

  return createPortal(
    <div className="crop-modal-backdrop" onClick={handleBackdropClick}>
      <div className="crop-modal" role="dialog" aria-modal="true" aria-label="ครอปรูปภาพ">
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
