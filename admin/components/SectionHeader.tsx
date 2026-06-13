export default function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>
      {description && <p className="text-sm text-muted mt-1">{description}</p>}
    </div>
  );
}
