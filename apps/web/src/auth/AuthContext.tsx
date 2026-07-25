/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { AuthUser } from "../types";
import * as authStore from "./authStore";

interface AuthContextValue {
  user: AuthUser | null;
  isInitializing: boolean;
  isSubmitting: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: authStore.RegisterInput) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Small artificial delay so loading states are visible & feel like real network calls,
// matching the "every action needs a loading state" requirement.
const FAKE_LATENCY_MS = 500;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUser(authStore.getSessionUser());
    setIsInitializing(false);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(async (email: string, password: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, FAKE_LATENCY_MS));
      const loggedInUser = authStore.login({ email, password });
      setUser(loggedInUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const register = useCallback(async (input: authStore.RegisterInput) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, FAKE_LATENCY_MS));
      const newUser = authStore.register(input);
      setUser(newUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account.");
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const logout = useCallback(() => {
    authStore.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isInitializing, isSubmitting, error, login, register, logout, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
