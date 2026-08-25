export default function Card({ title, subtitle, actions, pad = true, children, style, className = '' }) {
  return (
    <div className={`card ${className}`} style={style}>
      {(title || actions) && (
        <div className="card-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            {title && <div className="title">{title}</div>}
            {subtitle && <div className="subtitle">{subtitle}</div>}
          </div>
          {actions}
        </div>
      )}
      <div className={pad ? 'card-body' : ''}>{children}</div>
    </div>
  );
}
