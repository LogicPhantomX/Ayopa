/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Smartphone, Download, HardDrive, Sparkles, ShieldAlert } from "lucide-react";

interface PwaConsoleProps {
  syncQueueLength: number;
  onInstallClick: () => void;
}

export default function PwaConsole({ syncQueueLength, onInstallClick }: PwaConsoleProps) {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* PWA Portal header */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-zinc-900 border border-zinc-800 text-emerald-400 rounded-xl">
              <Smartphone className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="font-sans font-bold text-lg text-zinc-100 tracking-tight">PWA & Offline Engineering Console</h2>
              <p className="text-zinc-500 text-xs">Ayopá operates seamlessly in remote ports, silos, and rural areas with offline synchronization.</p>
            </div>
          </div>
          <button
            onClick={onInstallClick}
            className="bg-zinc-100 hover:bg-emerald-500 hover:text-white text-zinc-950 font-sans font-extrabold text-xs px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Install App
          </button>
        </div>

        {/* Grid stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-zinc-900/60 p-4 rounded-lg border border-zinc-850 space-y-1">
            <span className="text-[9px] font-mono text-zinc-500 uppercase block font-bold">Local Storage Registry</span>
            <span className="text-base font-sans font-extrabold text-zinc-200 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              100% Caching Active
            </span>
            <p className="text-zinc-500 text-[10px]">IndexedDB configured for rapid offline reads.</p>
          </div>

          <div className="bg-zinc-900/60 p-4 rounded-lg border border-zinc-850 space-y-1">
            <span className="text-[9px] font-mono text-zinc-500 uppercase block font-bold">Unsynchronized Queues</span>
            <span className="text-base font-sans font-extrabold text-zinc-200">
              {syncQueueLength} Local Transactions
            </span>
            <p className="text-zinc-500 text-[10px]">Cached in secure browser transaction queue.</p>
          </div>

          <div className="bg-zinc-900/60 p-4 rounded-lg border border-zinc-850 space-y-1">
            <span className="text-[9px] font-mono text-zinc-500 uppercase block font-bold">Offline Resilience Rating</span>
            <span className="text-base font-sans font-extrabold text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Military Grade
            </span>
            <p className="text-zinc-500 text-[10px]">Secure payload hashing blocks duplicate submissions.</p>
          </div>
        </div>
      </div>

      {/* Informative Dry-Dock User Experience guide */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h3 className="font-sans font-bold text-sm text-zinc-100 flex items-center gap-1.5">
          <ShieldAlert className="w-4.5 h-4.5 text-amber-500" />
          How Ayopá Guarantees Trust Offline
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans text-zinc-400 leading-relaxed">
          <div className="p-4 bg-zinc-900/30 rounded border border-zinc-900">
            <strong className="text-zinc-200 block mb-1">1. Zero-Loss Caching</strong>
            All state actions (escrow registrations, chat logs, listings) are captured locally and synced securely immediately upon connection restoration.
          </div>
          <div className="p-4 bg-zinc-900/30 rounded border border-zinc-900">
            <strong className="text-zinc-200 block mb-1">2. Cryptographic Security</strong>
            Every transaction contains custom device-hashed signatures to authenticate identity without needing to contact external servers first.
          </div>
          <div className="p-4 bg-zinc-900/30 rounded border border-zinc-900">
            <strong className="text-zinc-200 block mb-1">3. Ultra Low-Bandwidth Optimizations</strong>
            Our payload structures are compressed, ensuring heavy trade documents can synchronise beautifully even over patchy 2G/Edge systems.
          </div>
          <div className="p-4 bg-zinc-900/30 rounded border border-zinc-900">
            <strong className="text-zinc-200 block mb-1">4. Automatic Conflict Resolution</strong>
            If listings are edited concurrently by offline coordinators, our trust protocol prioritizes validated signatures from SGS or phytosanitary credentials.
          </div>
        </div>
      </div>
    </div>
  );
}
