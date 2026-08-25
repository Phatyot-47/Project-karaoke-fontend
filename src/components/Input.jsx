export default function Input({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  error,
  hint,
  disabled = false,
  icon = null,
  style,
}) {
  return (
    <div className="field-wrap" style={style}>
      {label && <label className="field-label">{label}</label>}
      {icon ? (
        <div className="field-icon-wrap">
          <span className="icon">{icon}</span>
          <input
            className="field"
            type={type}
            placeholder={placeholder}
            value={value ?? ''}
            onChange={onChange}
            disabled={disabled}
            aria-invalid={!!error}
          />
        </div>
      ) : (
        <input
          className="field"
          type={type}
          placeholder={placeholder}
          value={value ?? ''}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={!!error}
        />
      )}
      {error && <span className="field-error">{error}</span>}
      {!error && hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}
