/**
 * โหลดรูปภาพจาก URL เป็น HTMLImageElement
 * ใช้ Promise เพื่อรอให้รูปโหลดเสร็จก่อนวาดลง canvas
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('โหลดรูปไม่สำเร็จ'));
    img.src = src;
  });
}

/**
 * เปลี่ยน extension ของชื่อไฟล์เป็น .jpg
 * เช่น "photo.png" → "photo.jpg", "image" → "image.jpg"
 */
function withJpgExtension(fileName) {
  const base = (fileName || 'cropped').replace(/\.[^./\\]+$/, '');
  return `${base}.jpg`;
}

/**
 * วาดเฉพาะพื้นที่ที่ crop (croppedAreaPixels จาก react-easy-crop) ลง canvas
 * ขนาดเท่าพื้นที่นั้นจริงๆ แล้วส่งออกเป็น File (image/jpeg) พร้อมอัปโหลด
 *
 * หมายเหตุการ implement:
 * - เติมพื้นหลังขาวก่อนวาดเสมอ กันรูปโปร่งใส (PNG) กลายเป็นดำ/ไม่มีสีตอน encode เป็น JPEG
 *   (JPEG ไม่รองรับ alpha channel จึงต้องมีพื้นหลังที่กำหนดไว้)
 * - ใช้ Math.max/min กับ sx, sy, sWidth, sHeight เพื่อกันขอบเพี้ยนถ้าพื้นที่ครอป
 *   เกินขอบรูปจริงจากการปัดเศษของ react-easy-crop
 * - quality 0.92 เป็น sweet spot ระหว่างขนาดไฟล์และคุณภาพภาพ
 *
 * @param {string} imageSrc             - Data URL ของรูปต้นฉบับ
 * @param {object} croppedAreaPixels    - { x, y, width, height } จาก react-easy-crop
 * @param {string} fileName             - ชื่อไฟล์ผลลัพธ์ (จะถูกเปลี่ยน extension เป็น .jpg)
 * @returns {Promise<File>}
 */
export async function getCroppedImageFile(imageSrc, croppedAreaPixels, fileName) {
  const image = await loadImage(imageSrc);

  // clamp ขอบ crop ไม่ให้เกินขนาดรูปจริง — ป้องกัน black stripe จาก floating point ของ easy-crop
  const sx = Math.max(0, Math.round(croppedAreaPixels.x));
  const sy = Math.max(0, Math.round(croppedAreaPixels.y));
  const sWidth = Math.min(Math.round(croppedAreaPixels.width), image.naturalWidth - sx);
  const sHeight = Math.min(Math.round(croppedAreaPixels.height), image.naturalHeight - sy);

  // สร้าง canvas ขนาดเท่าพื้นที่ crop
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(croppedAreaPixels.width);
  canvas.height = Math.round(croppedAreaPixels.height);
  const ctx = canvas.getContext('2d');

  // เติมพื้นขาวก่อนวาด — สำหรับรูป PNG ที่มี transparency
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // วาดเฉพาะส่วนที่ crop (source rect → destination rect)
  ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

  // แปลง canvas เป็น Blob (JPEG, quality 0.92)
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('สร้างรูปที่ครอปไม่สำเร็จ'))), 'image/jpeg', 0.92);
  });

  return new File([blob], withJpgExtension(fileName), { type: 'image/jpeg' });
}
