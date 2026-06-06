interface StatusBadgeProps {
  status: 'active' | 'resolved' | 'cancelled';
}

const config = {
  active: { label: 'Active', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', dot: '#EF4444' },
  resolved: { label: 'Resolved', color: '#10B981', bg: 'rgba(16,185,129,0.12)', dot: '#10B981' },
  cancelled: { label: 'Cancelled', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', dot: '#94A3B8' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { label, color, bg, dot } = config[status] || config.cancelled;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ color, background: bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
      {label}
    </span>
  );
}
