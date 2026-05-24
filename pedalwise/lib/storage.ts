/**
 * LocalStorage CRUD for Pedalwise persisted state.
 *
 * SSR-safe: all functions no-op gracefully when
 * `typeof window === "undefined"`.
 *
 * Keys managed here:
 *   pedalwise.workspace  — "diy" | "fitter" | "engineer" | null
 *   pedalwise.clients    — Client[]
 *   pedalwise.sessions   — Session[]
 *
 * Key NOT managed here (Stream F2 owns it):
 *   pedalwise.viewMode   — "anatomical" | "realistic" | "diagnostic"
 */

import type { Client, Config, Session } from "./types";
import type { BikeFit, Metrics } from "./types";

export type Workspace = "diy" | "fitter" | "engineer";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const KEYS = {
  workspace: "pedalwise.workspace",
  clients: "pedalwise.clients",
  sessions: "pedalwise.sessions",
} as const;

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

function readJSON<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or private mode — silently ignore.
  }
}

function nowMs(): number {
  return Date.now();
}

function uuid(): string {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// Workspace
// ---------------------------------------------------------------------------

export function getWorkspace(): Workspace | null {
  const v = readJSON<string | null>(KEYS.workspace, null);
  if (v === "diy" || v === "fitter" || v === "engineer") return v;
  return null;
}

export function setWorkspace(w: Workspace): void {
  writeJSON(KEYS.workspace, w);
}

export function clearWorkspace(): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(KEYS.workspace);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

function readClients(): Client[] {
  return readJSON<Client[]>(KEYS.clients, []);
}

function writeClients(clients: Client[]): void {
  writeJSON(KEYS.clients, clients);
}

/**
 * Returns all clients. Pass `includeArchived: true` to include soft-deleted
 * clients (those with an `archivedAt` timestamp). Defaults to active only.
 */
export function listClients(includeArchived = false): Client[] {
  const all = readClients();
  return includeArchived ? all : all.filter((c) => c.archivedAt === undefined);
}

export function getClient(id: string): Client | null {
  return readClients().find((c) => c.id === id) ?? null;
}

export function createClient(name: string, notes?: string): Client {
  const client: Client = {
    id: uuid(),
    name,
    ...(notes !== undefined ? { notes } : {}),
    createdAt: nowMs(),
  };
  const clients = readClients();
  clients.push(client);
  writeClients(clients);
  return client;
}

export function updateClient(
  id: string,
  patch: Partial<Pick<Client, "name" | "notes">>,
): Client | null {
  const clients = readClients();
  const idx = clients.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const updated: Client = { ...clients[idx], ...patch };
  clients[idx] = updated;
  writeClients(clients);
  return updated;
}

/** Soft-delete: sets archivedAt to now. */
export function archiveClient(id: string): void {
  const clients = readClients();
  const idx = clients.findIndex((c) => c.id === id);
  if (idx === -1) return;
  clients[idx] = { ...clients[idx], archivedAt: nowMs() };
  writeClients(clients);
}

/** Restore a soft-deleted client (clears archivedAt). */
export function restoreClient(id: string): void {
  const clients = readClients();
  const idx = clients.findIndex((c) => c.id === id);
  if (idx === -1) return;
  const { archivedAt: _removed, ...rest } = clients[idx];
  clients[idx] = rest;
  writeClients(clients);
}

/**
 * Hard-delete all archived clients older than `olderThanDays` days.
 * Default: 7 days per PW-103 spec.
 */
export function purgeArchivedClients(olderThanDays = 7): void {
  const cutoff = nowMs() - olderThanDays * 24 * 60 * 60 * 1000;
  const clients = readClients();
  const kept = clients.filter(
    (c) => c.archivedAt === undefined || c.archivedAt > cutoff,
  );
  writeClients(kept);
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

function readSessions(): Session[] {
  return readJSON<Session[]>(KEYS.sessions, []);
}

function writeSessions(sessions: Session[]): void {
  writeJSON(KEYS.sessions, sessions);
}

/** Returns all sessions for a client, newest first. */
export function listSessionsForClient(clientId: string): Session[] {
  return readSessions()
    .filter((s) => s.clientId === clientId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function createSession(clientId: string, config: Config): Session {
  const session: Session = {
    id: uuid(),
    clientId,
    createdAt: nowMs(),
    config,
  };
  const sessions = readSessions();
  sessions.push(session);
  writeSessions(sessions);
  return session;
}

export function applySessionRecommendation(
  sessionId: string,
  applied: NonNullable<Session["applied"]>,
): Session | null {
  const sessions = readSessions();
  const idx = sessions.findIndex((s) => s.id === sessionId);
  if (idx === -1) return null;
  const updated: Session = { ...sessions[idx], applied };
  sessions[idx] = updated;
  writeSessions(sessions);
  return updated;
}

export function deleteSession(id: string): void {
  const sessions = readSessions().filter((s) => s.id !== id);
  writeSessions(sessions);
}

// Re-export types used by callers who import from this module for convenience.
export type { Client, Session, BikeFit, Metrics };
