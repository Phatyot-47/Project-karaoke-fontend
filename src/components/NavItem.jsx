export default function NavItem({ label, icon, active, badge, onClick }) {
  return (
    <button type="button" className={`admin-nav-item${active ? ' active' : ''}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
      {!!badge && <span className="badge">{badge}</span>}
    </button>
  );
}
