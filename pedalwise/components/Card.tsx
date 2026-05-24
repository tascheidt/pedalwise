export function Card({
  children,
  className = "",
  padding = 16,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  padding?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-[10px] ${className}`}
      style={{
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-default)",
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
