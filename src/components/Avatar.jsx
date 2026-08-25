export default function Avatar({ name = '', size = 'sm' }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const px = size === 'sm' ? 42 : 52;
  return (
    <span className="avatar" style={{ width: px, height: px }}>
      {initial}
    </span>
  );
}
