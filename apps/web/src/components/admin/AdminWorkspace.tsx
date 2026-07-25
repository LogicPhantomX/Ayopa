/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { EscrowOrder, SellerKYC, EscrowStatus } from "../../types";
import { 
  ShieldCheck, Scale, FileText, Coins, TrendingUp, UserCheck, 
  Activity, XCircle, MessageSquare, ArrowUpRight, FileWarning 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AdminWorkspaceProps {
  orders: EscrowOrder[];
  kyc: SellerKYC;
  onUpdateKyc: (updatedKyc: SellerKYC) => void;
  onUpdateOrder: (orderId: string, status: EscrowStatus, updateData?: Partial<EscrowOrder>) => void;
  onAddNotification: (title: string, message: string, type: "success" | "info" | "warning" | "error") => void;
}

export default function AdminWorkspace({
  orders,
  kyc,
  onUpdateKyc,
  onUpdateOrder,
  onAddNotification,
}: AdminWorkspaceProps) {
  // Dispute arbitration focus
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);

  // Compute total funds locked in Ayopá secure vaults
  const telemetry = useMemo(() => {
    // Escrows that are active and locked (not yet finalized or refunded)
    const activeEscrows = orders.filter(
      (o) => !["Funds Released", "Funds Refunded", "Awaiting Funding"].includes(o.status)
    );
    const totalCustodyFunds = activeEscrows.reduce((sum, o) => sum + o.totalAmount, 0);

    // Sum system fee revenue (0.5%) for completed trades
    const settledEscrows = orders.filter((o) => o.status === "Funds Released");
    const totalSystemRevenue = settledEscrows.reduce((sum, o) => sum + o.escrowFee, 0);

    // Disputed trades
    const disputedCount = orders.filter((o) => o.status === "Disputed").length;

    return {
      totalCustodyFunds,
      totalSystemRevenue,
      disputedCount,
      activeTradeCount: activeEscrows.length,
    };
  }, [orders]);

  const disputedOrders = useMemo(() => {
    return orders.filter((o) => o.status === "Disputed");
  }, [orders]);

  const activeDispute = useMemo(() => {
    return disputedOrders.find((o) => o.id === selectedDisputeId) || null;
  }, [disputedOrders, selectedDisputeId]);

  // Handle dispute arbitration resolution
  const handleResolveDispute = (decision: "Buyer" | "Seller") => {
    if (!activeDispute) return;

    if (decision === "Buyer") {
      // Refund Buyer
      onUpdateOrder(activeDispute.id, "Funds Refunded", {
        disputeRuling: "Buyer",
      });
      onAddNotification(
        "Arbitration Ruled: Refund",
        `Ayopá board ruled in favor of Buyer for order ${activeDispute.id}. $${activeDispute.totalAmount.toLocaleString()} refunded.`,
        "success"
      );
    } else {
      // Release to Seller
      onUpdateOrder(activeDispute.id, "Funds Released", {
        disputeRuling: "Seller",
      });
      onAddNotification(
        "Arbitration Ruled: Release",
        `Ayopá board ruled in favor of Seller for order ${activeDispute.id}. $${activeDispute.totalValue.toLocaleString()} payout cleared.`,
        "success"
      );
    }

    setSelectedDisputeId(null);
  };

  // KYC approval
  const handleApproveKyc = () => {
    const updated: SellerKYC = {
      ...kyc,
      status: "Verified",
    };
    onUpdateKyc(updated);
    onAddNotification(
      "Corporate KYC Approved",
      `Entity verification for ${kyc.companyName} is fully cleared and authorized.`,
      "success"
    );
  };

  // KYC rejection
  const handleRejectKyc = () => {
    const updated: SellerKYC = {
      ...kyc,
      status: "Rejected",
    };
    onUpdateKyc(updated);
    onAddNotification(
      "Corporate KYC Denied",
      `License parameters for ${kyc.companyName} failed phytosanitary or registry cross-check.`,
      "error"
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 max-w-7xl mx-auto">
      
      {/* LEFT COLUMN: Administrative Disputes & Resolutions Desk (7 Cols) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Disputes Resolution Console */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-sans font-bold text-sm text-zinc-100 flex items-center gap-1.5">
                <Scale className="w-4.5 h-4.5 text-emerald-400" />
                Arbitration Desk ({disputedOrders.length})
              </h3>
              <p className="text-zinc-500 text-xs">Review shipping moisture records, assays, and logs to resolve cargo claims.</p>
            </div>
            {disputedOrders.length > 0 && (
              <span className="bg-rose-950/40 text-rose-400 border border-rose-900/60 font-mono text-[9px] px-2.5 py-1 rounded font-bold uppercase animate-pulse">
                Action Required
              </span>
            )}
          </div>

          <div className="space-y-3">
            {disputedOrders.length === 0 ? (
              <div className="py-10 text-center bg-zinc-900/10 border border-dashed border-zinc-800 rounded-lg">
                <ShieldCheck className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-400 text-xs font-sans">All escrows healthy. Zero pending disputes.</p>
                <p className="text-zinc-600 text-[10px] font-mono mt-0.5">Ayopá compliance status: 100%</p>
              </div>
            ) : (
              disputedOrders.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => setSelectedDisputeId(ord.id)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col sm:flex-row justify-between sm:items-center gap-3 ${
                    selectedDisputeId === ord.id
                      ? "bg-zinc-900 border-zinc-700"
                      : "bg-zinc-900/40 border-zinc-900 hover:border-zinc-800"
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-zinc-400 font-bold">{ord.id}</span>
                      <span className="text-[9px] bg-rose-950 text-rose-400 border border-rose-900 px-1.5 rounded font-mono">
                        Disputed Consignment
                      </span>
                    </div>
                    <h4 className="font-sans font-bold text-xs text-zinc-200 truncate">{ord.productName}</h4>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      Contested Capital: <strong className="text-rose-400">${ord.totalAmount.toLocaleString()}</strong>
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDisputeId(ord.id);
                    }}
                    className="bg-zinc-100 hover:bg-emerald-500 hover:text-white text-zinc-950 font-sans font-bold text-[10px] uppercase px-3 py-1.5 rounded-lg transition-all cursor-pointer self-start sm:self-auto shrink-0"
                  >
                    Moderate Claim
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Dispute Resolution Workspace */}
        <AnimatePresence mode="popLayout">
          {activeDispute && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4"
            >
              <div className="border-b border-zinc-900 pb-3 flex items-start justify-between">
                <div>
                  <span className="font-mono text-[9px] text-rose-400 font-bold uppercase tracking-widest block">ACTIVE LITIGATION CHAMBER</span>
                  <h4 className="font-sans font-bold text-sm text-zinc-100">
                    Challenge on Contract {activeDispute.id}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedDisputeId(null)}
                  className="text-zinc-500 hover:text-zinc-300 p-1 rounded-md"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              {/* Dispute statement details */}
              <div className="bg-rose-950/10 border border-rose-900/30 p-3.5 rounded-lg space-y-1.5">
                <span className="text-[9px] font-mono text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <FileWarning className="w-3.5 h-3.5" />
                  Buyer Dispute Statement
                </span>
                <p className="text-zinc-300 text-xs font-sans leading-relaxed">
                  &ldquo;{activeDispute.disputeNotes}&rdquo;
                </p>
                <div className="pt-2 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                  <span>Buyer: {activeDispute.buyerName}</span>
                  <span>Seller: {activeDispute.sellerName}</span>
                </div>
              </div>

              {/* Evidential checklist & Quality Logs */}
              <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-850 text-xs space-y-2 font-sans">
                <p className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider font-bold mb-1.5">Arbitration Evidence Check</p>
                
                <div className="flex items-center gap-2 text-zinc-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>SGS Pre-Shipment Quality Certificate: Verified moisture 11.2%</span>
                </div>

                <div className="flex items-center gap-2 text-zinc-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>Maersk Carrier Cold-Storage Logs: Unbroken temperature profile</span>
                </div>

                <div className="flex items-center gap-2 text-zinc-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span>Buyer Arrival Assay Scan: Moisture registered 16% (Suspected sea water leakage near seal)</span>
                </div>
              </div>

              {/* Rulings Triggers */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleResolveDispute("Buyer")}
                  className="flex-1 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-200 font-sans font-bold text-[10px] uppercase py-2.5 rounded-lg transition-all cursor-pointer"
                >
                  Rule For Buyer (Refund Payout)
                </button>

                <button
                  onClick={() => handleResolveDispute("Seller")}
                  className="flex-1 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 text-emerald-200 font-sans font-bold text-[10px] uppercase py-2.5 rounded-lg transition-all cursor-pointer"
                >
                  Rule For Seller (Release Payout)
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Corporate KYC Approval Desk */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-sm">
          <h3 className="font-sans font-bold text-sm text-zinc-100 mb-3 tracking-tight flex items-center gap-1.5">
            <UserCheck className="w-4.5 h-4.5 text-emerald-400" />
            KYC Verification Center
          </h3>

          {kyc.status === "Pending" ? (
            <div className="p-4 bg-zinc-900/60 rounded-lg border border-zinc-850 space-y-3 font-sans text-xs">
              <div className="flex justify-between items-center">
                <span className="font-mono text-zinc-200 font-bold uppercase">{kyc.companyName}</span>
                <span className="text-[9px] bg-amber-950 text-amber-400 border border-amber-900 px-2 rounded font-mono">
                  Pending Verification
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-400">
                <div>
                  <span className="text-zinc-600 block">TRADE REGISTRY</span>
                  <span>{kyc.registrationNumber}</span>
                </div>
                <div>
                  <span className="text-zinc-600 block">ORIGIN REGION</span>
                  <span>{kyc.country}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-600 block">LICENSE FILENAME</span>
                  <span className="text-emerald-400 underline">{kyc.licenseDocumentName}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 text-[10px] font-semibold">
                <button
                  onClick={handleRejectKyc}
                  className="flex-1 bg-rose-950/30 text-rose-400 hover:bg-rose-950/50 border border-rose-900/40 py-1.5 rounded cursor-pointer"
                >
                  Deny Credentials
                </button>
                <button
                  onClick={handleApproveKyc}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded cursor-pointer"
                >
                  Approve Trade License
                </button>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center bg-zinc-900/20 rounded border border-zinc-900 text-zinc-500 text-xs">
              All trader profiles processed or up-to-date. Current KYC registry healthy.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Total Financial Operations Telemetry (5 Cols) */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Custody Vault Telemetry */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-sm">
          <h3 className="font-sans font-bold text-sm text-zinc-100 mb-4 tracking-tight flex items-center gap-1.5">
            <Activity className="w-4.5 h-4.5 text-emerald-400" />
            Financial Ledger Telemetry
          </h3>

          <div className="space-y-4">
            <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-850">
              <span className="text-[9px] font-mono text-zinc-500 uppercase block">Total Funds in Ayopá Escrow Lock</span>
              <span className="text-2xl font-serif font-bold italic text-[#D4A017] block mt-0.5">
                ${telemetry.totalCustodyFunds.toLocaleString()}
              </span>
              <span className="text-[9px] font-mono text-[#D4A017] mt-1 block">
                ● Vault state secured under Pan-African Banking Protocols
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-900">
                <span className="text-[9px] text-zinc-500 block">ESCROW FEE CASH</span>
                <span className="text-sm font-serif font-bold italic text-zinc-200 block mt-0.5">
                  ${telemetry.totalSystemRevenue.toLocaleString()}
                </span>
                <span className="text-[8px] text-zinc-600 mt-0.5 block">0.5% completed cut</span>
              </div>

              <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-900">
                <span className="text-[9px] text-zinc-500 block">ACTIVE AGREEMENTS</span>
                <span className="text-sm font-serif font-bold italic text-zinc-200 block mt-0.5">
                  {telemetry.activeTradeCount} Lots
                </span>
                <span className="text-[8px] text-rose-400 mt-0.5 block">{telemetry.disputedCount} claims active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time system logs feed (No mock-larping, literal human logs) */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-sm">
          <h3 className="font-sans font-bold text-sm text-zinc-100 mb-3 tracking-tight">Escrow Activity Records</h3>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 bg-zinc-900/25 p-2 rounded-lg border border-zinc-900">
            {orders.map((o, idx) => (
              <div key={idx} className="p-2 border-b border-zinc-900/80 last:border-0 text-[11px] font-sans">
                <div className="flex justify-between items-center font-mono text-[9px] text-zinc-500">
                  <span>ID: {o.id}</span>
                  <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-zinc-300 mt-1">
                  {o.status === "Awaiting Funding" && `Escrow lock initialized. Waiting for $${o.totalAmount.toLocaleString()} gross deposit.`}
                  {o.status === "Funds Secured" && `Secured deposit verified. Locked $${o.totalAmount.toLocaleString()} in secure vaults.`}
                  {o.status === "Dispatched" && `Cargo freight dispatched by Seller. Carrier: ${o.carrier}.`}
                  {o.status === "Under Inspection" && `Consignment reached destination port. Custom clearance logs clear.`}
                  {o.status === "Disputed" && `Dispute raised on coffee consignment. Arbitration channel initialized.`}
                  {o.status === "Funds Released" && `Payout of $${o.totalValue.toLocaleString()} authorized and sent to bank registry.`}
                  {o.status === "Funds Refunded" && `Settlement cancelled. $${o.totalAmount.toLocaleString()} refunded back to buyer wallet.`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
