/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";

/**
 * useState that reads its initial value from localStorage and writes back
 * on every change. Centralizes the read/parse/write pattern that used to be
 * duplicated once per top-level slice of state in App.tsx.
 */
export function usePersistedState<T>(key: string, initialValue: T | (() => T)) {
  const [state, setState] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved) as T;
    } catch {
      // Corrupt or inaccessible storage — fall back to the initial value.
    }
    return initialValue instanceof Function ? initialValue() : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState] as const;
}
