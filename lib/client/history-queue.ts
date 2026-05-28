"use client";

import { walletAuthenticatedFetch } from "@/lib/client/wallet-auth-fetch";

type PendingSetupAction = {
  kind: "setup-action";
  wallet: string;
  type: "initialize-mint" | "fund-treasury";
  amount?: number;
  txSig?: string;
  status: "success" | "failed";
  queuedAt: string;
};

type PendingHistoryItem = PendingSetupAction;

const PENDING_HISTORY_KEY = "expaynse:pending-history";

function safeParse(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function loadQueue(): PendingHistoryItem[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(PENDING_HISTORY_KEY);
  if (!raw) return [];
  const parsed = safeParse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item): item is PendingHistoryItem => {
    if (!item || typeof item !== "object") return false;
    const record = item as Record<string, unknown>;
    return (
      record.kind === "setup-action" &&
      typeof record.wallet === "string" &&
      (record.type === "initialize-mint" || record.type === "fund-treasury") &&
      (record.status === "success" || record.status === "failed") &&
      typeof record.queuedAt === "string"
    );
  });
}

function saveQueue(items: PendingHistoryItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PENDING_HISTORY_KEY, JSON.stringify(items));
  } catch {
    // no-op
  }
}

export function enqueuePendingSetupAction(item: Omit<PendingSetupAction, "queuedAt">) {
  if (typeof window === "undefined") return;
  const queue = loadQueue();
  const queuedAt = new Date().toISOString();
  queue.push({ ...item, queuedAt });
  saveQueue(queue);
}

export async function drainPendingHistory(input: {
  wallet: string;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
}) {
  if (typeof window === "undefined") return { drained: 0, remaining: 0 };

  const queue = loadQueue();
  if (queue.length === 0) return { drained: 0, remaining: 0 };

  const remaining: PendingHistoryItem[] = [];
  let drained = 0;

  for (const item of queue) {
    if (item.wallet !== input.wallet) {
      remaining.push(item);
      continue;
    }

    try {
      const res = await walletAuthenticatedFetch({
        wallet: input.wallet,
        signMessage: input.signMessage,
        path: `/api/history?wallet=${input.wallet}`,
        method: "POST",
        body: item,
      });

      if (!res.ok) {
        remaining.push(item);
        continue;
      }

      drained += 1;
    } catch {
      remaining.push(item);
    }
  }

  saveQueue(remaining);
  return { drained, remaining: remaining.length };
}

export function getPendingHistoryCount(wallet: string) {
  return loadQueue().filter((item) => item.wallet === wallet).length;
}

