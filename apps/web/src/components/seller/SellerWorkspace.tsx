/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { CommodityProduct, EscrowOrder, SellerKYC, EscrowStatus } from "../../types";
import { 
  PlusCircle, TrendingUp, Coins, Truck, CheckCircle2, Building, FileText, 
  Percent, Star, UserCheck, BarChart3, ArrowUpRight, CheckCheck, Loader2 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SellerWorkspaceProps {
  products: CommodityProduct[];
  orders: EscrowOrder[];
  kyc: SellerKYC;
  isLoading: boolean;
  onUpdateKyc: (updatedKyc: SellerKYC) => void;
  onAddProduct: (newProduct: CommodityProduct) => void;
  onUpdateOrder: (orderId: string, status: EscrowStatus, updateData?: Partial<EscrowOrder>) => void;
  onAddNotification: (title: string, message: string, type: "success" | "info" | "warning" | "error") => void;
}

export default function SellerWorkspace({
  products,
  orders,
  kyc,
  isLoading,
  onUpdateKyc,
  onAddProduct,
  onUpdateOrder,
  onAddNotification,
}: SellerWorkspaceProps) {
  // Listing Form State
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState<"Agriculture" | "Minerals" | "Textiles" | "Processed Goods">("Agriculture");
  const [origin, setOrigin] = useState("");
  const [grade, setGrade] = useState<"Grade A" | "Premium" | "Export Quality" | "Standard Grade">("Premium");
  const [certification, setCertification] = useState("");
  const [pricePerTon, setPricePerTon] = useState<number>(0);
  const [minOrderQty, setMinOrderQty] = useState<number>(0);
  const [availableStock, setAvailableStock] = useState<number>(0);
  const [description, setDescription] = useState("");

  // KYC stepper step
  const [kycStep, setKycStep] = useState(1);
  const [companyName, setCompanyName] = useState(kyc.companyName);
  const [registrationNumber, setRegistrationNumber] = useState(kyc.registrationNumber);
  const [taxId, setTaxId] = useState(kyc.taxId);
  const [country, setCountry] = useState(kyc.country);
  const [licenseDocument, setLicenseDocument] = useState(kyc.licenseDocumentName);
  const [bankAccount, setBankAccount] = useState(kyc.bankAccount);

  // Dispatch states
  const [dispatchOrderId, setDispatchOrderId] = useState<string | null>(null);
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  // Filter orders that belong to this cooperative / seller
  const sellerOrders = useMemo(() => {
    return orders; // Simulated shared trades
  }, [orders]);

  // Compute stats
  const stats = useMemo(() => {
    const activeEscrows = sellerOrders.filter(o => !["Funds Released", "Funds Refunded", "Awaiting Funding"].includes(o.status));
    const grossVolume = sellerOrders
      .filter(o => o.status === "Funds Released")
      .reduce((sum, o) => sum + o.totalValue, 0);
    const lockedVolume = activeEscrows.reduce((sum, o) => sum + o.totalValue, 0);
    const completionRate = sellerOrders.length > 0 
      ? Math.round((sellerOrders.filter(o => o.status === "Funds Released").length / sellerOrders.filter(o => ["Funds Released", "Funds Refunded"].includes(o.status)).length || 1) * 100)
      : 100;

    return {
      grossVolume,
      lockedVolume,
      activeCount: activeEscrows.length,
      completionRate,
    };
  }, [sellerOrders]);

  // Handle KYC Submit
  const handleKycSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedKyc: SellerKYC = {
      status: "Pending",
      companyName,
      registrationNumber,
      taxId,
      country,
      licenseDocumentName: licenseDocument || "TradeLicense-Standard.pdf",
      bankAccount,
    };
    onUpdateKyc(updatedKyc);
    onAddNotification(
      "KYC Verification Requested",
      `Your business profile for ${companyName} has been submitted for Ayopá administrative validation.`,
      "info"
    );
  };

  // Immediate approval trigger
  const handleSimulateInstantVerification = () => {
    const verifiedKyc: SellerKYC = {
      status: "Verified",
      companyName: companyName || "West-African Grain Alliance",
      registrationNumber: registrationNumber || "WA-992112-L",
      taxId: taxId || "TX-882110",
      country: country || "Ghana",
      licenseDocumentName: licenseDocument || "TradeLicense-Ghana.pdf",
      bankAccount: bankAccount || "Afriland First Bank - 991200",
    };
    onUpdateKyc(verifiedKyc);
    onAddNotification(
      "KYC Verification Approved",
      "Ayopá administrative team has verified your trade license and bank registry. Listing capabilities active.",
      "success"
    );
  };

  // Handle product creation
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || pricePerTon <= 0) return;

    // Elegant gradient randomizer
    const gradients = [
      "from-amber-700 to-amber-950",
      "from-yellow-600 to-amber-800",
      "from-emerald-800 to-stone-900",
      "from-yellow-700 to-emerald-950",
      "from-orange-600 to-amber-950",
      "from-stone-500 to-amber-700"
    ];
    const imageColor = gradients[Math.floor(Math.random() * gradients.length)];

    const newProduct: CommodityProduct = {
      id: `prod-${Math.floor(100 + Math.random() * 900)}`,
      name: productName,
      category,
      origin: origin || "Nigeria (Kano Port)",
      grade,
      certification: certification || "SGS Certified Premium Quality",
      pricePerTon,
      minOrderQuantity: minOrderQty || 10,
      availableStock: availableStock || 100,
      sellerId: "sell-me",
      sellerName: kyc.companyName || "Your Cooperative",
      sellerRating: 5.0,
      description: description || "Freshly harvested and sun-cured export grade commodity. Fully moisture-controlled and packed in robust export sacks.",
      imageColor
    };

    onAddProduct(newProduct);
    onAddNotification(
      "Trade Commodity Listed",
      `Successfully published ${productName} to the global Ayopá marketplace.`,
      "success"
    );

    // Reset Form
    setProductName("");
    setOrigin("");
    setCertification("");
    setPricePerTon(0);
    setMinOrderQty(0);
    setAvailableStock(0);
    setDescription("");
  };

  // Dispatch handler
  const handleDispatchOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchOrderId || !carrier || !trackingNumber) return;

    onUpdateOrder(dispatchOrderId, "Dispatched", {
      carrier,
      trackingNumber
    });

    onAddNotification(
      "Freight Consignment Dispatched",
      `Order ${dispatchOrderId} handed over to ${carrier} (${trackingNumber}). Tracking uploaded.`,
      "success"
    );

    setDispatchOrderId(null);
    setCarrier("");
    setTrackingNumber("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 max-w-7xl mx-auto">
      
      {/* LEFT COLUMN: Seller KYC, List creation, and metrics (7 Cols) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Verification / KYC Banner */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-sm relative overflow-hidden">
          {kyc.status === "Verified" ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-emerald-950/80 border border-emerald-800 text-emerald-400 rounded-lg shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-sm text-zinc-100 tracking-tight flex items-center gap-1.5">
                    Verified Seller License
                    <span className="bg-emerald-950 text-emerald-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-800">ACTIVE</span>
                  </h3>
                  <p className="text-zinc-400 text-xs mt-0.5">
                    Your trade credentials for <strong className="text-zinc-300">{kyc.companyName}</strong> are approved. Global listing is active.
                  </p>
                </div>
              </div>
              <div className="text-xs font-mono text-zinc-500 text-right">
                ID: AYP-REG-9811
              </div>
            </div>
          ) : kyc.status === "Pending" ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-amber-950/80 border border-amber-800 text-amber-400 rounded-lg shrink-0 animate-pulse">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-sm text-zinc-100 tracking-tight flex items-center gap-1.5">
                    KYC Validation Pending
                  </h3>
                  <p className="text-zinc-400 text-xs mt-0.5">
                    Your trade documents are being audited. You can bypass this and approve instantly below.
                  </p>
                </div>
              </div>
              <button
                onClick={handleSimulateInstantVerification}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-bold text-[10px] uppercase px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0"
              >
                Instant Admin Verify
              </button>
            </div>
          ) : (
            // Full interactive multi-step KYC setup
            <div>
              <div className="mb-4">
                <h3 className="font-sans font-bold text-sm text-zinc-100">Establish Trade Cooperative Verification (KYC)</h3>
                <p className="text-zinc-500 text-xs">Verify your registered corporate entity to access secure escrow trade channels.</p>
              </div>

              {/* Progress Steppers */}
              <div className="flex justify-between items-center mb-5 max-w-md">
                {[1, 2, 3].map((step) => (
                  <button
                    key={step}
                    onClick={() => setKycStep(step)}
                    className={`flex items-center gap-1 text-[10px] font-mono cursor-pointer ${
                      kycStep === step ? "text-emerald-400 font-bold" : "text-zinc-500"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-[9px] ${
                      kycStep >= step ? "border-emerald-500 text-emerald-400" : "border-zinc-800"
                    }`}>
                      {step}
                    </span>
                    {step === 1 && "Cooperative Info"}
                    {step === 2 && "License Upload"}
                    {step === 3 && "Bank Lock"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleKycSubmit} className="space-y-4 font-sans text-xs">
                {kycStep === 1 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-zinc-400 block mb-1">Company / Cooperative Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., SOTRACO Cocoa Union"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-2.5 py-1.5 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 block mb-1">Trade Registry Number</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., COOP-WA-229"
                        value={registrationNumber}
                        onChange={(e) => setRegistrationNumber(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-2.5 py-1.5 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {kycStep === 2 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-zinc-400 block mb-1">Tax ID / VAT Registry</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., TX-882210"
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-2.5 py-1.5 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 block mb-1">Phytosanitary / Import License Document</label>
                      <input
                        type="text"
                        placeholder="e.g., License-Certificate-V2.pdf"
                        value={licenseDocument}
                        onChange={(e) => setLicenseDocument(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-2.5 py-1.5 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {kycStep === 3 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-zinc-400 block mb-1">Origin Trade Country</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Ghana, Côte d'Ivoire, Zambia"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-2.5 py-1.5 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 block mb-1">Escrow Payout Bank Account</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Ecobank Central - AC-99211"
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-2.5 py-1.5 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSimulateInstantVerification}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-400 font-semibold px-3 py-1.5 rounded transition-all cursor-pointer"
                  >
                    Bypass / Instant Approve
                  </button>

                  {kycStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => setKycStep(p => p + 1)}
                      className="bg-zinc-100 hover:bg-emerald-500 hover:text-white text-zinc-950 font-semibold px-4 py-1.5 rounded transition-all cursor-pointer"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded transition-all cursor-pointer"
                    >
                      Submit Verification
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Create/Publish Commodity Listing */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-sans font-bold text-sm text-zinc-100 flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              List New Export Commodity Contract
            </h3>
            <p className="text-zinc-500 text-xs">Verify quantity and grade parameters before submission. Published instantly to the directory.</p>
          </div>

          <form onSubmit={handleCreateProduct} className="space-y-4 font-sans text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-400 block mb-1">Commodity / Contract Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., White Maize Grade A (Non-GMO)"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-2.5 py-1.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Category Sect</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="Agriculture">Agriculture Sector</option>
                  <option value="Minerals">Minerals & Metal Trade</option>
                  <option value="Textiles">Textiles & Cotton Yards</option>
                  <option value="Processed Goods">Processed Goods</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-400 block mb-1">Specific Origin Hub</label>
                <input
                  type="text"
                  placeholder="e.g., Zambia (Central Province)"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-2.5 py-1.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Certified Grade Class</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="Premium">Premium Select</option>
                  <option value="Grade A">Grade A Standard</option>
                  <option value="Export Quality">Export Quality Cert</option>
                  <option value="Standard Grade">Standard Grade</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-zinc-400 block mb-1">Price per Metric Ton ($)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g., 2450"
                  value={pricePerTon || ""}
                  onChange={(e) => setPricePerTon(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-2.5 py-1.5 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Min Order Qty (MT)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g., 10"
                  value={minOrderQty || ""}
                  onChange={(e) => setMinOrderQty(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-2.5 py-1.5 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Available Regional Stock (MT)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g., 500"
                  value={availableStock || ""}
                  onChange={(e) => setAvailableStock(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-2.5 py-1.5 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">Quality Verification / Phytosanitary Cert</label>
              <input
                type="text"
                placeholder="e.g., SGS Certified, SADC Phytosanitary Cert"
                value={certification}
                onChange={(e) => setCertification(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-2.5 py-1.5 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">Detailed Technical Specifications / Humidity Logs</label>
              <textarea
                rows={3}
                placeholder="Moisture levels, storage coordinates, crop season, packing specification..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-2.5 py-1.5 focus:outline-none font-sans"
              />
            </div>

            <button
              id="btn-publish-listing"
              type="submit"
              disabled={kyc.status !== "Verified"}
              className={`w-full font-sans font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                kyc.status === "Verified"
                  ? "bg-zinc-100 hover:bg-emerald-500 hover:text-white text-zinc-950"
                  : "bg-zinc-900 text-zinc-600 border border-zinc-900/60 cursor-not-allowed"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              {kyc.status === "Verified" ? "Publish Trade Contract" : "Verify KYC to Unlock Listing"}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: Sales Analytics & Shipping Dispatch Panel (5 Cols) */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Real-time Sales metrics & minimalist micro-charts */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-sm">
          <h3 className="font-sans font-bold text-sm text-zinc-100 mb-4 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Trade Ledger Analytics
          </h3>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-900">
              <span className="text-[9px] font-mono text-zinc-500 uppercase block">Settled Gross Volume</span>
              <span className="text-lg font-serif font-bold italic text-zinc-100 block mt-0.5">${stats.grossVolume.toLocaleString()}</span>
              <div className="flex items-center gap-1.5 text-[10px] text-[#D4A017] font-mono mt-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+12.4% MoM</span>
              </div>
            </div>

            <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-900">
              <span className="text-[9px] font-mono text-zinc-500 uppercase block">Capital In Escrow</span>
              <span className="text-lg font-serif font-bold italic text-[#D4A017] block mt-0.5">${stats.lockedVolume.toLocaleString()}</span>
              <span className="text-[9px] font-mono text-zinc-500 mt-1 block">{stats.activeCount} active secure locks</span>
            </div>
          </div>

          {/* Micro-chart showing trade flow per month (Pure elegant CSS bento grid) */}
          <div className="space-y-2">
            <span className="text-[9px] font-mono text-zinc-500 uppercase block font-bold">Monthly Settled Invoices (2026)</span>
            <div className="flex items-end justify-between gap-2.5 h-20 bg-zinc-900/20 p-3 rounded-lg border border-zinc-900">
              {[
                { m: "Jan", v: "h-[30%]" },
                { m: "Feb", v: "h-[45%]" },
                { m: "Mar", v: "h-[65%]" },
                { m: "Apr", v: "h-[50%]" },
                { m: "May", v: "h-[85%]" },
                { m: "Jun", v: "h-[75%]" },
                { m: "Jul", v: "h-[95%]" }
              ].map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className={`w-full bg-zinc-800 group-hover:bg-[#D4A017] rounded-sm transition-all duration-300 ${item.v}`} />
                  <span className="text-[8px] font-mono text-zinc-600 mt-1.5 group-hover:text-zinc-450">{item.m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Storefront / Dispatch Desk */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-sm">
          <h3 className="font-sans font-bold text-sm text-zinc-100 mb-3 tracking-tight">Dispatch Desk</h3>
          <p className="text-zinc-500 text-xs mb-4">Register cargo freight transport systems for funded escrow orders.</p>

          <div className="space-y-4">
            {sellerOrders.filter(o => o.status === "Funds Secured").length === 0 ? (
              <div className="py-8 text-center bg-zinc-900/20 border border-dashed border-zinc-800 rounded-lg">
                <Truck className="w-5 h-5 text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-500 text-xs">No pending consignments requiring dispatch</p>
                <p className="text-zinc-600 text-[10px] mt-0.5">Funded buyer orders will show up here immediately</p>
              </div>
            ) : (
              sellerOrders.filter(o => o.status === "Funds Secured").map((ord) => (
                <div key={ord.id} className="p-3.5 bg-zinc-900/60 rounded-lg border border-zinc-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-emerald-400 font-bold">{ord.id}</span>
                    <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-900 px-2 rounded font-mono uppercase">
                      Funds Secured
                    </span>
                  </div>

                  <div>
                    <h4 className="font-sans font-bold text-xs text-white leading-tight">{ord.productName}</h4>
                    <span className="text-zinc-500 text-[10px] block font-mono">Buyer: {ord.buyerName}</span>
                  </div>

                  {dispatchOrderId === ord.id ? (
                    <form onSubmit={handleDispatchOrder} className="space-y-2.5 pt-2 border-t border-zinc-800/80">
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <label className="text-zinc-400 block mb-1">Carrier Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g., Maersk, DHL"
                            value={carrier}
                            onChange={(e) => setCarrier(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-200 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-zinc-400 block mb-1">Bill of Lading / Tracking ID</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g., AYP-MSK-9900"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-200 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 text-[9px] font-semibold">
                        <button
                          type="button"
                          onClick={() => setDispatchOrderId(null)}
                          className="flex-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-400 py-1 rounded cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-1 rounded cursor-pointer"
                        >
                          Confirm Dispatch
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setDispatchOrderId(ord.id)}
                      className="w-full bg-zinc-100 hover:bg-emerald-500 hover:text-white text-zinc-950 font-sans font-bold text-[10px] uppercase py-1.5 rounded transition-all cursor-pointer"
                    >
                      Dispatch Consignment Cargo
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Shipped/Dispatched Order logs */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-sm">
          <h3 className="font-sans font-bold text-sm text-zinc-100 mb-3 tracking-tight">Active Dispatches</h3>
          <div className="space-y-2.5">
            {sellerOrders.filter(o => o.status === "Dispatched" || o.status === "Under Inspection").length === 0 ? (
              <p className="text-zinc-600 text-xs italic">No active freights in sea or dry carriage routes.</p>
            ) : (
              sellerOrders.filter(o => o.status === "Dispatched" || o.status === "Under Inspection").map((ord) => (
                <div key={ord.id} className="p-3 bg-zinc-900/30 rounded border border-zinc-900 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-zinc-300 block leading-tight">{ord.productName}</span>
                    <span className="font-mono text-[9px] text-zinc-500 mt-0.5 block">
                      Carrier: {ord.carrier} | {ord.trackingNumber}
                    </span>
                  </div>

                  <span className="text-[9px] uppercase bg-blue-950/40 text-blue-400 border border-blue-900 px-2 py-0.5 rounded font-mono">
                    {ord.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
