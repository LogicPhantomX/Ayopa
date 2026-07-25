/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useSyncExternalStore } from "react";
import { cartStore } from "../lib/cartStore";
import { Listing } from "../types/backend";

export function useCart() {
  const lines = useSyncExternalStore(cartStore.subscribe, cartStore.getLines, cartStore.getLines);

  const activeLines = lines.filter((l) => !l.savedForLater);
  const savedLines = lines.filter((l) => l.savedForLater);
  const itemCount = activeLines.reduce((sum, l) => sum + l.quantity, 0);
  const subtotal = activeLines.reduce((sum, l) => sum + l.quantity * l.listing.price, 0);

  const addItem = useCallback((listing: Listing, quantity: number) => cartStore.addItem(listing, quantity), []);
  const updateQuantity = useCallback((lineId: string, quantity: number) => cartStore.updateQuantity(lineId, quantity), []);
  const removeItem = useCallback((lineId: string) => cartStore.removeItem(lineId), []);
  const saveForLater = useCallback((lineId: string) => cartStore.saveForLater(lineId), []);
  const moveToCart = useCallback((lineId: string) => cartStore.moveToCart(lineId), []);

  return { lines, activeLines, savedLines, itemCount, subtotal, addItem, updateQuantity, removeItem, saveForLater, moveToCart };
}
