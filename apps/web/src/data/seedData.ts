/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommodityProduct, EscrowOrder, ChatMessage, AppNotification } from "../types";

export const INITIAL_PRODUCTS: CommodityProduct[] = [
  {
    id: "prod-1",
    name: "Organic Cocoa Beans (Raw)",
    category: "Agriculture",
    origin: "Ivory Coast (San Pédro)",
    grade: "Premium",
    certification: "SGS Certified, UTZ Rainforest Alliance",
    pricePerTon: 2450,
    minOrderQuantity: 10,
    availableStock: 150,
    sellerId: "sell-1",
    sellerName: "SOTRACO Cocoa Cooperative",
    sellerRating: 4.9,
    description: "Highest-grade fermented raw cocoa beans. Moisture content below 7.5%. Excellent flavor profile suitable for premium dark chocolate production.",
    imageColor: "from-amber-700 to-amber-950"
  },
  {
    id: "prod-2",
    name: "White Maize (Grade A)",
    category: "Agriculture",
    origin: "Zambia (Central Province)",
    grade: "Grade A",
    certification: "SADC Phytosanitary Cert, SGS Inspectorate",
    pricePerTon: 380,
    minOrderQuantity: 25,
    availableStock: 800,
    sellerId: "sell-2",
    sellerName: "Kabwe Agri-Hub Ltd",
    sellerRating: 4.8,
    description: "Premium white dent maize, non-GMO. Double-cleaned, maximum 12% moisture. Ideal for food processing, flour mills, and regional distribution.",
    imageColor: "from-yellow-600 to-amber-800"
  },
  {
    id: "prod-3",
    name: "Ethiopian Specialty Coffee (Yirgacheffe)",
    category: "Agriculture",
    origin: "Ethiopia (Gedeo Zone)",
    grade: "Premium",
    certification: "Organic Certified, Fairtrade, SGS Clean-Bill",
    pricePerTon: 5800,
    minOrderQuantity: 5,
    availableStock: 60,
    sellerId: "sell-3",
    sellerName: "Yirgacheffe Coffee Farmers Union",
    sellerRating: 5.0,
    description: "Wet-processed Arabica coffee beans. Exceptional floral and citrus notes with a balanced body. Highly sought-after specialty microlot.",
    imageColor: "from-amber-800 to-stone-900"
  },
  {
    id: "prod-4",
    name: "Premium Raw Shea Butter",
    category: "Processed Goods",
    origin: "Ghana (Tamale)",
    grade: "Export Quality",
    certification: "FDA Approved, EcoCert Organic Certification",
    pricePerTon: 1850,
    minOrderQuantity: 8,
    availableStock: 120,
    sellerId: "sell-4",
    sellerName: "Northern Women's Shea Alliance",
    sellerRating: 4.7,
    description: "100% natural, unrefined shea butter. Expeller-pressed and filtered. Rich in vitamins A, E, and F, optimal for cosmetic and confectionery use.",
    imageColor: "from-yellow-700 to-emerald-950"
  },
  {
    id: "prod-5",
    name: "Copper Cathodes (Grade A)",
    category: "Minerals",
    origin: "DR Congo (Kolwezi)",
    grade: "Premium",
    certification: "LME Grade A Registered, SGS Assay report",
    pricePerTon: 8100,
    minOrderQuantity: 20,
    availableStock: 300,
    sellerId: "sell-5",
    sellerName: "Katanga Copper-Works Joint Venture",
    sellerRating: 4.6,
    description: "High-purity electrolytic copper cathodes, purity min 99.9935%. Premium structural sheets bundle, secured with heavy-duty bands.",
    imageColor: "from-orange-600 to-amber-950"
  },
  {
    id: "prod-6",
    name: "Sun-Dried Split Ginger",
    category: "Agriculture",
    origin: "Nigeria (Kaduna State)",
    grade: "Export Quality",
    certification: "SGS certified, NAFDAC Export Clearance",
    pricePerTon: 1600,
    minOrderQuantity: 12,
    availableStock: 250,
    sellerId: "sell-6",
    sellerName: "Gbagyi Ginger Growers",
    sellerRating: 4.7,
    description: "Carefully sun-dried split ginger. Moisture < 12%, oil content > 1.5%, extremely low extraneous matter. Packed in 50kg eco-woven sacks.",
    imageColor: "from-stone-500 to-amber-700"
  }
];

export const INITIAL_ORDERS: EscrowOrder[] = [
  {
    id: "esc-781",
    productId: "prod-1",
    productName: "Organic Cocoa Beans (Raw)",
    buyerName: "Chocolates d'Europe (Zürich)",
    sellerName: "SOTRACO Cocoa Cooperative",
    quantity: 40,
    unitPrice: 2450,
    totalValue: 98000,
    escrowFee: 490, // 0.5%
    logisticsFee: 4500,
    totalAmount: 102990,
    status: "Under Inspection",
    origin: "Ivory Coast (San Pédro)",
    destination: "Port of Rotterdam (Netherlands)",
    trackingNumber: "AYP-MSK-98112",
    carrier: "Maersk Line",
    createdAt: "2026-07-10T10:15:00Z"
  },
  {
    id: "esc-402",
    productId: "prod-2",
    productName: "White Maize (Grade A)",
    buyerName: "Southern Milling Corp (Harare)",
    sellerName: "Kabwe Agri-Hub Ltd",
    quantity: 100,
    unitPrice: 380,
    totalValue: 38000,
    escrowFee: 190,
    logisticsFee: 3200,
    totalAmount: 41390,
    status: "Funds Secured",
    origin: "Zambia (Central Province)",
    destination: "Zimbabwe (Harare Depot)",
    trackingNumber: "AYP-TRK-77114",
    carrier: "Bolloré Logistics",
    createdAt: "2026-07-16T14:30:00Z"
  },
  {
    id: "esc-210",
    productId: "prod-4",
    productName: "Premium Raw Shea Butter",
    buyerName: "Naturals Bio Cosmetics (Nairobi)",
    sellerName: "Northern Women's Shea Alliance",
    quantity: 15,
    unitPrice: 1850,
    totalValue: 27750,
    escrowFee: 138.75,
    logisticsFee: 1800,
    totalAmount: 29688.75,
    status: "Funds Released",
    origin: "Ghana (Tamale)",
    destination: "Kenya (Mombasa Port)",
    trackingNumber: "AYP-DHL-30221",
    carrier: "DHL Express Global",
    createdAt: "2026-07-02T08:00:00Z"
  },
  {
    id: "esc-889",
    productId: "prod-3",
    productName: "Ethiopian Specialty Coffee (Yirgacheffe)",
    buyerName: "Tokyo Coffee Roasters Inc",
    sellerName: "Yirgacheffe Coffee Farmers Union",
    quantity: 8,
    unitPrice: 5800,
    totalValue: 46400,
    escrowFee: 232,
    logisticsFee: 2900,
    totalAmount: 49532,
    status: "Disputed",
    origin: "Ethiopia (Gedeo Zone)",
    destination: "Japan (Tokyo Port)",
    trackingNumber: "AYP-MSK-55223",
    carrier: "Maersk Line",
    createdAt: "2026-07-12T11:20:00Z",
    disputeReason: "Moisture content excess",
    disputeNotes: "SGS pre-shipment cert reports 11% moisture, but arrival testing reports 16% moisture with light mildew risk. Requesting 20% price adjustment or complete re-inspection."
  }
];

export const INITIAL_CHATS: ChatMessage[] = [
  {
    id: "c1",
    orderId: "esc-781",
    sender: "System",
    text: "Ayopá Escrow initialized. Buyer has committed $102,990.00 to holding smart ledger.",
    timestamp: "10:16 AM"
  },
  {
    id: "c2",
    orderId: "esc-781",
    sender: "Buyer",
    text: "Greetings. SOTRACO team, have the cocoa bags been processed at the San Pédro warehouse? We are monitoring the moisture logs.",
    timestamp: "10:18 AM"
  },
  {
    id: "c3",
    orderId: "esc-781",
    sender: "Seller",
    text: "Yes, they have completed fermentation and standard sun drying. SGS Inspector has already visited and taken sample batches. We are printing the phytosanitary certifications now.",
    timestamp: "10:25 AM"
  },
  {
    id: "c4",
    orderId: "esc-781",
    sender: "System",
    text: "Seller uploaded SGS Quality Certificate #IVC-33829-A. Grade validated. Moisture level verified at 7.2%.",
    timestamp: "1:40 PM"
  },
  {
    id: "c5",
    orderId: "esc-781",
    sender: "System",
    text: "Cargo loaded onto Maersk Line vessel. Bill of Lading filed.",
    timestamp: "July 12, 9:00 AM"
  },
  {
    id: "c6",
    orderId: "esc-781",
    sender: "Buyer",
    text: "Perfect. Vessel arrived at Rotterdam Port. Our team is running terminal sampling. We will verify the status by Tuesday.",
    timestamp: "July 18, 4:00 PM"
  },
  // Dispute Chat logs
  {
    id: "c7",
    orderId: "esc-889",
    sender: "System",
    text: "Dispute formal challenge raised by Buyer (Tokyo Coffee Roasters Inc). Reasons logged: Moisture content excess.",
    timestamp: "July 14, 2:00 PM"
  },
  {
    id: "c8",
    orderId: "esc-889",
    sender: "Buyer",
    text: "The coffee bags arrived but smell humid. We ran a handheld moisture test which registered 16%. We cannot roast these premium beans at this rate without risking mould.",
    timestamp: "July 14, 2:15 PM"
  },
  {
    id: "c9",
    orderId: "esc-889",
    sender: "Seller",
    text: "This is impossible, our moisture level at the Addis warehouse was strictly 11.2%. We have the official export seals intact. It might have occurred during the humid container shipping in the Red Sea passage.",
    timestamp: "July 14, 3:30 PM"
  },
  {
    id: "c10",
    orderId: "esc-889",
    sender: "Ayopá Mediator",
    text: "Welcome to Ayopá Escrow Arbitration. I am reviewing the shipping log and the cargo seal declarations. We will examine if the refrigerated container seal was compromised. Let us review the carrier's logs.",
    timestamp: "July 15, 9:00 AM"
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "not-1",
    title: "Escrow Funded",
    message: "Buyer Chocolates d'Europe has funded $102,990.00 for Cocoa Beans Escrow.",
    type: "success",
    timestamp: "2 hours ago",
    read: false
  },
  {
    id: "not-2",
    title: "SGS Verification Clear",
    message: "Zambian White Maize has passed chemical safety and GMO checks. Greenlighted for departure.",
    type: "info",
    timestamp: "5 hours ago",
    read: false
  },
  {
    id: "not-3",
    title: "Arbitration Pending",
    message: "Dispute raised on coffee shipment esc-889 requires administrative review.",
    type: "warning",
    timestamp: "1 day ago",
    read: true
  }
];
