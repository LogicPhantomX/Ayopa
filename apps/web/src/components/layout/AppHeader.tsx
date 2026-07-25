/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Bell, ShoppingBag, Store, Scale, Download, LogOut } from "lucide-react";
import { AuthUser, NetworkState, AppNotification } from "../../types";

export type WorkspaceKey = "buyer" | "seller" | "admin" | "pwa";

interface NavTabProps {
  id: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function NavTab({ id, active, onClick, icon, label }: NavTabProps) {
  return (
    <button
      id={id}
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
        active ? "bg-[#D4A017] text-black font-bold" : "text-zinc-400 hover:text-zinc-200"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

interface AppHeaderProps {
  user: AuthUser;
  network: NetworkState;
  workspace: WorkspaceKey;
  onWorkspaceChange: (workspace: WorkspaceKey) => void;
  notifications: AppNotification[];
  onOpenNotifications: () => void;
  onLogout: () => void;
}

export default function AppHeader({
  user,
  network,
  workspace,
  onWorkspaceChange,
  notifications,
  onOpenNotifications,
  onLogout,
}: AppHeaderProps) {
  return (
    <header className="bg-zinc-950 border-b border-zinc-900 py-4 px-4 sm:px-6 md:px-10 sticky top-[42px] z-40 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo Brand with dynamic offline dot */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-[#D4A017] flex items-center justify-center font-serif font-black text-black text-lg shadow-md border border-[#D4A017]/40">
            A
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-serif font-bold text-base sm:text-xl text-white tracking-[4px] uppercase">AYOPÁ</span>
              <span className={`w-1.5 h-1.5 rounded-full ${network === "Offline" ? "bg-rose-500" : "bg-[#D4A017]"}`} />
            </div>
            <p className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase">TRUST & COMMERCE ECOSYSTEM</p>
          </div>
        </div>

        {/* Tab Selection Switchers — scoped to the signed-in account's role */}
        <nav className="flex items-center bg-zinc-900/50 border border-zinc-850 p-1.5 rounded-xl gap-1">
          {user.role === "buyer" && (
            <NavTab
              id="tab-buyer"
              active={workspace === "buyer"}
              onClick={() => onWorkspaceChange("buyer")}
              icon={<ShoppingBag className="w-3.5 h-3.5" />}
              label="Buyer Hub"
            />
          )}
          {user.role === "seller" && (
            <NavTab
              id="tab-seller"
              active={workspace === "seller"}
              onClick={() => onWorkspaceChange("seller")}
              icon={<Store className="w-3.5 h-3.5" />}
              label="Seller Office"
            />
          )}
          {user.role === "admin" && (
            <NavTab
              id="tab-admin"
              active={workspace === "admin"}
              onClick={() => onWorkspaceChange("admin")}
              icon={<Scale className="w-3.5 h-3.5" />}
              label="Compliance Admin"
            />
          )}
          <NavTab
            id="tab-pwa"
            active={workspace === "pwa"}
            onClick={() => onWorkspaceChange("pwa")}
            icon={<Download className="w-3.5 h-3.5" />}
            label="PWA & Offline"
          />
        </nav>

        {/* Balance & Notification Block */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <div className="text-[9px] uppercase opacity-40 tracking-wider text-zinc-300">Balance</div>
            <div className="font-serif font-bold italic text-sm text-[#D4A017]">₦14,280,000.00</div>
          </div>

          {/* Notification Button */}
          <button
            id="btn-notifications"
            onClick={onOpenNotifications}
            className="p-2 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/80 rounded-lg relative transition-all cursor-pointer text-zinc-400 hover:text-zinc-200"
          >
            <Bell className="w-4 h-4" />
            {notifications.some((n) => !n.read) && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#D4A017] animate-pulse" />
            )}
          </button>

          {/* Signed-in account + logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
            <div className="text-right hidden md:block">
              <div className="text-[11px] font-semibold text-zinc-200 leading-tight">{user.fullName}</div>
              <div className="text-[9px] text-zinc-500 uppercase font-mono tracking-wide leading-tight">{user.role}</div>
            </div>
            <button
              id="btn-logout"
              onClick={onLogout}
              title="Sign out"
              className="p-2 bg-zinc-900/60 hover:bg-rose-950/30 border border-zinc-800/80 hover:border-rose-900/40 rounded-lg transition-all cursor-pointer text-zinc-400 hover:text-rose-400"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
