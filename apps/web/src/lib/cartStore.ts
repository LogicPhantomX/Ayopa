/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Listing } from "../types/backend";

// The backend has no cart, line-items, or stock/quantity model — a
// Transaction is one listing + one amount (see api/types.ts header comment).
// This store is a pure client-side convenience so buyers can queue up
// multiple listings before paying. At checkout, each line becomes exactly
// one Transaction with amount = quantity × listing.price; quantity itself is
// never sent to the backend beyond that multiplication.

export interface CartLine {
  id: string; // local id, stable per listing while it's in the cart
  listing: Listing;
  quantity: number;
  savedForLater: boolean;
}

const CART_KEY = "ayopa_cart_v2";

type Listener = () => void;
const listeners = new Set<Listener>();

function readFromStorage(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

// useSyncExternalStore requires getSnapshot() to return the SAME reference
// when nothing changed, or React treats every render as a change (infinite
// loop). Cache the array and only replace it on write().
let cachedLines: CartLine[] = readFromStorage();

function write(lines: CartLine[]) {
  cachedLines = lines;
  localStorage.setItem(CART_KEY, JSON.stringify(lines));
  listeners.forEach((l) => l());
}

function read(): CartLine[] {
  return cachedLines;
}

export const cartStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getLines(): CartLine[] {
    return read();
  },

  addItem(listing: Listing, quantity: number) {
    const lines = read();
    const existingIndex = lines.findIndex((l) => l.listing.id === listing.id && !l.savedForLater);
    if (existingIndex !== -1) {
      const next = [...lines];
      next[existingIndex] = { ...next[existingIndex], quantity: next[existingIndex].quantity + quantity };
      write(next);
    } else {
      write([...lines, { id: `cl-${listing.id}-${Date.now()}`, listing, quantity, savedForLater: false }]);
    }
  },

  updateQuantity(lineId: string, quantity: number) {
    const lines = read();
    if (quantity <= 0) {
      write(lines.filter((l) => l.id !== lineId));
    } else {
      write(lines.map((l) => (l.id === lineId ? { ...l, quantity } : l)));
    }
  },

  removeItem(lineId: string) {
    write(read().filter((l) => l.id !== lineId));
  },

  saveForLater(lineId: string) {
    write(read().map((l) => (l.id === lineId ? { ...l, savedForLater: true } : l)));
  },

  moveToCart(lineId: string) {
    write(read().map((l) => (l.id === lineId ? { ...l, savedForLater: false } : l)));
  },

  removeLines(lineIds: string[]) {
    write(read().filter((l) => !lineIds.includes(l.id)));
  },

  clear() {
    write([]);
  },
};
