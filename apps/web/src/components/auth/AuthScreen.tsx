/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ShoppingBag, Store, Scale, Loader2, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { UserRole } from "../../types";
import { DEMO_CREDENTIALS } from "../../auth/authStore";

const ROLE_META: Record<UserRole, { label: string; icon: React.ReactNode; blurb: string }> = {
  buyer: {
    label: "Buyer",
    icon: <ShoppingBag className="w-4 h-4" />,
    blurb: "Source verified commodities and trade through secure escrow.",
  },
  seller: {
    label: "Seller",
    icon: <Store className="w-4 h-4" />,
    blurb: "List commodities, manage KYC, and fulfil escrow-backed orders.",
  },
  admin: {
    label: "Compliance Admin",
    icon: <Scale className="w-4 h-4" />,
    blurb: "Moderate disputes, verify sellers, and oversee the ledger.",
  },
};

export default function AuthScreen() {
  const { login, register, isSubmitting, error, clearError } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<UserRole>("buyer");
  const [showPassword, setShowPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register({ fullName, email, password, role, companyName, country });
      }
    } catch {
      // error state is surfaced via context; nothing further to do here
    }
  };

  const fillDemoCredentials = (demoRole: UserRole) => {
    clearError();
    setMode("login");
    setRole(demoRole);
    setEmail(DEMO_CREDENTIALS[demoRole].email);
    setPassword(DEMO_CREDENTIALS[demoRole].password);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center p-4 sm:p-6 font-sans antialiased">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded bg-[#D4A017] flex items-center justify-center font-serif font-black text-black text-2xl shadow-md border border-[#D4A017]/40 mb-3">
            A
          </div>
          <span className="font-serif font-bold text-2xl text-white tracking-[4px] uppercase">AYOPÁ</span>
          <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase mt-1">
            Trust &amp; Commerce Ecosystem
          </p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          {/* Mode switch */}
          <div className="flex bg-zinc-900/50 border border-zinc-850 p-1 rounded-xl mb-6">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  clearError();
                  setMode(m);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mode === m ? "bg-[#D4A017] text-black font-bold" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {/* Role selector */}
          <div className="mb-5">
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold block mb-2">
              I am a
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(ROLE_META) as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex flex-col items-center gap-1.5 py-2.5 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer ${
                    role === r
                      ? "bg-[#D4A017]/10 border-[#D4A017] text-[#D4A017]"
                      : "bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {ROLE_META[r].icon}
                  {ROLE_META[r].label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">{ROLE_META[role].blurb}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "register" && (
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold block mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Amaka Obi"
                  className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#D4A017]/60 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold block mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#D4A017]/60 transition-colors"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold block mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={mode === "register" ? 8 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "At least 8 characters" : "••••••••"}
                  className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2.5 pr-10 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#D4A017]/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold block mb-1.5">
                    Company {role === "buyer" ? "(optional)" : ""}
                  </label>
                  <input
                    type="text"
                    required={role !== "buyer"}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Company name"
                    className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#D4A017]/60 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold block mb-1.5">
                    Country
                  </label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. Nigeria"
                    className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#D4A017]/60 transition-colors"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 bg-rose-950/20 border border-rose-900/40 text-rose-400 text-xs rounded-lg px-3 py-2.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#D4A017] hover:bg-[#E2B63E] disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold text-xs uppercase tracking-wide py-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting
                ? mode === "login"
                  ? "Signing In..."
                  : "Creating Account..."
                : mode === "login"
                ? "Sign In"
                : "Create Account"}
            </button>
          </form>

          {/* Demo credentials shortcut, since there is no backend yet */}
          <div className="mt-6 pt-5 border-t border-zinc-900">
            <p className="text-[9px] font-mono uppercase tracking-wider text-zinc-600 font-bold mb-2 text-center">
              Try a demo account
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(ROLE_META) as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => fillDemoCredentials(r)}
                  className="text-[10px] font-semibold text-zinc-400 hover:text-[#D4A017] bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800 rounded-lg py-2 transition-all cursor-pointer"
                >
                  {ROLE_META[r].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
