import React, { useMemo, useState } from "react";
import { Bell, CheckCircle2, CircleDollarSign, Package, ShieldCheck, Store, Users, X } from "lucide-react";
import BuyerWorkspace from "../buyer/BuyerWorkspace";
import SellerWorkspace from "../seller/SellerWorkspace";
import AdminWorkspace from "../admin/AdminWorkspace";
import type { CommodityProduct, EscrowOrder, EscrowStatus, ChatMessage, SellerKYC } from "../../types";

export type DemoRoute = "marketplace" | "seller" | "admin";

const productImages = [
  "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1594761051656-6d4f1d5a4f4b?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1523742819361-bd6c3e9f3f3a?auto=format&fit=crop&w=900&q=80",
];

const seedProducts: CommodityProduct[] = [
  { id: "prod-cocoa", name: "Ondo Cocoa Beans", category: "Agriculture", origin: "Ile-Oluji, Ondo", grade: "Export Quality", certification: "SGS Verified", pricePerTon: 2480, minOrderQuantity: 10, availableStock: 420, sellerId: "seller-1", sellerName: "Okeigbo Cocoa Growers", sellerRating: 4.9, description: "Sun-dried cocoa beans with a clean fermentation profile, export packed and ready for port release.", imageColor: "from-amber-800 to-stone-950", imageUrl: productImages[0] },
  { id: "prod-maize", name: "White Maize · Grade A", category: "Agriculture", origin: "Kano, Nigeria", grade: "Grade A", certification: "AFEX Assayed", pricePerTon: 410, minOrderQuantity: 25, availableStock: 860, sellerId: "seller-2", sellerName: "Northern Grain Alliance", sellerRating: 4.8, description: "Non-GMO white maize, moisture controlled and stored in certified regional silos.", imageColor: "from-yellow-700 to-amber-950", imageUrl: productImages[1] },
  { id: "prod-cashew", name: "Kwara Cashew Kernels", category: "Processed Goods", origin: "Ilorin, Kwara", grade: "Premium", certification: "Fairtrade Ready", pricePerTon: 1730, minOrderQuantity: 8, availableStock: 210, sellerId: "seller-3", sellerName: "Kwara Harvest Cooperative", sellerRating: 4.7, description: "Large-count cashew kernels from a traceable smallholder network with batch-level quality records.", imageColor: "from-orange-800 to-stone-950", imageUrl: productImages[2] },
  { id: "prod-copper", name: "Nigerian Lead-Zinc Ore", category: "Minerals", origin: "Nasarawa, Nigeria", grade: "Export Quality", certification: "NIEX Assayed", pricePerTon: 8420, minOrderQuantity: 5, availableStock: 95, sellerId: "seller-4", sellerName: "Solid Minerals Cooperative", sellerRating: 4.9, description: "Washed lead-zinc ore with assay certificate, sealed bags, and insured movement to the river port.", imageColor: "from-stone-600 to-stone-950", imageUrl: productImages[3] },
  { id: "prod-sesame", name: "Golden Sesame Seed", category: "Agriculture", origin: "Kaduna, Nigeria", grade: "Premium", certification: "Export Lab Cleared", pricePerTon: 1190, minOrderQuantity: 12, availableStock: 340, sellerId: "seller-2", sellerName: "Northern Grain Alliance", sellerRating: 4.8, description: "Cleaned, sorted sesame with low admixture and export-ready documentation.", imageColor: "from-yellow-800 to-stone-950", imageUrl: productImages[4] },
  { id: "prod-cotton", name: "Katsina Cotton Bales", category: "Textiles", origin: "Katsina, Nigeria", grade: "Standard Grade", certification: "Organic Chain of Custody", pricePerTon: 980, minOrderQuantity: 15, availableStock: 140, sellerId: "seller-5", sellerName: "Katsina Cotton Growers", sellerRating: 4.6, description: "Traceable organic cotton bales prepared for textile mills and regional freight consolidation.", imageColor: "from-slate-500 to-stone-950", imageUrl: productImages[5] },
];

const seedOrders: EscrowOrder[] = [
  { id: "esc-482", productId: "prod-cocoa", productName: "Ondo Cocoa Beans", buyerName: "Lagos Foods & Hospitality Ltd.", sellerName: "Okeigbo Cocoa Growers", quantity: 24, unitPrice: 2480, totalValue: 59520, escrowFee: 297.6, logisticsFee: 2380.8, totalAmount: 62198.4, status: "Under Inspection", origin: "Ile-Oluji, Ondo", destination: "Apapa Port, Lagos", carrier: "Maersk Line", trackingNumber: "MAE-0048219", createdAt: "2026-10-28T09:24:00.000Z" },
  { id: "esc-476", productId: "prod-maize", productName: "White Maize · Grade A", buyerName: "Lagos Foodworks", sellerName: "Northern Grain Alliance", quantity: 80, unitPrice: 410, totalValue: 32800, escrowFee: 164, logisticsFee: 1312, totalAmount: 34276, status: "Dispatched", origin: "Kano, Nigeria", destination: "Apapa, Lagos", carrier: "ABC Haulage", trackingNumber: "ABC-88210", createdAt: "2026-10-19T14:10:00.000Z" },
  { id: "esc-468", productId: "prod-cashew", productName: "Kwara Cashew Kernels", buyerName: "Abuja Snack House", sellerName: "Kwara Harvest Cooperative", quantity: 12, unitPrice: 1730, totalValue: 20760, escrowFee: 103.8, logisticsFee: 830.4, totalAmount: 21694.2, status: "Disputed", origin: "Ilorin, Kwara", destination: "Tincan Island Port, Lagos", createdAt: "2026-10-12T07:40:00.000Z", disputeReason: "Quality Deviation Challenge", disputeNotes: "Arrival assay shows moisture above the contracted threshold. Requesting independent review before release." },
  { id: "esc-451", productId: "prod-copper", productName: "Nigerian Lead-Zinc Ore", buyerName: "Dangote Industrial Supply", sellerName: "Solid Minerals Cooperative", quantity: 8, unitPrice: 8420, totalValue: 67360, escrowFee: 336.8, logisticsFee: 2694.4, totalAmount: 70391.2, status: "Funds Released", origin: "Nasarawa, Nigeria", destination: "Onne Port, Rivers", createdAt: "2026-09-26T11:15:00.000Z" },
];

const seedKyc: SellerKYC = { status: "Pending", companyName: "Kwara Harvest Cooperative", registrationNumber: "NG-CAC-48120", taxId: "NG-TX-774201", country: "Nigeria", licenseDocumentName: "CAC-Export-License-Nigeria.pdf", bankAccount: "First Bank Nigeria ···· 2084" };
const seedChats: ChatMessage[] = [{ id: "msg-1", orderId: "esc-482", sender: "Ayopá Mediator", text: "Inspection window is open. Upload the arrival assay before authorizing release.", timestamp: "2026-11-04T08:30:00.000Z" }];

export default function DemoApp({ route, onRouteChange }: { route: DemoRoute; onRouteChange: (route: DemoRoute) => void }) {
  const [products, setProducts] = useState(seedProducts);
  const [orders, setOrders] = useState(seedOrders);
  const [kyc, setKyc] = useState(seedKyc);
  const [chats, setChats] = useState(seedChats);
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; type: string }[]>([]);

  const notify = (title: string, message: string, type: "success" | "info" | "warning" | "error") => {
    const id = `${Date.now()}`;
    setNotifications((items) => [{ id, title, message, type }, ...items].slice(0, 3));
    window.setTimeout(() => setNotifications((items) => items.filter((item) => item.id !== id)), 4200);
  };
  const updateOrder = (id: string, status: EscrowStatus, updateData?: Partial<EscrowOrder>) => setOrders((items) => items.map((order) => order.id === id ? { ...order, status, ...updateData } : order));
  const stats = useMemo(() => ({ active: orders.filter((o) => !["Funds Released", "Funds Refunded"].includes(o.status)).length, volume: orders.reduce((sum, o) => sum + o.totalValue, 0), verified: products.length }), [orders, products]);

  return (
    <div className="ayopa-app min-h-screen bg-[#080808] text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-zinc-900/90 bg-[#080808]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-7">
          <button onClick={() => onRouteChange("marketplace")} className="flex items-center gap-3 text-left">
            <span className="ayopa-mark flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4A017] font-display text-lg font-black text-black">A</span>
            <span><span className="block font-display text-lg font-bold tracking-tight">Ayopá</span><span className="hidden text-[9px] uppercase tracking-[0.24em] text-zinc-500 sm:block">Verified trade network</span></span>
          </button>
          <nav className="hidden items-center gap-1 rounded-2xl border border-zinc-800 bg-zinc-950 p-1 md:flex">
            {([['marketplace', 'Marketplace', Store], ['seller', 'Seller studio', Package], ['admin', 'Operations', ShieldCheck]] as const).map(([key, label, Icon]) => <button key={key} onClick={() => onRouteChange(key)} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${route === key ? 'bg-[#D4A017] text-black' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}><Icon className="h-3.5 w-3.5" />{label}</button>)}
          </nav>
          <div className="flex items-center gap-2"><span className="hidden items-center gap-1.5 rounded-full border border-emerald-900/60 bg-emerald-950/30 px-3 py-1.5 text-[10px] font-semibold text-emerald-300 sm:flex"><span className="ayopa-live-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />Demo data connected</span><button className="rounded-xl border border-zinc-800 p-2 text-zinc-400 hover:text-white"><Bell className="h-4 w-4" /></button></div>
        </div>
        <div className="mx-auto flex max-w-[1440px] gap-1 overflow-x-auto px-4 pb-2 md:hidden">{([['marketplace', 'Marketplace'], ['seller', 'Seller studio'], ['admin', 'Operations']] as const).map(([key, label]) => <button key={key} onClick={() => onRouteChange(key)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold ${route === key ? 'bg-[#D4A017] text-black' : 'bg-zinc-900 text-zinc-400'}`}>{label}</button>)}</div>
      </header>

      {route === "marketplace" && <BuyerWorkspace products={products} orders={orders} chats={chats} isLoading={false} onNewOrder={(order) => setOrders((items) => [order, ...items])} onUpdateOrder={updateOrder} onSendMessage={(orderId, sender, text) => setChats((items) => [...items, { id: `${Date.now()}`, orderId, sender, text, timestamp: new Date().toISOString() }])} onAddNotification={notify} />}
      {route === "seller" && <SellerWorkspace products={products} orders={orders} kyc={kyc} isLoading={false} onUpdateKyc={(next) => { setKyc(next); notify(next.status === "Verified" ? "Verification approved" : "Verification submitted", "Seller permissions updated across the demo workspace.", next.status === "Verified" ? "success" : "info"); }} onAddProduct={(product) => { setProducts((items) => [product, ...items]); notify("Listing published", `${product.name} is now visible in the buyer marketplace.`, "success"); }} onUpdateOrder={updateOrder} onAddNotification={notify} />}
      {route === "admin" && <AdminWorkspace orders={orders} kyc={kyc} onUpdateKyc={(next) => { setKyc(next); notify(next.status === "Verified" ? "Seller approved" : "Seller status updated", "The seller studio is now in sync with operations.", next.status === "Verified" ? "success" : "warning"); }} onUpdateOrder={updateOrder} onAddNotification={notify} />}

      <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">{notifications.map((item) => <div key={item.id} className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-zinc-700 bg-zinc-950/95 p-4 shadow-2xl"><div className={`mt-0.5 rounded-full p-1.5 ${item.type === 'success' ? 'bg-emerald-500/15 text-emerald-300' : item.type === 'warning' ? 'bg-amber-500/15 text-amber-300' : 'bg-blue-500/15 text-blue-300'}`}>{item.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <CircleDollarSign className="h-4 w-4" />}</div><div className="min-w-0 flex-1"><p className="text-xs font-bold text-white">{item.title}</p><p className="mt-1 text-[11px] leading-relaxed text-zinc-400">{item.message}</p></div><button onClick={() => setNotifications((items) => items.filter((n) => n.id !== item.id))} className="text-zinc-600 hover:text-zinc-200"><X className="h-3.5 w-3.5" /></button></div>)}</div>
      <footer className="mx-auto flex max-w-[1440px] items-center justify-between border-t border-zinc-900 px-4 py-6 text-[10px] text-zinc-600 sm:px-7"><span>Ayopá demo workspace · {stats.verified} live contracts</span><span className="hidden sm:block">{stats.active} active escrows · ${stats.volume.toLocaleString()} trade volume</span></footer>
    </div>
  );
}
