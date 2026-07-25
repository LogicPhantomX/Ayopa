/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ChatMessage {
  id: string;
  orderId: string;
  sender: "Buyer" | "Seller" | "Ayopá Mediator" | "System";
  text: string;
  timestamp: string;
}
