import { useRef, useState } from 'react';
import api, { fileUrl } from '../api/client.js';
import ImageCropModal from './ImageCropModal.jsx';

/**
 * ช่องอัปโหลดรูป/สลิป — เลือกไฟล์แล้วโชว์ตัวอย่างทันที พร้อมส่งไฟล์ขึ้น backend (POST /api/uploads)
 * อัปโหลดเสร็จจะได้ลิงก์รูป ส่งกลับให้หน้าที่ใช้ผ่าน onChange(ลิงก์, ไฟล์)
 *
 * cropAspectRatio (ไม่บังคับ): ถ้าใส่ จะเปิดหน้าต่างให้ลาก/ซูมครอปรูปตามสัดส่วนนี้ก่อนอัปโหลด
 * (ใช้กับรูปห้องและรูปโปรไฟล์ / สลิปไม่ต้องครอป)
 */
export default function UploadSlot({
  placeholder = 'คลิกเพื่อเลือกไฟล์',
  value,
  onChange,
  height = 182,
  cropAspectRatio,
}) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(fileUrl(value) || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [cropSrc, setCropSrc] = useState(null);
  const [cropFileName, setCropFileName] = useState('');

  const uploadFile = async (file) => {
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const { url } = await api.uploadFile(file);
      onChange?.(url, file);
    } catch (err) {
      setError(err.message);
      setPreview(fileUrl(value) || null);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    if (cropAspectRatio) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropSrc(reader.result);
        setCropFileName(file.name);
      };
      reader.onerror = () => {
        setError('อ่านไฟล์ไม่สำเร็จ');
        if (inputRef.current) inputRef.current.value = '';
      };
      reader.readAsDataURL(file);
      return;
    }

    uploadFile(file);
  };

  const handleCropConfirm = (croppedFile) => {
    setCropSrc(null);
    if (inputRef.current) inputRef.current.value = '';
    uploadFile(croppedFile);
  };

  const handleCropCancel = () => {
    setCropSrc(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="upload-slot" style={{ height, width: '100%' }}>
      {preview ? <img src={preview} alt="" style={{ opacity: uploading ? 0.5 : 1 }} /> : <span>{placeholder}</span>}
      {uploading && <span style={{ position: 'absolute', zIndex: 1 }}>กำลังอัปโหลด...</span>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFile}
        disabled={uploading || !!cropSrc}
      />
      {error && (
        <span
          className="field-error"
          style={{
            position: 'absolute',
            bottom: 6,
            left: 6,
            right: 6,
            background: 'var(--surface-card)',
            padding: '2px 6px',
            borderRadius: 6,
          }}
        >
          {error}
        </span>
      )}
      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          aspect={cropAspectRatio}
          fileName={cropFileName}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}
