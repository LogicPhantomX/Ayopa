/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Listing } from "./listing";

export interface CartItem {
  id: string; // cart item id (distinct from listing id)
  listing: Listing;
  quantity: number;
  savedForLater: boolean;
  addedAt: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  updatedAt: string;
}

export interface DeliveryAddress {
  id: string;
  label: string; // "Home", "Farm gate", etc.
  fullName: string;
  phone: string;
  state: string;
  city: string;
  streetAddress: string;
  isDefault?: boolean;
}

export type PaymentMethod = "card" | "bank_transfer" | "ussd";

export type OrderStatus =
  | "Awaiting Payment"
  | "Funds Secured"
  | "Preparing Delivery"
  | "Out for Delivery"
  | "Delivered"
  | "Disputed"
  | "Funds Released"
  | "Cancelled";

export interface OrderLineItem {
  listingId: string;
  title: string;
  quantity: number;
  unitPrice: number;
  unit: string;
}

export interface Order {
  id: string;
  items: OrderLineItem[];
  subtotal: number;
  escrowFee: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  deliveryAddress: DeliveryAddress;
  paymentMethod: PaymentMethod;
  createdAt: string;
  estimatedDeliveryWindow?: string;
}
