import Badge, { BadgeVariant } from './Badge';

export default function ProgressRow({
  label,
  value,
  max,
  variant = 'neutral',
}: {
  label: string;
  value: number;
  max: number;
  variant?: BadgeVariant;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="w-32 shrink-0">
        <Badge label={label} variant={variant} />
      </div>
      <div className="flex-1 h-2 rounded-full bg-background overflow-hidden">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}
