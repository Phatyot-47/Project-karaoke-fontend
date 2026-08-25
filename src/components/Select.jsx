export default function Select({ label, value, onChange, children, disabled = false, style }) {
  return (
    <div className="field-wrap" style={style}>
      {label && <label className="field-label">{label}</label>}
      <select className="field" value={value} onChange={onChange} disabled={disabled}>
        {children}
      </select>
    </div>
  );
}
