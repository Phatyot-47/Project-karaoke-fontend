function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('โหลดรูปไม่สำเร็จ'));
    img.src = src;
  });
}

function withJpgExtension(fileName) {
  const base = (fileName || 'cropped').replace(/\.[^./\\]+$/, '');
  return `${base}.jpg`;
}

// วาดเฉพาะพื้นที่ที่ crop (croppedAreaPixels จาก react-easy-crop) ลง canvas
// ขนาดเท่าพื้นที่นั้นจริงๆ แล้วส่งออกเป็น File (image/jpeg) พร้อมอัปโหลด
// เติมพื้นหลังขาวก่อนวาดเสมอ กันรูปโปร่งใส (PNG) กลายเป็นดำ/ไม่มีสีตอน encode เป็น JPEG
// (JPEG ไม่รองรับ alpha channel) และกันขอบเพี้ยนถ้าพื้นที่ครอปเกินขอบรูปจริงจากการปัดเศษ
export async function getCroppedImageFile(imageSrc, croppedAreaPixels, fileName) {
  const image = await loadImage(imageSrc);
  const sx = Math.max(0, Math.round(croppedAreaPixels.x));
  const sy = Math.max(0, Math.round(croppedAreaPixels.y));
  const sWidth = Math.min(Math.round(croppedAreaPixels.width), image.naturalWidth - sx);
  const sHeight = Math.min(Math.round(croppedAreaPixels.height), image.naturalHeight - sy);

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(croppedAreaPixels.width);
  canvas.height = Math.round(croppedAreaPixels.height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('สร้างรูปที่ครอปไม่สำเร็จ'))), 'image/jpeg', 0.92);
  });

  return new File([blob], withJpgExtension(fileName), { type: 'image/jpeg' });
}
