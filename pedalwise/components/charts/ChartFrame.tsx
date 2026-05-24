import { SectionLabel } from "../SectionLabel";

export function ChartFrame({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[10px] p-3 flex flex-col"
      style={{
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-default)",
        height: 252,
      }}
    >
      <div className="flex items-baseline justify-between">
        <SectionLabel>{title}</SectionLabel>
        {subtitle && (
          <div className="italic" style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
            {subtitle}
          </div>
        )}
      </div>
      <div className="flex-1 mt-2 min-h-0">{children}</div>
      {footer && <div className="mt-1">{footer}</div>}
    </div>
  );
}
