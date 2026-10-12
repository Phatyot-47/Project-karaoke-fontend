// ตัดรูปตามกรอบที่ผู้ใช้ครอป (ใช้กับ ImageCropModal)

/** โหลดรูป แล้วรอจนโหลดเสร็จ (ต้องโหลดเสร็จก่อนถึงจะวาดลงกระดาน canvas ได้) */
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
 * ตัดเอาเฉพาะส่วนที่อยู่ในกรอบครอป วาดลงกระดาน (canvas) แล้วบันทึกเป็นไฟล์ JPG พร้อมอัปโหลด
 *
 * จุดที่ควรรู้:
 * - ระบายพื้นขาวก่อนวาด เพราะรูป PNG ที่พื้นหลังโปร่งใส ถ้าแปลงเป็น JPG ตรงๆ พื้นจะกลายเป็นสีดำ
 * - ตัดตัวเลขตำแหน่งไม่ให้เกินขอบรูปจริง (บางทีตัวครอปปัดเศษแล้วเกินขอบ ทำให้มีแถบดำ)
 * - คุณภาพ 0.92 = ไฟล์ไม่ใหญ่เกินไป แต่รูปยังชัด
 *
 * @param {string} imageSrc             - รูปต้นฉบับ
 * @param {object} croppedAreaPixels    - ตำแหน่งกรอบครอป { x, y, width, height }
 * @param {string} fileName             - ชื่อไฟล์ที่จะได้ (เปลี่ยนนามสกุลเป็น .jpg ให้)
 * @returns {Promise<File>}
 */
export async function getCroppedImageFile(imageSrc, croppedAreaPixels, fileName) {
  const image = await loadImage(imageSrc);

  // ตัดตำแหน่งครอปไม่ให้เกินขอบรูปจริง (กันแถบดำที่ขอบ)
  const sx = Math.max(0, Math.round(croppedAreaPixels.x));
  const sy = Math.max(0, Math.round(croppedAreaPixels.y));
  const sWidth = Math.min(Math.round(croppedAreaPixels.width), image.naturalWidth - sx);
  const sHeight = Math.min(Math.round(croppedAreaPixels.height), image.naturalHeight - sy);

  // สร้างกระดานวาดรูป ขนาดเท่ากรอบที่ครอป
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(croppedAreaPixels.width);
  canvas.height = Math.round(croppedAreaPixels.height);
  const ctx = canvas.getContext('2d');

  // ระบายพื้นขาวก่อน (สำหรับรูป PNG ที่พื้นหลังโปร่งใส)
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // วาดเฉพาะส่วนที่อยู่ในกรอบลงกระดาน
  ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

  // บันทึกกระดานเป็นไฟล์ JPG
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('สร้างรูปที่ครอปไม่สำเร็จ'))), 'image/jpeg', 0.92);
  });

  return new File([blob], withJpgExtension(fileName), { type: 'image/jpeg' });
}
