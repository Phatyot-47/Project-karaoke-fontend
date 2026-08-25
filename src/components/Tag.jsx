export default function Tag({ tone = 'neutral', dot = false, size = 'md', children }) {
  return (
    <span className={`tag tag-${tone}`} style={size === 'sm' ? { padding: '2px 8px' } : undefined}>
      {dot && <span className="tag-dot" />}
      {children}
    </span>
  );
}
