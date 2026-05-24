/**
 * Plain-English contextual help block, used inline on the DIY step
 * pages (PW-102). Per the Tone & Voice doctrine: a single named
 * cycling quantity, a short translation, and at most one named range.
 * No banned phrases, no marketing throat-clearing.
 */
export type ExplainerProps = {
  /** A short noun-phrase title — the metric or step being explained. */
  title: string;
  children: React.ReactNode;
};

export function Explainer({ title, children }: ExplainerProps) {
  return (
    <aside
      data-testid="diy-explainer"
      style={{
        background: "var(--color-accent-light)",
        color: "var(--color-accent-dark)",
        borderRadius: 10,
        padding: "12px 14px",
        fontSize: 12,
        lineHeight: 1.55,
      }}
    >
      <strong style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>
        {title}
      </strong>
      <span style={{ color: "var(--color-text-secondary)" }}>{children}</span>
    </aside>
  );
}
