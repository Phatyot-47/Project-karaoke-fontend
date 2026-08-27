import { createContext, useContext, useEffect, useState } from 'react';

// Context สำหรับเก็บข้อมูลผู้ใช้ที่ล็อกอินอยู่ (ลูกค้าหรือแอดมิน)
// ค่าเริ่มต้น null เพื่อให้ useAuth() ตรวจจับได้ว่าถูกเรียกนอก Provider
const AuthContext = createContext(null);

// key ที่ใช้เก็บข้อมูลใน localStorage — แยกกันระหว่างลูกค้าและแอดมิน
// เพื่อให้ยังคงล็อกอินอยู่แม้รีเฟรชหน้า
const CUSTOMER_KEY = 'gens_karaoke_customer';
const ADMIN_KEY = 'gens_karaoke_admin';

/**
 * Provider หลัก — ห่อ App ทั้งหมดไว้ใน main.jsx
 * จัดการ state และ sync กับ localStorage อัตโนมัติ
 */
export function AuthProvider({ children }) {
  // อ่านข้อมูลจาก localStorage ตอน mount ครั้งแรก (lazy initializer)
  // ใช้ try/catch ป้องกัน JSON.parse crash กรณีข้อมูลใน storage เสียหาย
  const [customer, setCustomer] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CUSTOMER_KEY)) || null; } catch { return null; }
  });
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ADMIN_KEY)) || null; } catch { return null; }
  });

  // Sync customer → localStorage ทุกครั้งที่ state เปลี่ยน
  // ถ้า logout (customer = null) → ลบ key ออกจาก storage เลย ไม่เก็บ "null" เป็นสตริง
  useEffect(() => {
    if (customer) localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
    else localStorage.removeItem(CUSTOMER_KEY);
  }, [customer]);

  // Sync admin → localStorage เช่นเดียวกัน
  useEffect(() => {
    if (admin) localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
    else localStorage.removeItem(ADMIN_KEY);
  }, [admin]);

  // เมธอดที่ส่งให้ component ลูก — ใช้ผ่าน useAuth()
  const loginCustomer = (user) => setCustomer(user);
  const logoutCustomer = () => setCustomer(null);
  const loginAdmin = (user) => setAdmin(user);
  const logoutAdmin = () => setAdmin(null);

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
