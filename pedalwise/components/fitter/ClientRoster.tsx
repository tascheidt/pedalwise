"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import type { Client } from "@/lib/types";
import {
  archiveClient,
  createClient,
  listClients,
  listSessionsForClient,
  restoreClient,
  updateClient,
} from "@/lib/storage";

import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { SectionLabel } from "@/components/SectionLabel";
import { ClientForm } from "./ClientForm";

/**
 * ClientRoster (PW-103) — entry view of the Fitter studio.
 *
 * Lists active clients with last-session date + session count; toggle reveals
 * archived clients (soft-deleted; 7-day recovery handled by storage). Clicking
 * a client navigates to `/fitter/{clientId}`.
 *
 * Storage CRUD goes through `lib/storage.ts` exclusively — never duplicate.
 */
export function ClientRoster() {
  // Single source of truth for whether we've read LocalStorage. SSR renders
  // the empty/loading state to avoid hydration mismatch.
  const [hydrated, setHydrated] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({});
  const [lastSessionAt, setLastSessionAt] = useState<Record<string, number | null>>({});
  const [filter, setFilter] = useState<"active" | "archived">("active");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const all = listClients(true);
    setClients(all);
    const counts: Record<string, number> = {};
    const lasts: Record<string, number | null> = {};
    for (const c of all) {
      const sessions = listSessionsForClient(c.id);
      counts[c.id] = sessions.length;
      lasts[c.id] = sessions[0]?.createdAt ?? null;
    }
    setSessionCounts(counts);
    setLastSessionAt(lasts);
  }, []);

  // LocalStorage is read on mount; SSR returns the loading shell.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    refresh();
    setHydrated(true);
  }, [refresh]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const visible = useMemo(() => {
    if (filter === "active") return clients.filter((c) => c.archivedAt === undefined);
    return clients.filter((c) => c.archivedAt !== undefined);
  }, [clients, filter]);

  const activeCount = clients.filter((c) => c.archivedAt === undefined).length;
  const archivedCount = clients.length - activeCount;

  function handleCreate(values: { name: string; notes?: string }) {
    createClient(values.name, values.notes);
    setShowForm(false);
    refresh();
  }

  function handleEditSave(id: string, values: { name: string; notes?: string }) {
    // Preserve undefined-notes semantics so the storage patch clears the field.
    updateClient(id, { name: values.name, notes: values.notes ?? "" });
    setEditingId(null);
    refresh();
  }

  function handleArchive(id: string) {
    archiveClient(id);
    refresh();
  }

  function handleRestore(id: string) {
    restoreClient(id);
    refresh();
  }

  return (
    <main
      className="mx-auto w-full"
      style={{ maxWidth: 1100, padding: "32px 24px 64px" }}
    >
      {/* Header */}
      <div className="flex items-end justify-between" style={{ marginBottom: 24 }}>
        <div>
          <SectionLabel>Fitter studio</SectionLabel>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              margin: "6px 0 4px",
              color: "var(--color-text-primary)",
            }}
          >
            Clients
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "var(--color-text-secondary)",
              margin: 0,
            }}
          >
            Open a client to start a session. Sessions persist in this browser only.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FilterToggle
            value={filter}
            onChange={setFilter}
            activeCount={activeCount}
            archivedCount={archivedCount}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingId(null);
              setShowForm(true);
            }}
            data-testid="new-client-button"
          >
            + New client
          </Button>
        </div>
      </div>

      {/* New client form */}
      {showForm && (
        <div style={{ marginBottom: 16 }}>
          <ClientForm
            mode="create"
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Roster */}
      {!hydrated ? (
        <div
          className="rounded-[10px] p-8 text-center"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border-default)",
            color: "var(--color-text-tertiary)",
            fontSize: 13,
          }}
        >
          Loading roster...
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          filter={filter}
          onNew={() => {
            setEditingId(null);
            setShowForm(true);
          }}
        />
      ) : (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
        >
          {visible.map((c) => (
            <ClientCard
              key={c.id}
              client={c}
              sessionCount={sessionCounts[c.id] ?? 0}
              lastSessionAt={lastSessionAt[c.id] ?? null}
              isEditing={editingId === c.id}
              onEditStart={() => {
                setShowForm(false);
                setEditingId(c.id);
              }}
              onEditCancel={() => setEditingId(null)}
              onEditSave={(values) => handleEditSave(c.id, values)}
              onArchive={() => handleArchive(c.id)}
              onRestore={() => handleRestore(c.id)}
            />
          ))}
        </div>
      )}
    </main>
  );
}

/* ------------------------------------------------------------------ */

function FilterToggle({
  value,
  onChange,
  activeCount,
  archivedCount,
}: {
  value: "active" | "archived";
  onChange: (v: "active" | "archived") => void;
  activeCount: number;
  archivedCount: number;
}) {
  return (
    <div
      role="tablist"
      aria-label="Filter clients"
      className="inline-flex rounded-md"
      style={{
        background: "var(--color-bg-alt)",
        border: "1px solid var(--color-border-default)",
        padding: 2,
      }}
    >
      <ToggleButton
        active={value === "active"}
        onClick={() => onChange("active")}
        label={`Active · ${activeCount}`}
        testId="filter-active"
      />
      <ToggleButton
        active={value === "archived"}
        onClick={() => onChange("archived")}
        label={`Archived · ${archivedCount}`}
        testId="filter-archived"
      />
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
  testId,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  testId: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      data-testid={testId}
      className="rounded-md cursor-pointer"
      style={{
        padding: "5px 12px",
        fontSize: 12,
        fontWeight: 500,
        background: active ? "var(--color-bg-surface)" : "transparent",
        color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
        border: active ? "1px solid var(--color-border-default)" : "1px solid transparent",
      }}
    >
      {label}
    </button>
  );
}

function ClientCard({
  client,
  sessionCount,
  lastSessionAt,
  isEditing,
  onEditStart,
  onEditCancel,
  onEditSave,
  onArchive,
  onRestore,
}: {
  client: Client;
  sessionCount: number;
  lastSessionAt: number | null;
  isEditing: boolean;
  onEditStart: () => void;
  onEditCancel: () => void;
  onEditSave: (values: { name: string; notes?: string }) => void;
  onArchive: () => void;
  onRestore: () => void;
}) {
  const archived = client.archivedAt !== undefined;
  const initials = client.name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const last = lastSessionAt ? formatDate(lastSessionAt) : "no sessions yet";

  if (isEditing) {
    return (
      <ClientForm
        mode="edit"
        initial={{ name: client.name, ...(client.notes !== undefined ? { notes: client.notes } : {}) }}
        onSubmit={onEditSave}
        onCancel={onEditCancel}
      />
    );
  }

  return (
    <article
      className="rounded-[10px] p-4 flex flex-col gap-3"
      style={{
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-default)",
        opacity: archived ? 0.7 : 1,
      }}
      data-testid={`client-row-${client.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={archived ? "#" : `/fitter/${client.id}`}
          aria-disabled={archived}
          onClick={(e) => {
            if (archived) e.preventDefault();
          }}
          className="flex items-center gap-3 cursor-pointer"
          style={{
            flex: 1,
            minWidth: 0,
            color: "inherit",
            textDecoration: "none",
            pointerEvents: archived ? "none" : undefined,
          }}
          data-testid={`client-open-${client.id}`}
        >
          <div
            aria-hidden
            className="rounded-full flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              background: "var(--color-accent-light)",
              color: "var(--color-accent-dark)",
              fontWeight: 600,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {initials || "—"}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--color-text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {client.name}
            </div>
            <div
              className="mono"
              style={{
                fontSize: 11,
                color: "var(--color-text-tertiary)",
                marginTop: 2,
              }}
            >
              {sessionCount} {sessionCount === 1 ? "session" : "sessions"} · {last}
            </div>
          </div>
        </Link>
        {archived && <Badge tone="neutral">Archived</Badge>}
      </div>

      {client.notes && (
        <div
          style={{
            fontSize: 12,
            color: "var(--color-text-secondary)",
            lineHeight: 1.5,
            background: "var(--color-bg-alt)",
            padding: "8px 10px",
            borderRadius: 6,
          }}
        >
          {client.notes}
        </div>
      )}

      <div
        className="flex items-center justify-end gap-1"
        style={{
          paddingTop: 4,
          borderTop: "1px solid var(--color-border-default)",
        }}
      >
        {archived ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRestore}
            data-testid={`restore-client-${client.id}`}
            aria-label={`Restore ${client.name}`}
          >
            Restore
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEditStart}
              data-testid={`edit-client-${client.id}`}
              aria-label={`Edit ${client.name}`}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onArchive}
              data-testid={`archive-client-${client.id}`}
              aria-label={`Archive ${client.name}`}
            >
              Archive
            </Button>
          </>
        )}
      </div>
    </article>
  );
}

function EmptyState({
  filter,
  onNew,
}: {
  filter: "active" | "archived";
  onNew: () => void;
}) {
  if (filter === "archived") {
    return (
      <div
        className="rounded-[10px] p-12 text-center flex flex-col items-center gap-3"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px dashed var(--color-border-default)",
        }}
        data-testid="roster-empty-archived"
      >
        <div style={{ fontSize: 14, color: "var(--color-text-primary)", fontWeight: 500 }}>
          No archived clients.
        </div>
        <div style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
          Archived clients land here for 7 days before they are purged.
        </div>
      </div>
    );
  }
  return (
    <div
      className="rounded-[10px] p-12 text-center flex flex-col items-center gap-3"
      style={{
        background: "var(--color-bg-surface)",
        border: "1px dashed var(--color-border-default)",
      }}
      data-testid="roster-empty-active"
    >
      <div style={{ fontSize: 14, color: "var(--color-text-primary)", fontWeight: 500 }}>
        No clients yet.
      </div>
      <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", maxWidth: 380 }}>
        Add a client to start a session. Each session captures anatomy, fit,
        and goal; the optimizer proposes a fit you apply on click.
      </div>
      <div style={{ marginTop: 8 }}>
        <Button
          variant="primary"
          size="md"
          onClick={onNew}
          data-testid="empty-state-new-client-button"
        >
          + New client
        </Button>
      </div>
    </div>
  );
}

function formatDate(ms: number): string {
  const d = new Date(ms);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return "today";
  const diffMs = now.getTime() - d.getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

