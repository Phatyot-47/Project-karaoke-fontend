import { createContext, useContext, useState } from 'react';

// Context สำหรับเก็บข้อมูลผู้ใช้ที่ล็อกอินอยู่ (ลูกค้าหรือแอดมิน)
// ค่าเริ่มต้น null เพื่อให้ useAuth() ตรวจจับได้ว่าถูกเรียกนอก Provider
const AuthContext = createContext(null);

// key ที่ใช้เก็บข้อมูลใน localStorage — แยกกันระหว่างลูกค้าและแอดมิน
// เพื่อให้ยังคงล็อกอินอยู่แม้รีเฟรชหน้า
const CUSTOMER_KEY = 'gens_karaoke_customer';
const ADMIN_KEY = 'gens_karaoke_admin';

/**
 * Provider หลัก — ห่อ App ทั้งหมดไว้ใน main.jsx
 * จัดการ state และเก็บลง localStorage ทุกครั้งที่ login/logout
 */
export function AuthProvider({ children }) {
  // อ่านข้อมูลจาก localStorage ตอน mount ครั้งแรก (lazy initializer)
  // ใช้ try/catch ป้องกัน JSON.parse crash กรณีข้อมูลใน storage เสียหาย
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

  // เขียน localStorage ทันทีตอน login/logout (ไม่รอ useEffect) — token ต้องพร้อมก่อนหน้าถัดไปเริ่มเรียก API
  // (effect ของหน้าลูกจะรันก่อน effect ของ Provider ถ้า sync ผ่าน useEffect หน้าแรกหลัง login จะยิง request โดยไม่มี token)
  // logout (user = null) → ลบ key ออกจาก storage เลย ไม่เก็บ "null" เป็นสตริง
  const persist = (key, setter) => (user) => {
    if (user) localStorage.setItem(key, JSON.stringify(user));
    else localStorage.removeItem(key);
    setter(user);
  };

  // เมธอดที่ส่งให้ component ลูก — ใช้ผ่าน useAuth()
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
 * Hook สำหรับเข้าถึง auth context — ใช้ใน component ใดก็ได้ที่อยู่ภายใน AuthProvider
 * โยน Error ทันทีถ้าเรียกนอก Provider เพื่อป้องกัน bug ที่หาสาเหตุยาก
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth ต้องถูกเรียกภายใน <AuthProvider>');
  return ctx;
}
