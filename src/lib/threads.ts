import type { UIMessage } from "ai";

export interface ThreadRecord {
  id: string;
  title: string;
  updatedAt: number;
  messages: UIMessage[];
}

const KEY = "edubridge.threads.v1";

const isBrowser = () => typeof window !== "undefined";

function readAll(): ThreadRecord[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ThreadRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(threads: ThreadRecord[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(KEY, JSON.stringify(threads));
  window.dispatchEvent(new CustomEvent("edubridge:threads-changed"));
}

export function listThreads(): ThreadRecord[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getThread(id: string): ThreadRecord | undefined {
  return readAll().find((t) => t.id === id);
}

function newId() {
  if (isBrowser() && "crypto" in window && "randomUUID" in window.crypto) {
    return window.crypto.randomUUID();
  }
  return `t_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function createThread(initial?: Partial<ThreadRecord>): ThreadRecord {
  const thread: ThreadRecord = {
    id: initial?.id ?? newId(),
    title: initial?.title ?? "New chat",
    updatedAt: Date.now(),
    messages: initial?.messages ?? [],
  };
  const all = readAll();
  writeAll([thread, ...all.filter((t) => t.id !== thread.id)]);
  return thread;
}

export function ensureInitialThread(): ThreadRecord {
  const all = readAll();
  if (all.length > 0) {
    return all.sort((a, b) => b.updatedAt - a.updatedAt)[0]!;
  }
  return createThread({ title: "New chat" });
}

export function saveThreadMessages(id: string, messages: UIMessage[]) {
  const all = readAll();
  const existing = all.find((t) => t.id === id);
  const title = deriveTitle(messages) ?? existing?.title ?? "New chat";
  const next: ThreadRecord = {
    id,
    title,
    updatedAt: Date.now(),
    messages,
  };
  const others = all.filter((t) => t.id !== id);
  writeAll([next, ...others]);
}

export function deleteThread(id: string) {
  writeAll(readAll().filter((t) => t.id !== id));
}

export function renameThread(id: string, title: string) {
  const all = readAll();
  const idx = all.findIndex((t) => t.id === id);
  if (idx === -1) return;
  all[idx] = { ...all[idx]!, title, updatedAt: Date.now() };
  writeAll(all);
}

function deriveTitle(messages: UIMessage[]): string | null {
  const first = messages.find((m) => m.role === "user");
  if (!first) return null;
  const text = first.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { text: string }).text)
    .join(" ")
    .trim();
  if (!text) return null;
  return text.length > 48 ? text.slice(0, 45) + "…" : text;
}
