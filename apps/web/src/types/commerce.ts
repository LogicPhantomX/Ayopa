/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CommodityGrade = "Grade A" | "Premium" | "Export Quality" | "Standard Grade";

export interface CommodityProduct {
  id: string;
  name: string;
  category: "Agriculture" | "Minerals" | "Textiles" | "Processed Goods";
  origin: string;
  grade: CommodityGrade;
  certification: string; // e.g., "SGS Certified", "Fairtrade & FDA Approved"
  pricePerTon: number;
  minOrderQuantity: number; // in Metric Tons
  availableStock: number; // in Metric Tons
  sellerId: string;
  sellerName: string;
  sellerRating: number;
  description: string;
  imageColor: string; // Tailwind color class for premium stylized background
}

export type EscrowStatus =
  | "Awaiting Funding"
  | "Funds Secured"
  | "Dispatched"
  | "Under Inspection"
  | "Disputed"
  | "Funds Released"
  | "Funds Refunded";

export interface EscrowOrder {
  id: string;
  productId: string;
  productName: string;
  buyerName: string;
  sellerName: string;
  quantity: number; // in Metric Tons
  unitPrice: number;
  totalValue: number;
  escrowFee: number; // 0.5%
  logisticsFee: number;
  totalAmount: number;
  status: EscrowStatus;
  origin: string;
  destination: string;
  trackingNumber?: string;
  carrier?: string;
  createdAt: string;
  disputeReason?: string;
  disputeNotes?: string;
  disputeRuling?: "Seller" | "Buyer" | null;
}
