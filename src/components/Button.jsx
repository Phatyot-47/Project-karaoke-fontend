export default function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  iconLeft = null,
  iconRight = null,
  disabled = false,
  onClick,
  type = 'button',
  children,
  style,
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '',
    block ? 'btn-block' : '',
  ].filter(Boolean).join(' ');

  return (
    <button type={type} className={classes} disabled={disabled} onClick={onClick} style={style}>
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
