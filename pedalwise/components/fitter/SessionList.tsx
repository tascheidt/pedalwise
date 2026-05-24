"use client";

import type { Session } from "@/lib/types";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { SectionLabel } from "@/components/SectionLabel";

/**
 * SessionList (PW-103) — left-rail list of sessions for the active client.
 *
 * Each row is a button that selects the session as active. Selecting a session
 * is the parent's job; this component is presentation only.
 *
 * Row content per Tone & Voice §5: mono numbers, signed deltas, one unit per
 * number. The "applied" badge fires when the fitter has written a
 * recommendation back to the session via `applySessionRecommendation`.
 */
export function SessionList({
  sessions,
  activeId,
  onSelect,
  onNew,
}: {
  sessions: Session[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <aside
      className="flex flex-col rounded-[10px]"
      style={{
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-default)",
        height: "100%",
        minHeight: 0,
      }}
      aria-label="Sessions"
    >
      <div
        className="flex items-center justify-between"
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid var(--color-border-default)",
        }}
      >
        <SectionLabel>Sessions</SectionLabel>
        <Button
          variant="secondary"
          size="sm"
          onClick={onNew}
          data-testid="new-session-button"
        >
          + New
        </Button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          minHeight: 0,
        }}
      >
        {sessions.length === 0 ? (
          <div
            style={{
              padding: "20px 14px",
              fontSize: 12,
              color: "var(--color-text-tertiary)",
              lineHeight: 1.5,
            }}
            data-testid="session-list-empty"
          >
            No sessions yet. Press <strong>+ New</strong> to start one with the default rider profile.
          </div>
        ) : (
          <ul
            role="list"
            style={{ margin: 0, padding: 0, listStyle: "none" }}
          >
            {sessions.map((s, i) => (
              <li key={s.id}>
                <SessionRow
                  session={s}
                  index={sessions.length - i}
                  active={s.id === activeId}
                  onSelect={() => onSelect(s.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

function SessionRow({
  session,
  index,
  active,
  onSelect,
}: {
  session: Session;
  index: number;
  active: boolean;
  onSelect: () => void;
}) {
  const applied = session.applied !== undefined;
  const date = new Date(session.createdAt);
  const dateStr = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  // Headline metric for the row: prefer the applied gross-η if set, otherwise
  // fall back to current cadence so the row always carries a number per
  // principle #4. We don't recompute physics here — applied snapshot only.
  const eta = session.applied?.metrics.grossEfficiency;
  const knee = session.applied?.metrics.kneeAtBDC;

  return (
    <button
      type="button"
      onClick={onSelect}
      data-testid={`session-row-${session.id}`}
      aria-current={active ? "true" : undefined}
      className="w-full text-left cursor-pointer"
      style={{
        display: "block",
        padding: "12px 14px",
        background: active ? "var(--color-accent-light)" : "transparent",
        borderLeft: active
          ? "3px solid var(--color-accent)"
          : "3px solid transparent",
        borderBottom: "1px solid var(--color-border-default)",
        color: "inherit",
        font: "inherit",
      }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span
          style={{
            fontSize: 13,
            fontWeight: active ? 600 : 500,
            color: "var(--color-text-primary)",
          }}
        >
          Session {index}
        </span>
        <Badge tone={applied ? "success" : "neutral"}>
          {applied ? "Applied" : "Draft"}
        </Badge>
      </div>
      <div
        className="mono"
        style={{
          fontSize: 11,
          color: "var(--color-text-tertiary)",
          marginTop: 4,
        }}
      >
        {dateStr} · {timeStr}
      </div>
      <div
        className="mono flex items-baseline gap-3"
        style={{
          fontSize: 11,
          color: "var(--color-text-secondary)",
          marginTop: 6,
        }}
      >
        <span>
          saddle {session.config.saddleHeight.toFixed(1)} cm
        </span>
        <span>
          crank {session.config.crankLength.toFixed(0)} mm
        </span>
        <span>{session.config.cadence} rpm</span>
      </div>
      {applied && eta !== undefined && knee !== undefined && (
        <div
          className="mono flex items-baseline gap-3"
          style={{
            fontSize: 11,
            color: "var(--color-success)",
            marginTop: 4,
          }}
        >
          <span>η {(eta * 100).toFixed(1)}%</span>
          <span style={{ color: "var(--color-text-secondary)" }}>
            knee {knee.toFixed(0)}°
          </span>
        </div>
      )}
    </button>
  );
}
