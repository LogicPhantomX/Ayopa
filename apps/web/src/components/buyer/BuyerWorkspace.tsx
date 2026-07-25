/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { CommodityProduct, EscrowOrder, ChatMessage, EscrowStatus } from "../../types";
import { 
  Search, FileCheck, Truck, Scale, MessageSquare, X, ChevronRight, Info, 
  Coins, ShieldCheck, AlertTriangle, Anchor, Navigation, MapPin, Send, Star, ArrowUpRight 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import DisputeModal from "../shared/DisputeModal";

interface BuyerWorkspaceProps {
  products: CommodityProduct[];
  orders: EscrowOrder[];
  chats: ChatMessage[];
  isLoading: boolean;
  onNewOrder: (order: EscrowOrder) => void;
  onUpdateOrder: (orderId: string, status: EscrowStatus, updateData?: Partial<EscrowOrder>) => void;
  onSendMessage: (orderId: string, sender: "Buyer" | "Seller" | "Ayopá Mediator", text: string) => void;
  onAddNotification: (title: string, message: string, type: "success" | "info" | "warning" | "error") => void;
}

export default function BuyerWorkspace({
  products,
  orders,
  chats,
  isLoading,
  onNewOrder,
  onUpdateOrder,
  onSendMessage,
  onAddNotification,
}: BuyerWorkspaceProps) {
  // Search & Category Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Escrow checkout modal state
  const [selectedProductForEscrow, setSelectedProductForEscrow] = useState<CommodityProduct | null>(null);
  const [escrowQuantity, setEscrowQuantity] = useState<number>(0);
  const [shippingDestination, setShippingDestination] = useState("");

  // Selected Order Detail sidebar/sheet
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Send message text
  const [messageText, setMessageText] = useState("");

  // Dispute modal state (replaces window.prompt)
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            product.origin.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const activeBuyerOrders = useMemo(() => {
    // For local simulation, we are "Buyer" buying products
    return orders;
  }, [orders]);

  const selectedOrder = useMemo(() => {
    return orders.find(o => o.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  const currentOrderChats = useMemo(() => {
    if (!selectedOrderId) return [];
    return chats.filter(c => c.orderId === selectedOrderId);
  }, [chats, selectedOrderId]);

  // Handle opening Escrow Modal
  const openEscrowModal = (prod: CommodityProduct) => {
    setSelectedProductForEscrow(prod);
    setEscrowQuantity(prod.minOrderQuantity);
    setShippingDestination("");
  };

  // Submit new escrow order
  const handleInitiateEscrow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForEscrow || escrowQuantity < selectedProductForEscrow.minOrderQuantity) return;

    const totalValue = escrowQuantity * selectedProductForEscrow.pricePerTon;
    const escrowFee = totalValue * 0.005; // 0.5%
    const logisticsFee = totalValue * 0.04; // Simulated 4% transport
    const totalAmount = totalValue + escrowFee + logisticsFee;

    const newOrder: EscrowOrder = {
      id: `esc-${Math.floor(100 + Math.random() * 900)}`,
      productId: selectedProductForEscrow.id,
      productName: selectedProductForEscrow.name,
      buyerName: "Chocolates d'Europe (Zürich)", // Simulated Buyer profile
      sellerName: selectedProductForEscrow.sellerName,
      quantity: escrowQuantity,
      unitPrice: selectedProductForEscrow.pricePerTon,
      totalValue,
      escrowFee,
      logisticsFee,
      totalAmount,
      status: "Awaiting Funding",
      origin: selectedProductForEscrow.origin,
      destination: shippingDestination || "Port of Durban (South Africa)",
      createdAt: new Date().toISOString()
    };

    onNewOrder(newOrder);
    onAddNotification(
      "Escrow Order Initialized",
      `Escrow Agreement created for ${escrowQuantity} Tons of ${selectedProductForEscrow.name}. Funding requested.`,
      "info"
    );
    setSelectedProductForEscrow(null);
  };

  // Fund Escrow Order
  const handleFundOrder = (order: EscrowOrder) => {
    onUpdateOrder(order.id, "Funds Secured");
    onAddNotification(
      "Escrow Fully Funded",
      `$${order.totalAmount.toLocaleString()} safely locked in Ayopá smart escrow wallet. Seller notified to ship.`,
      "success"
    );
  };

  // Chat Submission
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedOrderId) return;
    onSendMessage(selectedOrderId, "Buyer", messageText.trim());
    setMessageText("");

    // Simulate automatic polite response from Seller if online
    setTimeout(() => {
      onSendMessage(
        selectedOrderId,
        "Seller",
        "Understood. Our dispatch office is coordinating the transport logs. All parameters are locked."
      );
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 max-w-7xl mx-auto">
      
      {/* LEFT COLUMN: Commodities & Escrow Action Panel (7 Cols on large screen) */}
      <div className="lg:col-span-7 space-y-6">

        {/* Sophisticated Dark Display Header */}
        <header className="py-2">
          <div className="text-[11px] uppercase tracking-[3px] text-zinc-500 font-medium mb-1.5 font-mono">Intelligent Commerce Ecosystem</div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-zinc-100 leading-none">
            Africa's Premier <span className="italic text-[#D4A017] font-normal">Escrow</span> Marketplace
          </h1>
        </header>
        
        {/* Header and Search */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-sans font-bold text-lg text-zinc-100 tracking-tight">Pan-African Wholesale Commodities</h2>
              <p className="text-zinc-500 text-xs">Direct verified trade. Monitored escrows. Zero-commission matching.</p>
            </div>
            <span className="font-mono text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded-md self-start shrink-0">
              6 Verified Contracts Live
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                id="search-commodities"
                type="text"
                placeholder="Search cocoa, white maize, origin zone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900 text-zinc-200 pl-9 pr-4 py-2 text-xs rounded-lg border border-zinc-800 focus:outline-none focus:border-emerald-500 transition-all font-sans"
              />
            </div>
            
            <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {["All", "Agriculture", "Minerals", "Processed Goods"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-2 text-[11px] font-medium rounded-lg transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat 
                      ? "bg-zinc-100 text-zinc-900 font-semibold" 
                      : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Directory Listing Grid */}
        {isLoading ? (
          // Beautiful Skeleton Loader to address low-speed Android environments
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 space-y-3 animate-pulse">
                <div className="h-24 bg-zinc-900 rounded-lg" />
                <div className="h-4 bg-zinc-900 rounded w-2/3" />
                <div className="h-3 bg-zinc-900 rounded w-1/2" />
                <div className="flex gap-2">
                  <div className="h-5 bg-zinc-900 rounded w-1/4" />
                  <div className="h-5 bg-zinc-900 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl py-12 px-4 text-center">
            <Search className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm font-sans font-semibold">No commodities match your criteria</p>
            <p className="text-zinc-600 text-xs mt-1">Try resetting the search terms or categories</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((prod) => (
                <motion.div
                  key={prod.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-700 transition-all shadow-sm relative group"
                >
                  <div>
                    {/* Header: origin and rating */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-mono tracking-wider truncate max-w-[120px]">{prod.origin}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800/60 shrink-0">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="font-mono text-[9px] text-zinc-300 font-bold">{prod.sellerRating}</span>
                      </div>
                    </div>

                    {/* Product visual box */}
                    <div className={`h-28 rounded-lg mb-3 bg-gradient-to-br ${prod.imageColor} p-3 flex flex-col justify-between overflow-hidden relative border border-zinc-900/60`}>
                      <span className="font-mono text-[10px] bg-black/50 text-emerald-300 backdrop-blur-sm border border-emerald-950/40 px-2 py-0.5 rounded self-start font-bold uppercase tracking-widest">
                        {prod.grade}
                      </span>
                      <div className="relative z-10">
                        <h4 className="font-sans font-bold text-white text-sm tracking-tight leading-tight group-hover:text-emerald-300 transition-colors">
                          {prod.name}
                        </h4>
                        <span className="text-zinc-400 font-mono text-[10px]">Seller: {prod.sellerName}</span>
                      </div>
                      <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/80 pointer-events-none" />
                    </div>

                    {/* Product Details & Specs */}
                    <p className="text-zinc-400 text-[11px] leading-relaxed mb-3 line-clamp-2">
                      {prod.description}
                    </p>

                    {/* Certifications and Grade details */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      <span className="text-[9px] bg-emerald-950/30 text-emerald-400 border border-emerald-900/40 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                        <FileCheck className="w-2.5 h-2.5 shrink-0" />
                        {prod.certification}
                      </span>
                    </div>
                  </div>

                  {/* Pricing and Action */}
                  <div className="pt-3 border-t border-zinc-900 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-zinc-500 font-mono uppercase block">UNIT PRICE</span>
                      <span className="font-serif font-bold italic text-[#D4A017] text-base">
                        ${prod.pricePerTon.toLocaleString()}<span className="text-xs font-sans font-normal text-zinc-500"> / Ton</span>
                      </span>
                    </div>

                    <button
                      id={`order-btn-${prod.id}`}
                      onClick={() => openEscrowModal(prod)}
                      className="bg-[#D4A017] hover:bg-[#B58410] text-black font-sans font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <span>Buy Escrow</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Active Orders & Detail Panel (5 Cols on large screen) */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Active Trade Bookings list */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-sm">
          <h3 className="font-sans font-bold text-sm text-zinc-100 mb-3 tracking-tight flex items-center justify-between">
            <span>Your Active Escrows</span>
            <span className="text-[10px] font-mono text-zinc-500">BUYING BOOK</span>
          </h3>

          <div className="space-y-3.5">
            {activeBuyerOrders.length === 0 ? (
              <div className="py-8 text-center bg-zinc-900/20 border border-dashed border-zinc-800 rounded-lg">
                <Coins className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-500 text-xs">No transactions in custody yet</p>
                <p className="text-zinc-600 text-[10px] mt-0.5">Initialize an escrow transaction on the left directory</p>
              </div>
            ) : (
              activeBuyerOrders.map((ord) => {
                const statusColors: Record<EscrowStatus, string> = {
                  "Awaiting Funding": "bg-amber-950/50 text-amber-400 border-amber-800",
                  "Funds Secured": "bg-emerald-950/50 text-emerald-400 border-emerald-800",
                  "Dispatched": "bg-blue-950/50 text-blue-400 border-blue-800",
                  "Under Inspection": "bg-purple-950/50 text-purple-400 border-purple-800",
                  "Disputed": "bg-rose-950/50 text-rose-400 border-rose-800",
                  "Funds Released": "bg-zinc-800 text-zinc-400 border-zinc-700",
                  "Funds Refunded": "bg-stone-800 text-stone-400 border-stone-700",
                };

                return (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrderId(ord.id)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                      selectedOrderId === ord.id 
                        ? "bg-zinc-900 border-zinc-700" 
                        : "bg-zinc-900/40 border-zinc-900 hover:border-zinc-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-[10px] text-zinc-400 font-bold">{ord.id}</span>
                      <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded border ${statusColors[ord.status]}`}>
                        {ord.status}
                      </span>
                    </div>

                    <h4 className="font-sans font-bold text-zinc-100 text-xs truncate mb-1">
                      {ord.productName}
                    </h4>

                    <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-500 font-mono">
                      <span>{ord.quantity} MT @ ${ord.unitPrice}/MT</span>
                      <span className="text-zinc-300 font-bold">${ord.totalValue.toLocaleString()}</span>
                    </div>

                    {/* Prompt to Fund */}
                    {ord.status === "Awaiting Funding" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFundOrder(ord);
                        }}
                        className="mt-3 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-bold text-[10px] uppercase py-1.5 rounded transition-all cursor-pointer"
                      >
                        Secure Escrow Funds (${ord.totalAmount.toLocaleString()})
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Order Interaction / Escrow State & Chat */}
        {selectedOrder ? (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-widest block">SECURED TRANSACTION STATE</span>
                <h3 className="font-sans font-bold text-xs text-white truncate max-w-[220px]">
                  {selectedOrder.productName} ({selectedOrder.id})
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderId(null)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper progress representation */}
            <div className="p-4 border-b border-zinc-900 bg-zinc-950/80">
              <div className="relative flex justify-between items-center mb-4">
                {/* Connector Line */}
                <div className="absolute top-3.5 left-6 right-6 h-0.5 bg-zinc-800 -z-10" />
                
                {/* Active Connector Progress */}
                <div 
                  className="absolute top-3.5 left-6 h-0.5 bg-emerald-500 -z-10 transition-all duration-500" 
                  style={{
                    width: 
                      selectedOrder.status === "Awaiting Funding" ? "0%" :
                      selectedOrder.status === "Funds Secured" ? "33%" :
                      selectedOrder.status === "Dispatched" ? "66%" :
                      selectedOrder.status === "Under Inspection" ? "85%" :
                      selectedOrder.status === "Funds Released" ? "100%" : "100%"
                  }}
                />

                {/* State Node 1 */}
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                    selectedOrder.status !== "Awaiting Funding" 
                      ? "bg-emerald-500 text-black font-extrabold" 
                      : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                  }`}>
                    1
                  </div>
                  <span className="text-[8px] font-mono mt-1 text-zinc-500">Funded</span>
                </div>

                {/* State Node 2 */}
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                    ["Dispatched", "Under Inspection", "Funds Released", "Disputed"].includes(selectedOrder.status)
                      ? "bg-emerald-500 text-black font-extrabold" 
                      : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                  }`}>
                    2
                  </div>
                  <span className="text-[8px] font-mono mt-1 text-zinc-500">Transit</span>
                </div>

                {/* State Node 3 */}
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                    ["Under Inspection", "Funds Released", "Disputed"].includes(selectedOrder.status)
                      ? "bg-emerald-500 text-black font-extrabold" 
                      : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                  }`}>
                    3
                  </div>
                  <span className="text-[8px] font-mono mt-1 text-zinc-500">Inspection</span>
                </div>

                {/* State Node 4 */}
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                    ["Funds Released", "Funds Refunded"].includes(selectedOrder.status)
                      ? "bg-emerald-500 text-black font-extrabold" 
                      : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                  }`}>
                    4
                  </div>
                  <span className="text-[8px] font-mono mt-1 text-zinc-500">Payout</span>
                </div>
              </div>

              {/* Status explanation */}
              <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-semibold text-zinc-200 block mb-0.5">Status: {selectedOrder.status}</span>
                  {selectedOrder.status === "Awaiting Funding" && "Deposit the commodity purchase total into the secure Ayopá ledger to start trade fulfillment."}
                  {selectedOrder.status === "Funds Secured" && "Custody ledger verified. The seller has been instructed to load the freight cargo onto verified transit carriers."}
                  {selectedOrder.status === "Dispatched" && "Freight carrier has logged the transit cargo. Monitor real-time custom declaration tags below."}
                  {selectedOrder.status === "Under Inspection" && "The shipment arrived at the destination warehouse. Please run quality and volume checks before releasing final escrow payout."}
                  {selectedOrder.status === "Disputed" && "Arbitration process triggered. Ayopá mediator is active on the chat to inspect evidence."}
                  {selectedOrder.status === "Funds Released" && "Funds safely wired to seller account. Transaction finalized."}
                  {selectedOrder.status === "Funds Refunded" && "Consignment cancelled or ruled defective. Total value returned back to buyer wallet."}
                </div>
              </div>

              {/* Dynamic Interactive Buyer Decisions */}
              {selectedOrder.status === "Under Inspection" && (
                <div className="mt-3 flex gap-2.5">
                  <button
                    onClick={() => {
                      onUpdateOrder(selectedOrder.id, "Funds Released");
                      onAddNotification(
                        "Escrow Released Successfully",
                        `Payout for Cocoa consignment authorized. Seller credited.`,
                        "success"
                      );
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-semibold text-[10px] uppercase py-2 rounded transition-all cursor-pointer"
                  >
                    Authorize Payout
                  </button>

                  <button
                    onClick={() => setIsDisputeModalOpen(true)}
                    className="flex-1 bg-zinc-900 border border-rose-800/40 text-rose-400 hover:bg-rose-950/20 font-sans font-semibold text-[10px] uppercase py-2 rounded transition-all cursor-pointer"
                  >
                    Raise Dispute
                  </button>
                </div>
              )}
            </div>

            <DisputeModal
              isOpen={isDisputeModalOpen}
              onClose={() => setIsDisputeModalOpen(false)}
              onSubmit={(reason) => {
                onUpdateOrder(selectedOrder.id, "Disputed", {
                  disputeReason: "Quality Deviation Challenge",
                  disputeNotes: reason,
                });
                onAddNotification(
                  "Arbitration Dispute Raised",
                  `Dispute logged on ${selectedOrder.id}: "${reason}"`,
                  "warning"
                );
              }}
            />

            {/* Freight tracking metrics */}
            {selectedOrder.trackingNumber && (
              <div className="p-4 border-b border-zinc-900 text-[11px] space-y-2 bg-zinc-900/20 font-sans">
                <p className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Logistics & Freight Telemetry</p>
                <div className="grid grid-cols-2 gap-3 font-mono text-[10px]">
                  <div>
                    <span className="text-zinc-500 block">CARRIER</span>
                    <span className="text-zinc-300 font-semibold flex items-center gap-1">
                      <Anchor className="w-3.5 h-3.5 text-blue-400" />
                      {selectedOrder.carrier}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">TRACKING ID</span>
                    <span className="text-zinc-300 font-semibold flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                      {selectedOrder.trackingNumber}
                    </span>
                  </div>
                </div>
                <div className="mt-2 bg-zinc-900 p-2 rounded border border-zinc-800 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="text-zinc-400 font-mono text-[9px]">
                    Route: <strong className="text-zinc-300">{selectedOrder.origin}</strong> → <strong className="text-zinc-300">{selectedOrder.destination}</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Private trade ledger chat */}
            <div className="p-4 space-y-3.5">
              <p className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider font-bold flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                Verified Escrow Chat (Audit Log)
              </p>

              {/* Chat items list */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1 bg-zinc-900/30 p-2 rounded-lg border border-zinc-900">
                {currentOrderChats.map((c) => {
                  const isMe = c.sender === "Buyer";
                  const isMediator = c.sender === "Ayopá Mediator";
                  const isSystem = c.sender === "System";

                  if (isSystem) {
                    return (
                      <div key={c.id} className="text-center py-1.5 px-2 bg-zinc-900 border border-zinc-800 rounded font-mono text-[9px] text-zinc-500">
                        {c.text}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={c.id}
                      className={`flex flex-col max-w-[85%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}
                    >
                      <span className={`text-[9px] font-mono mb-0.5 ${
                        isMe ? "text-zinc-400" : isMediator ? "text-emerald-400 font-bold" : "text-amber-400"
                      }`}>
                        {c.sender} • {c.timestamp}
                      </span>
                      <div className={`p-2.5 rounded-lg text-xs font-sans ${
                        isMe 
                          ? "bg-emerald-600 text-white rounded-br-none" 
                          : isMediator
                          ? "bg-emerald-950 border border-emerald-800 text-emerald-100 rounded-bl-none"
                          : "bg-zinc-800 text-zinc-200 rounded-bl-none"
                      }`}>
                        {c.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input form */}
              <form onSubmit={handleSendChat} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type secure escrow message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-zinc-100 text-zinc-950 hover:bg-emerald-500 hover:text-white p-2 rounded-lg transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl py-12 px-4 text-center">
            <Info className="w-7 h-7 text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-500 text-xs font-sans">Select an active contract in your Buying Book to view status updates, real-time freight shipping steps, and audit logs.</p>
          </div>
        )}
      </div>

      {/* MODAL: Initialize Escrow Checkout Agreement */}
      <AnimatePresence>
        {selectedProductForEscrow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70"
              onClick={() => setSelectedProductForEscrow(null)}
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative z-10"
            >
              {/* Header */}
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-sans font-bold text-sm text-zinc-100">Setup Escrow Trade Lock</h3>
                </div>
                <button
                  onClick={() => setSelectedProductForEscrow(null)}
                  className="p-1 rounded text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleInitiateEscrow} className="p-5 space-y-4 font-sans text-xs">
                {/* Visual spec card */}
                <div className="bg-zinc-900/60 p-3.5 rounded-lg border border-zinc-800 flex gap-3.5">
                  <div className={`w-12 h-12 rounded bg-gradient-to-br ${selectedProductForEscrow.imageColor} shrink-0`} />
                  <div>
                    <h4 className="font-sans font-bold text-zinc-200 text-xs">{selectedProductForEscrow.name}</h4>
                    <p className="text-zinc-500 text-[10px] font-mono">Origin: {selectedProductForEscrow.origin}</p>
                    <p className="text-zinc-400 text-[10px] font-semibold mt-1">
                      Min Order Quantity: {selectedProductForEscrow.minOrderQuantity} MT
                    </p>
                  </div>
                </div>

                {/* Ton Quantity Setter */}
                <div>
                  <label className="text-zinc-400 block font-semibold mb-1">Trade Volume (Metric Tons)</label>
                  <div className="flex items-center gap-3">
                    <input
                      id="input-escrow-qty"
                      type="number"
                      min={selectedProductForEscrow.minOrderQuantity}
                      max={selectedProductForEscrow.availableStock}
                      value={escrowQuantity}
                      onChange={(e) => setEscrowQuantity(Math.max(selectedProductForEscrow.minOrderQuantity, Number(e.target.value)))}
                      className="w-24 bg-zinc-900 text-zinc-200 border border-zinc-800 focus:border-emerald-500 rounded px-2.5 py-1.5 font-mono text-center focus:outline-none"
                    />
                    <input
                      type="range"
                      min={selectedProductForEscrow.minOrderQuantity}
                      max={Math.min(selectedProductForEscrow.minOrderQuantity * 10, selectedProductForEscrow.availableStock)}
                      value={escrowQuantity}
                      onChange={(e) => setEscrowQuantity(Number(e.target.value))}
                      className="flex-1 accent-emerald-500 bg-zinc-800 rounded-lg appearance-none h-1.5"
                    />
                  </div>
                  <span className="text-zinc-500 text-[10px] font-mono block mt-1">Available regional stock: {selectedProductForEscrow.availableStock} MT</span>
                </div>

                {/* Destination Point */}
                <div>
                  <label className="text-zinc-400 block font-semibold mb-1">Destination Shipping Port / Warehouse Depot</label>
                  <input
                    id="input-shipping-dest"
                    type="text"
                    required
                    placeholder="e.g., Port of Durban, South Africa"
                    value={shippingDestination}
                    onChange={(e) => setShippingDestination(e.target.value)}
                    className="w-full bg-zinc-900 text-zinc-200 border border-zinc-800 focus:border-emerald-500 rounded px-3 py-1.5 focus:outline-none"
                  />
                </div>

                {/* Cost transparent breakdown */}
                <div className="bg-zinc-900 p-3.5 rounded-lg border border-zinc-800 space-y-1.5">
                  <p className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider font-bold mb-1">CUSTODY LEDGER SHEET</p>
                  
                  <div className="flex justify-between items-center text-zinc-400">
                    <span>Commodity Gross ({escrowQuantity} MT)</span>
                    <span className="font-mono text-zinc-200">${(escrowQuantity * selectedProductForEscrow.pricePerTon).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      Ayopá Escrow Lock fee
                      <span className="bg-emerald-950 text-emerald-400 text-[8px] font-mono px-1 rounded border border-emerald-900">0.5%</span>
                    </span>
                    <span className="font-mono text-zinc-200">${((escrowQuantity * selectedProductForEscrow.pricePerTon) * 0.005).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center text-zinc-400">
                    <span>Simulated Freight Carriage</span>
                    <span className="font-mono text-zinc-200">${((escrowQuantity * selectedProductForEscrow.pricePerTon) * 0.04).toLocaleString()}</span>
                  </div>

                  <div className="h-px bg-zinc-800 my-2" />

                  <div className="flex justify-between items-center text-zinc-200 font-bold">
                    <span>Total Secured Deposit</span>
                    <span className="font-sans text-emerald-400 font-extrabold text-sm">
                      ${((escrowQuantity * selectedProductForEscrow.pricePerTon) * 1.045).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Escrow workflow diagram */}
                <div className="p-3 bg-zinc-950 rounded border border-zinc-900 flex items-center justify-between text-[9px] text-zinc-500 text-center font-mono">
                  <div className="flex-1">
                    <span className="text-zinc-300 block font-semibold uppercase">1. Buyer deposits</span>
                    Held in cold vault
                  </div>
                  <ChevronRight className="w-3 h-3 mx-1 text-zinc-700" />
                  <div className="flex-1">
                    <span className="text-zinc-300 block font-semibold uppercase">2. Seller dispatches</span>
                    Tracked live freight
                  </div>
                  <ChevronRight className="w-3 h-3 mx-1 text-zinc-700" />
                  <div className="flex-1">
                    <span className="text-zinc-300 block font-semibold uppercase">3. Release payment</span>
                    Verification passed
                  </div>
                </div>

                {/* Submission triggers */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProductForEscrow(null)}
                    className="flex-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 font-sans font-semibold py-2 rounded-lg transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="submit-escrow-lock"
                    type="submit"
                    className="flex-1 bg-zinc-100 hover:bg-emerald-500 hover:text-white text-zinc-950 font-sans font-extrabold py-2 rounded-lg transition-all cursor-pointer"
                  >
                    Verify & Create Escrow
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
