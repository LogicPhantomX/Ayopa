/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { NetworkState } from "../../types";
import { Wifi, WifiOff, RefreshCw, SignalLow, Circle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NetworkControlProps {
  currentNetwork: NetworkState;
  onNetworkChange: (state: NetworkState) => void;
  syncQueueLength: number;
  onSyncNow: () => void;
}

export default function NetworkControl({
  currentNetwork,
  onNetworkChange,
  syncQueueLength,
  onSyncNow,
}: NetworkControlProps) {
  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      onSyncNow();
    }, 1500);
  };

  return (
    <div className="bg-zinc-900 border-b border-zinc-800 text-zinc-300 py-2.5 px-4 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Core Identity & Dynamic Local Time */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono tracking-wider text-emerald-400 font-bold uppercase text-[10px]">AYOPÁ SYSTEM</span>
          </div>
          <div className="h-4 w-px bg-zinc-800 hidden sm:block" />
          <span className="text-zinc-400 font-mono hidden md:inline">
            SECURE LEDGER V2.4 • EST 17:42 UTC
          </span>
        </div>

        {/* Network Quality Controls */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center">
          <span className="text-zinc-500 font-mono text-[11px] mr-1">Simulate Connection:</span>
          
          <button
            id="net-btn-high"
            onClick={() => onNetworkChange("High-Speed")}
            className={`px-2.5 py-1 rounded font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              currentNetwork === "High-Speed"
                ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                : "bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 border border-transparent"
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>High-Speed 4G/5G</span>
          </button>

          <button
            id="net-btn-low"
            onClick={() => onNetworkChange("Low-Speed")}
            className={`px-2.5 py-1 rounded font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              currentNetwork === "Low-Speed"
                ? "bg-amber-950 text-amber-400 border border-amber-800"
                : "bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 border border-transparent"
            }`}
          >
            <SignalLow className="w-3.5 h-3.5" />
            <span>Low-Speed 2G (Skeletons)</span>
          </button>

          <button
            id="net-btn-offline"
            onClick={() => onNetworkChange("Offline")}
            className={`px-2.5 py-1 rounded font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              currentNetwork === "Offline"
                ? "bg-rose-950 text-rose-400 border border-rose-800"
                : "bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 border border-transparent"
            }`}
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span>Offline-First</span>
          </button>
        </div>

        {/* Sync Queue status */}
        <AnimatePresence mode="popLayout">
          {currentNetwork === "Offline" ? (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-2 bg-zinc-800/80 px-2.5 py-1 rounded text-zinc-400 border border-zinc-700/50"
            >
              <Circle className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
              <span className="font-mono text-[10px]">
                {syncQueueLength} local actions cached
              </span>
            </motion.div>
          ) : (
            syncQueueLength > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-2 bg-amber-950/40 px-2.5 py-1 rounded text-amber-300 border border-amber-800/40"
              >
                <span className="font-mono text-[10px]">{syncQueueLength} Action Queue Pending</span>
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold uppercase text-[9px] cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
                  {isSyncing ? "Syncing..." : "Sync Now"}
                </button>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
