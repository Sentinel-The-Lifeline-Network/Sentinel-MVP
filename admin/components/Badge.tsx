const VARIANTS = {
  neutral: 'bg-background text-muted border-border',
  success: 'bg-[#E8F1EC] text-primary border-[#CFE3D7]',
  danger: 'bg-danger-soft text-danger border-[#E7CFC9]',
  warning: 'bg-[#FBF1D9] text-[#9A7B16] border-[#F1E2B8]',
  info: 'bg-[#E8EEF1] text-[#36586B] border-[#D2DEE3]',
} as const;

export type BadgeVariant = keyof typeof VARIANTS;

export default function Badge({ label, variant = 'neutral' }: { label: string; variant?: BadgeVariant }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${VARIANTS[variant]}`}
    >
      {label}
    </span>
  );
}
