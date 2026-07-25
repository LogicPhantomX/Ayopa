/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type NetworkState = "High-Speed" | "Low-Speed" | "Offline";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "success" | "info" | "warning" | "error";
  timestamp: string;
  read: boolean;
}
