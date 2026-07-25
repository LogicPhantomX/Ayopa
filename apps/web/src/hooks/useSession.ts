/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from "react";
import { getApiClient } from "../api/client";
import { BackendUser } from "../types/backend";

// Thin wrapper around api.auth.me() so every workspace (buyer/seller/admin)
// shares one source of truth for "who is signed in right now", instead of
// each screen re-fetching independently. This is the REAL backend session —
// unrelated to the old mock src/auth/AuthContext.tsx (localStorage-only,
// no server involved), which nothing in the live app should use anymore.
export function useSession() {
  const api = getApiClient();
  const [user, setUser] = useState<BackendUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await api.auth.me();
      setUser(result);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(() => {
    api.auth.logout();
    setUser(null);
  }, [api]);

  return { user, isLoading, refresh, logout };
}
