# Gens Karaoke — Frontend

หน้าบ้าน (React + Vite) ของระบบจองห้องคาราโอเกะ Gens Karaoke & Board Game สร้างจากดีไซน์ต้นฉบับ
(`Gens Karaoke.dc.html`) ต่อกับ `gens-karaoke-backend` (Node.js + Express + PostgreSQL) ที่มีอยู่แล้ว

test

## ติดตั้งและรัน

```bash
cd gens-karaoke-frontend
npm install
cp .env.example .env   # ตั้ง VITE_API_BASE_URL ให้ตรงกับ backend (default http://localhost:4000/api)
npm run dev            # เปิดที่ http://localhost:5173
```

ต้องรัน `gens-karaoke-backend` (npm run dev ที่ port 4000) คู่กันไว้ด้วย ไม่งั้นหน้าเว็บจะโหลดข้อมูลไม่ได้

## โครงสร้างหน้าจอ

**ฝั่งลูกค้า**
- `/login`, `/register` — เข้าสู่ระบบ/สมัครสมาชิกด้วยเบอร์โทร
- `/` — เลือกห้อง (filter ขนาดห้อง, ค้นหาชื่อห้อง)
- `/book/:roomId` — เลือกเวลาแบบคลิก slot ทีละ 30 นาที, คำนวณราคาพรีวิว, กดยืนยันจะสร้าง booking จริงที่ backend
- `/pay/:bookingId` — หน้าชำระมัดจำ (QR placeholder + แนบสลิป)
- `/success` — สรุปผลหลังยืนยันชำระเงิน
- `/history` — ประวัติการจอง + ยกเลิก

**ฝั่งแอดมิน**
- `/admin/login`
- `/admin/bookings` — สรุปยอดวันนี้ + อนุมัติ/ปฏิเสธ + เพิ่มจองวอล์คอิน
- `/admin/history` — ประวัติทุกสถานะ
- `/admin/shop-settings` — ข้อมูลร้าน, เวลาเปิด-ปิด, พีคไทม์, บัญชีธนาคาร
- `/admin/room-settings` — แก้ไขห้อง (ชื่อ/ขนาด/ราคา/รูป/เปิด-ปิด)
- `/admin/reports` — รายงานรายวัน/สัปดาห์/เดือน

Session ของลูกค้า/แอดมินเก็บใน `localStorage` (ไม่มี JWT เพราะ backend ปัจจุบันไม่ได้ออก token — ดูหมายเหตุด้านล่าง)

## จุดที่ควรรู้ / ข้อจำกัดที่มาจาก backend ปัจจุบัน

1. **ไม่มีการอัปโหลดไฟล์จริง** — backend รับ `evidenceUrl` / `imageUrl` เป็น string เฉยๆ ยังไม่มี endpoint รับไฟล์ (multipart) หน้าเว็บนี้เลยแปลงรูปที่เลือกเป็น data URL ชั่วคราวแทน (ใช้งานได้ในเซสชันเดียว แต่ไม่ได้เก็บไฟล์ถาวรบนเซิร์ฟเวอร์) ถ้าจะเก็บไฟล์จริงต้องเพิ่ม endpoint upload (เช่น S3/local disk) ที่ backend ก่อน
2. **ไม่มี endpoint สาธารณะสำหรับข้อมูลร้าน** — หน้าเลือกเวลาจองต้องรู้เวลาเปิด-ปิดร้านกับพีคไทม์ ตอนนี้เรียก `GET /api/admin/shop` ตรงๆ (endpoint นี้ตั้งใจไว้สำหรับแอดมิน แต่ backend ไม่ได้ล็อกสิทธิ์อยู่แล้วจึงเรียกได้) แนะนำให้เพิ่ม endpoint แยกเช่น `GET /api/shop` (public, ไม่รวมข้อมูลอ่อนไหว) ในอนาคต
3. **ตรวจสอบสลิปมัดจำ (payment verify) ยังต่อไม่ครบ** — `PATCH /api/admin/payments/:id/verify` ต้องใช้ `payment_id` แต่ `GET /api/admin/bookings/today` ไม่ได้ join ข้อมูล payment กลับมาด้วย หน้าตั้งค่า/อนุมัติการจองในเวอร์ชันนี้จึงยังไม่มีปุ่ม "ตรวจสอบสลิป" ที่ใช้งานได้จริง — ถ้าต้องการ แจ้งได้ จะเพิ่ม query join payment เข้าไปใน endpoint นั้น
4. **ไม่มีระบบยืนยันตัวตน (auth token/JWT)** — ทั้งฝั่งลูกค้าและแอดมิน login แล้วเก็บ user object ใน localStorage ตรงๆ ไม่มี token/สิทธิ์ตรวจสอบที่ backend เป็นเรื่องที่ควรทำก่อน deploy ใช้งานจริง
5. **ราคาที่แสดงระหว่างเลือกเวลาเป็นค่าพรีวิว** ราคาจริง (`price_total`, `deposit_required`) มาจาก backend หลังกดยืนยันเวลาเท่านั้น (backend คำนวณเสมอ กันลูกค้าแก้ราคาเอง ตามที่ตั้งใจไว้ใน `pricing.js`)

## Tech stack

React 18 + React Router 6 + Vite 5, CSS ธรรมดา (ไม่ใช้ framework) โดยดึง design tokens (สี/ฟอนต์/spacing) มาจากดีไซน์ต้นฉบับใน `src/styles/tokens.css` เพื่อให้หน้าตาตรงกับ mockup เดิม
