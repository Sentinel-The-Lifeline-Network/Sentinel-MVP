import { ReactNode } from 'react';

const ACCENTS = {
  primary: 'bg-[#E8F1EC] text-primary',
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-[#FBF1D9] text-[#9A7B16]',
  info: 'bg-[#E8EEF1] text-[#36586B]',
  muted: 'bg-background text-muted',
} as const;

export default function StatCard({
  label,
  value,
  hint,
  icon,
  accent = 'primary',
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon?: ReactNode;
  accent?: keyof typeof ACCENTS;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex items-start justify-between gap-3 transition-shadow hover:shadow-sm">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <p className="font-heading text-2xl font-bold mt-2 tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
      </div>
      {icon && <div className={`rounded-xl p-2 ${ACCENTS[accent]}`}>{icon}</div>}
    </div>
  );
}
