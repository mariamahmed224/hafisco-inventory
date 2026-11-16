export default function StatusBadge({ status }) {
  const map = {
    'In Stock': 'badge-ok',
    'Low Stock': 'badge-warn',
    'Out of Stock': 'badge-danger',
  };
  return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status}</span>;
}
