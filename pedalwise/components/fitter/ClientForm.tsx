"use client";

import { useEffect, useRef, useState } from "react";

import type { Client } from "@/lib/types";
import { Button } from "@/components/Button";
import { SectionLabel } from "@/components/SectionLabel";

/**
 * ClientForm (PW-103) — inline create/edit form for a client.
 *
 * Fields: name (required), notes (optional). Anatomy is per-session,
 * not per-client, so it is intentionally not collected here.
 *
 * Used by ClientRoster in two modes:
 *   - "create": empty fields, Submit button labelled "Add client"
 *   - "edit":   pre-filled, Submit button labelled "Save changes"
 */
export function ClientForm({
  initial,
  onSubmit,
  onCancel,
  mode = "create",
}: {
  initial?: Pick<Client, "name" | "notes">;
  onSubmit: (values: { name: string; notes?: string }) => void;
  onCancel: () => void;
  mode?: "create" | "edit";
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const nameRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus the name field when the form opens — keyboard-first workflow
  // for a fitter who hits "n" between clients.
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    const trimmedNotes = notes.trim();
    onSubmit({
      name: trimmed,
      ...(trimmedNotes.length > 0 ? { notes: trimmedNotes } : {}),
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="flex flex-col gap-3 rounded-[10px] p-4"
      style={{
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-accent)",
      }}
      data-testid="client-form"
      aria-label={mode === "create" ? "New client" : "Edit client"}
    >
      <SectionLabel>{mode === "create" ? "New client" : "Edit client"}</SectionLabel>

      <label className="flex flex-col gap-1">
        <span className="section-label">Name</span>
        <input
          ref={nameRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={80}
          placeholder="e.g. Marcus L."
          data-testid="client-form-name"
          className="rounded-md px-3 py-2"
          style={{
            background: "var(--color-bg-app)",
            border: "1px solid var(--color-border-default)",
            color: "var(--color-text-primary)",
            fontSize: 14,
          }}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="section-label">Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Discipline, goals, prior injuries"
          data-testid="client-form-notes"
          className="rounded-md px-3 py-2"
          style={{
            background: "var(--color-bg-app)",
            border: "1px solid var(--color-border-default)",
            color: "var(--color-text-primary)",
            fontSize: 13,
            resize: "vertical",
            fontFamily: "inherit",
          }}
        />
      </label>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          data-testid="client-form-cancel"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={name.trim().length === 0}
          data-testid="client-form-submit"
        >
          {mode === "create" ? "Add client" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
