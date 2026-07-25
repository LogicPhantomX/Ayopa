/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AppNotification } from "../../types";
import { X, CheckCheck, Bell, ShieldAlert, CircleCheck, Info, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
}

export default function NotificationModal({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onMarkRead,
}: NotificationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 md:p-10 pointer-events-none">
      {/* Background overlay */}
      <div className="fixed inset-0 bg-black/60 pointer-events-auto" onClick={onClose} />

      {/* Drawer panel */}
      <motion.div
        initial={{ opacity: 0, x: 100, scale: 0.98 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 100, scale: 0.98 }}
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[85vh] relative z-10"
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-400" />
            <h3 className="font-sans font-bold text-zinc-100 text-sm tracking-tight">Trade Signal Ledger</h3>
            {notifications.some(n => !n.read) && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </div>
          <div className="flex items-center gap-3">
            {notifications.length > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark All Read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-900 p-2">
          {notifications.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <Sparkles className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-400 text-xs font-sans">No new trade signals available</p>
              <p className="text-zinc-600 text-[10px] font-mono mt-1">Everything is up-to-date</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => onMarkRead(notif.id)}
                className={`p-3.5 hover:bg-zinc-900/60 transition-all flex gap-3 cursor-pointer rounded-lg mb-1 ${
                  notif.read ? "opacity-75" : "bg-emerald-950/10 border-l-2 border-emerald-500"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {notif.type === "success" && <CircleCheck className="w-4 h-4 text-emerald-500" />}
                  {notif.type === "warning" && <ShieldAlert className="w-4 h-4 text-amber-500" />}
                  {notif.type === "info" && <Info className="w-4 h-4 text-blue-500" />}
                  {notif.type === "error" && <ShieldAlert className="w-4 h-4 text-rose-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className={`font-sans font-semibold text-xs truncate ${notif.read ? "text-zinc-300" : "text-white"}`}>
                      {notif.title}
                    </p>
                    <span className="font-mono text-[9px] text-zinc-500 shrink-0">{notif.timestamp}</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800 text-center bg-zinc-900/30 text-[10px] text-zinc-500 font-mono">
          Ayopá Security Shield (Encrypted Sandbox)
        </div>
      </motion.div>
    </div>
  );
}
