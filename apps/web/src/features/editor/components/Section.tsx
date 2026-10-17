type Props = { label: string; children: React.ReactNode };

export const Section = ({ label, children }: Props) => (
  <div className="flex flex-col gap-1">
    <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
    {children}
  </div>
);
