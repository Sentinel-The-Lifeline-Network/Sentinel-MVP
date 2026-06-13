export default function BarChart({
  title,
  data,
}: {
  title: string;
  data: { date: string; count: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <p className="text-xs uppercase tracking-wide text-muted mb-4">{title}</p>
      <div className="flex items-end gap-1.5 h-32">
        {data.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
            <span className="text-[10px] text-muted">{d.count || ''}</span>
            <div
              className="w-full rounded-t bg-primary/80 transition-all"
              style={{ height: `${Math.max(2, (d.count / max) * 100)}%` }}
              title={`${d.date}: ${d.count}`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-muted">
        <span>{data[0]?.date.slice(5)}</span>
        <span>{data[data.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}
