interface StatusBadgeProps {
  status: 'active' | 'resolved' | 'cancelled';
}

const config = {
  active: { label: 'Active', color: '#C53A2D', bg: '#EDE0DD', dot: '#C53A2D' },
  resolved: { label: 'Resolved', color: '#0B3D2E', bg: '#F7F4EE', dot: '#1F5A47' },
  cancelled: { label: 'Cancelled', color: '#6B6B6B', bg: '#F7F4EE', dot: '#6B6B6B' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { label, color, bg, dot } = config[status] || config.cancelled;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ color, background: bg, border: '1px solid #E7E0D7' }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
      {label}
    </span>
  );
}
