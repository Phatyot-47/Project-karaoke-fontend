import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';

export default function CustomerLayout() {
  const { customer, logoutCustomer } = useAuth();
  const location = useLocation();

  if (!customer) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="page-dark app-dark">
      <header className="topbar">
        <div className="topbar-brand">
          <img src="/assets/logo.png" alt="Gens Karaoke logo" />
          <span>Gens Karaoke &amp; Board Game</span>
        </div>
        <nav className="topbar-nav">
          <NavLink to="/" end className={({ isActive }) => `topbar-nav-item${isActive ? ' active' : ''}`}>
            เลือกห้อง
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => `topbar-nav-item${isActive ? ' active' : ''}`}>
            ประวัติการจอง
          </NavLink>
        </nav>
        <button type="button" className="user-pill" onClick={logoutCustomer} title="ออกจากระบบ">
          <Avatar name={customer.name} size="sm" />
          <span>คุณ {customer.name}</span>
        </button>
      </header>

      <Outlet />

      <footer className="footer">
        <div className="name">Gens Karaoke &amp; Board Game</div>
        <div className="meta">โทร: {customer.shopPhone || '081-234-5678'}</div>
        <div className="meta">629 ถ.ธรรมนูญวิถี ตำบล หาดใหญ่ อำเภอหาดใหญ่ สงขลา 90110</div>
      </footer>
    </div>
  );
}
