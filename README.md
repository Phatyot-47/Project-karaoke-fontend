# Gens Karaoke — Frontend

หน้าเว็บ (React + Vite) ของระบบจองห้องคาราโอเกะ Gens Karaoke & Board Game ใช้คู่กับ `Project-karaoke-backend`
(Node.js + Express + PostgreSQL)

## ติดตั้งและรัน

```bash
cd Project-karaoke-fontend
npm install
cp .env.example .env   # ตั้ง VITE_API_BASE_URL ให้ตรงกับ backend (ค่าเริ่มต้น http://localhost:4000/api)
npm run dev            # เปิดที่ http://localhost:5173
npm run build          # build ไฟล์จริงไว้ที่ dist/
npm run format         # จัดรูปแบบโค้ดด้วย Prettier
```

ต้องเปิด backend (`npm run dev` ในโฟลเดอร์ backend พอร์ต 4000) คู่กันไว้ด้วย ไม่งั้นหน้าเว็บโหลดข้อมูลไม่ได้

## หน้าจอทั้งหมด

**ฝั่งลูกค้า** (จองได้เฉพาะวันนี้ — ร้านให้จองแบบวันต่อวัน)

- `/login`, `/register` — เข้าสู่ระบบ/สมัครสมาชิกด้วยเบอร์โทร + รหัสผ่าน
- `/` — เลือกห้อง: แท็บประเภทห้อง (S/M/L/XL), กรองห้องธรรมดา/ห้องธีม, ค้นหาห้องว่างตามเวลา
- `/book/:roomId` — เลือกเวลาทีละ 30 นาที พร้อมราคาพรีวิว (แก้ไขการจองได้ด้วย `?edit=<bookingId>`)
- `/pay/:bookingId` — ชำระมัดจำ: QR ร้าน + แนบสลิป (ล็อกเวลาไว้ 5 นาที)
- `/success` — สรุปหลังส่งสลิป
- `/history` — ประวัติการจอง: ชำระต่อ / แก้ไข / ยกเลิก
- `/profile` — ข้อมูลส่วนตัว รูปโปรไฟล์ และเปลี่ยนรหัสผ่าน
- กระดิ่งบนเมนู — แจ้งเตือนเมื่อร้านยืนยัน/ยกเลิก/สลิปไม่ผ่าน/ย้ายห้อง ฯลฯ

**ฝั่งแอดมิน** (ทุกหน้าเช็คสลิปใหม่ทุก 15 วินาที — มีกล่องแจ้งเตือน + ตัวเลขบนเมนูและชื่อแท็บ)

- `/admin/login`
- `/admin/bookings` — อนุมัติการจอง: ตรวจสลิป, ยืนยัน/ยกเลิก, ย้ายห้อง, Check-in, ต่อเวลา, Check-out, ไม่มาใช้บริการ
- `/admin/walkin` — สถานะห้องตอนนี้ + จองวอล์คอิน
- `/admin/history` — ประวัติการจองทุกสถานะ
- `/admin/shop-settings` — ข้อมูลร้าน, เวลาเปิด-ปิด, นโยบายมัดจำ, พีคไทม์, บัญชีรับโอน/QR, แผนผังร้าน
- `/admin/room-types` — ประเภทห้อง: ชื่อ ความจุ ราคาห้องธรรมดา (เปลี่ยนราคาแล้วเลือกห้องที่จะเปลี่ยนตามได้)
- `/admin/room-settings` — เพิ่มห้องตามประเภททีละหลายห้อง, แก้ไขห้อง (ห้องธรรมดา/ห้องธีม ราคา รูป)
- `/admin/reports` — รายงานรายได้รายวัน/สัปดาห์/เดือน และแยกตามห้อง

## โครงสร้างโฟลเดอร์ `src/`

| โฟลเดอร์                  | เก็บอะไร                                                                                                          |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `api/client.js`           | เรียก backend ทุกจุดผ่านไฟล์นี้ (แนบ token ให้อัตโนมัติ, หมดอายุแล้วพาไปหน้าล็อกอิน)                              |
| `context/AuthContext.jsx` | ข้อมูลลูกค้า/แอดมินที่ล็อกอินอยู่ (เก็บใน localStorage พร้อม token)                                               |
| `layouts/`                | กรอบหน้าลูกค้า (เมนูบน + กระดิ่ง) และหน้าแอดมิน (เมนูซ้าย + แจ้งเตือนสลิป)                                        |
| `pages/`, `pages/admin/`  | หน้าจอแต่ละหน้าตามรายการด้านบน                                                                                    |
| `components/`             | ชิ้นส่วนที่ใช้ซ้ำ เช่น Button, Card, Tag, UploadSlot, NotificationBell                                            |
| `utils/`                  | ฟังก์ชันช่วย: เวลาไทย/รูปแบบตัวเลข/สถานะการจอง (`format.js`), ราคาพรีวิว (`pricing.js`), รูปห้อง (`roomImage.js`) |
| `hooks/`                  | `useNowTick` (รีเฟรชตามเวลาจริง), `useSavedFlag` (ข้อความ "บันทึกแล้ว")                                           |
| `styles/`                 | `tokens.css` (สี/ฟอนต์/ระยะห่างจากดีไซน์) และ `global.css`                                                        |

## อ่านโค้ดเริ่มตรงไหน — ข้อมูลวิ่งผ่านไฟล์ไหนบ้าง

ระบบมี 2 ส่วนที่คุยกันผ่าน API: **หน้าเว็บ** (repo นี้) ส่งคำขอ → **backend** (`Project-karaoke-backend`)
ตรวจสิทธิ์ อ่าน/เขียนฐานข้อมูล แล้วตอบเป็น JSON กลับมา

### ทุกคำขอเดินแบบเดียวกัน

```
หน้าเว็บ (pages/*.jsx)                   เช่น ลูกค้ากดปุ่ม "ยืนยันและชำระมัดจำ"
  └─ api/client.js                       api.createBooking(...) → แนบ token แล้วส่ง POST /api/bookings
       │  ─────────── อินเทอร์เน็ต ───────────
       └─ backend: src/app.js            ดู URL ขึ้นต้น /api/bookings → ส่งไป routes/bookings.routes.js
            └─ utils/auth.js             ตรวจ token: ไม่มี/หมดอายุ → 401, ผิดบทบาท → 403
                 └─ routes/*.routes.js   ตรวจข้อมูล + คิดราคา (utils/) + สั่ง SQL ผ่าน db.js
                      └─ PostgreSQL      บันทึกจริง (เวลาซ้อนกับการจองอื่น ฐานข้อมูลไม่ยอมบันทึก)
       ← ตอบ JSON กลับมา (ผิดพลาด = { error: "ข้อความ" } พร้อมรหัส 400/401/403/404/409)
  └─ api/client.js                       สำเร็จ → คืนข้อมูล / ผิดพลาด → โยน Error ที่มีข้อความจาก backend
หน้าเว็บ                                 setState → React วาดหน้าใหม่ / หรือ navigate ไปหน้าถัดไป
```

### ตัวอย่างเต็ม: ลูกค้าจองห้อง 1 ครั้ง

| ขั้น | ผู้ใช้ทำอะไร                     | หน้าเว็บ (ไฟล์ → API)                                                    | backend (ไฟล์)                                       | ผลในฐานข้อมูล                                         |
| ---- | -------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------- | ----------------------------------------------------- |
| 1    | เข้าสู่ระบบ                      | `LoginPage` → `POST /api/auth/login`                                     | `auth.routes.js` ตรวจรหัสผ่าน แล้วออก token          | —                                                     |
|      |                                  | `AuthContext` เก็บข้อมูลผู้ใช้ + token ไว้ใน localStorage                |                                                      |                                                       |
| 2    | เลือกห้อง                        | `RoomListPage` → `GET /api/rooms`                                        | `rooms.routes.js`                                    | อ่านอย่างเดียว                                        |
| 3    | เลือกช่วงเวลา                    | `BookingPage` → `GET /api/rooms/:id/availability` (ทำช่องสีเทา)          | `rooms.routes.js`                                    | อ่านอย่างเดียว                                        |
|      |                                  | ราคาที่เห็นคิดในหน้าเว็บ (`utils/pricing.js`) เป็นแค่พรีวิว              |                                                      |                                                       |
| 4    | กด "ยืนยันและชำระมัดจำ"          | `BookingPage` → `POST /api/bookings`                                     | `bookings.routes.js` คิดราคาจริงเอง (`quoteBooking`) | `booking` ใหม่ สถานะ `pending` มัดจำ `unpaid`         |
| 5    | สแกน QR + แนบสลิป (ภายใน 5 นาที) | `PaymentPage` → `POST /api/uploads` (ได้ลิงก์รูป) → `POST /api/payments` | `uploads.routes.js`, `payments.routes.js`            | `payment` ใหม่ `pending` / มัดจำเป็น `pending_verify` |
| 6    | แอดมินอนุมัติสลิป                | `AdminBookingsPage` → `PATCH /api/admin/payments/:id/verify`             | `admin.routes.js`                                    | มัดจำเป็น `paid`                                      |
| 7    | แอดมินกดยืนยัน                   | `AdminBookingsPage` → `PATCH /api/admin/bookings/:id/confirm`            | `admin.routes.js` + สร้างแจ้งเตือนให้ลูกค้า          | การจองเป็น `confirmed`                                |
| 8    | ลูกค้ามา → Check-in / Check-out  | `AdminBookingsPage` → `PATCH .../check-in`, `.../check-out`              | `admin.routes.js`                                    | `service_session` / การจองเป็น `completed`            |

ถ้าไม่ส่งสลิปภายใน 5 นาที backend จะเปลี่ยนการจองเป็นยกเลิกให้เอง (`utils/expireBookings.js`) ช่วงเวลานั้นกลับมาว่าง

### แนะนำลำดับการเปิดอ่าน

1. `src/App.jsx` — ดูว่า URL ไหนเปิดหน้าไหน
2. `src/api/client.js` — ทุกการคุยกับ backend อยู่ที่นี่ (ชื่อฟังก์ชัน ↔ URL ของ API)
3. `src/pages/BookingPage.jsx` — อธิบายพื้นฐาน React (useState / useEffect / useMemo) ไว้ละเอียดที่สุด หน้าอื่นใช้แบบเดียวกัน
4. ฝั่ง backend: `src/app.js` → `src/routes/bookings.routes.js` (อธิบายพื้นฐาน SQL ไว้ละเอียดที่สุด) → `src/db.js`

## หมายเหตุ

- ราคาที่เห็นตอนเลือกเวลาเป็นแค่พรีวิว ราคาและมัดจำจริงคำนวณที่ backend เสมอ (กันลูกค้าแก้ราคาเอง)
- เวลาทั้งหมดในระบบเป็นเวลาไทย (Asia/Bangkok)

## Tech stack

React 18 + React Router 6 + Vite 5, CSS ธรรมดา (ไม่ใช้ framework), ไอคอน lucide-react, ครอปรูป react-easy-crop
