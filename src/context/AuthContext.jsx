import { createContext, useContext, useState } from 'react';

// เก็บว่า "ใครล็อกอินอยู่" (ลูกค้า และ/หรือ แอดมิน) ให้ทุกหน้าใช้ร่วมกัน
// หน้าไหนอยากรู้ เรียก const { customer, admin, loginCustomer, ... } = useAuth()
// (Context = ที่เก็บข้อมูลกลางของ React ที่ทุกหน้าเข้าถึงได้ โดยไม่ต้องส่งต่อกันทีละชั้น)
const AuthContext = createContext(null);

// ชื่อที่ใช้เก็บข้อมูลผู้ใช้ใน localStorage (ที่เก็บข้อมูลในเบราว์เซอร์ ปิดเว็บแล้วก็ยังอยู่)
// เก็บแยกลูกค้ากับแอดมิน — รีเฟรชหน้าแล้วยังล็อกอินอยู่
const CUSTOMER_KEY = 'gens_karaoke_customer';
const ADMIN_KEY = 'gens_karaoke_admin';

/**
 * ตัวเก็บข้อมูลผู้ใช้ — ห่อทั้งแอปไว้ใน main.jsx
 * ล็อกอิน/ออกจากระบบเมื่อไหร่ ก็บันทึกลง localStorage ไปด้วย
 */
export function AuthProvider({ children }) {
  // เปิดเว็บครั้งแรก: อ่านข้อมูลผู้ใช้ที่เคยเก็บไว้ (ถ้าข้อมูลเสีย ถือว่ายังไม่ล็อกอิน)
  const [customer, setCustomer] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CUSTOMER_KEY)) || null;
    } catch {
      return null;
    }
  });
  const [admin, setAdmin] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(ADMIN_KEY)) || null;
    } catch {
      return null;
    }
  });

  // สร้างฟังก์ชันล็อกอิน/ออกจากระบบ: บันทึกลง localStorage "ทันที" แล้วค่อยอัปเดตหน้าจอ
  // (ต้องบันทึกทันที เพราะหน้าถัดไปจะเรียก API เลย ถ้า token ยังไม่ถูกบันทึก คำขอแรกจะไม่มี token)
  // user = null หมายถึงออกจากระบบ → ลบข้อมูลทิ้ง
  const persist = (key, setter) => (user) => {
    if (user) localStorage.setItem(key, JSON.stringify(user));
    else localStorage.removeItem(key);
    setter(user);
  };

  // ฟังก์ชันที่หน้าอื่นเรียกใช้ได้ผ่าน useAuth()
  const loginCustomer = persist(CUSTOMER_KEY, setCustomer);
  const logoutCustomer = () => loginCustomer(null);
  const loginAdmin = persist(ADMIN_KEY, setAdmin);
  const logoutAdmin = () => loginAdmin(null);

  return (
    <AuthContext.Provider value={{ customer, admin, loginCustomer, logoutCustomer, loginAdmin, logoutAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * ดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่ — เรียกได้จากทุกหน้า
 * (ถ้าเผลอเรียกนอก AuthProvider จะแจ้ง error ทันที จะได้รู้ว่าลืมห่อ)
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth ต้องถูกเรียกภายใน <AuthProvider>');
  return ctx;
}
