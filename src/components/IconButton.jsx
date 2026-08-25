export default function IconButton({ label, onClick, children }) {
  return (
    <button type="button" aria-label={label} title={label} className="icon-btn" onClick={onClick}>
      {children}
    </button>
  );
}
