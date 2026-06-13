export default function BarChart({
  title,
  description,
  data,
}: {
  title: string;
  description?: string;
  data: { date: string; count: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((sum, d) => sum + d.count, 0);

  const formatLabel = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
        </div>
        <p className="font-heading text-lg font-bold tabular-nums">{total.toLocaleString()}</p>
      </div>
      <div className="flex items-stretch gap-1.5 h-28">
        {data.map((d) => (
          <div
            key={d.date}
            className="group relative flex-1 rounded-sm bg-primary/10 hover:bg-primary/15 transition-colors"
          >
            <div
              className="absolute bottom-0 left-0 right-0 rounded-sm bg-primary transition-all"
              style={{ height: `${Math.max(3, (d.count / max) * 100)}%` }}
            />
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-[#151515] text-white text-[11px] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              {formatLabel(d.date)}: {d.count}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[11px] text-muted">
        <span>{data[0] && formatLabel(data[0].date)}</span>
        <span>{data[data.length - 1] && formatLabel(data[data.length - 1].date)}</span>
      </div>
    </div>
  );
}
