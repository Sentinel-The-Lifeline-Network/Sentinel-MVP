export default function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
      {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
    </div>
  );
}
