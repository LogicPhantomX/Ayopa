/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Paystack's hosted checkout requires a full-page redirect away from the SPA
// and back — there's no way to keep this in React state across that trip.
// A single Paystack transaction also only carries one of our transactionIds
// in its metadata (see paystack.controller.ts `initialize`), so a cart with
// several different sellers becomes several sequential Paystack payments,
// tracked here while the browser round-trips.

export interface PaymentQueueItem {
  transactionId: string;
  listingTitle: string;
  amount: number;
}

export interface PaymentQueue {
  email: string;
  pending: PaymentQueueItem[];
  paid: PaymentQueueItem[];
  failed: PaymentQueueItem[];
}

const KEY = "ayopa_payment_queue";

export function getQueue(): PaymentQueue | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PaymentQueue) : null;
  } catch {
    return null;
  }
}

export function startQueue(email: string, items: PaymentQueueItem[]) {
  const queue: PaymentQueue = { email, pending: items, paid: [], failed: [] };
  localStorage.setItem(KEY, JSON.stringify(queue));
  return queue;
}

export function markCurrentPaid() {
  const queue = getQueue();
  if (!queue || queue.pending.length === 0) return queue;
  const [done, ...rest] = queue.pending;
  queue.paid.push(done);
  queue.pending = rest;
  localStorage.setItem(KEY, JSON.stringify(queue));
  return queue;
}

export function markCurrentFailed() {
  const queue = getQueue();
  if (!queue || queue.pending.length === 0) return queue;
  const [done, ...rest] = queue.pending;
  queue.failed.push(done);
  queue.pending = rest;
  localStorage.setItem(KEY, JSON.stringify(queue));
  return queue;
}

export function clearQueue() {
  localStorage.removeItem(KEY);
}
