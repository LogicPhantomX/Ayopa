/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { WifiOff } from "lucide-react";

export default function OfflineBanner() {
  return (
    <div className="bg-rose-950/20 border-b border-rose-900/40 text-rose-400 text-center py-2 text-[11px] font-mono flex items-center justify-center gap-2">
      <WifiOff className="w-4 h-4 text-rose-400 animate-pulse" />
      <span>LOCAL SECURED MODE: All listing additions or escrow creations will be queued in memory until synchronized.</span>
    </div>
  );
}
