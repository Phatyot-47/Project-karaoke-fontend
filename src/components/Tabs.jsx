export default function Tabs({ items, value, onChange }) {
  return (
    <div className="tabs">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`tab-btn${item.id === value ? ' active' : ''}`}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
