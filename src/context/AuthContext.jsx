import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const CUSTOMER_KEY = 'gens_karaoke_customer';
const ADMIN_KEY = 'gens_karaoke_admin';

export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CUSTOMER_KEY)) || null; } catch { return null; }
  });
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ADMIN_KEY)) || null; } catch { return null; }
  });

  useEffect(() => {
    if (customer) localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
    else localStorage.removeItem(CUSTOMER_KEY);
  }, [customer]);

  useEffect(() => {
    if (admin) localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
    else localStorage.removeItem(ADMIN_KEY);
  }, [admin]);

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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth ต้องถูกเรียกภายใน <AuthProvider>');
  return ctx;
}
