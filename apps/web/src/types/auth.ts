/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "buyer" | "seller" | "admin";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  companyName?: string;
  country?: string;
  createdAt: string;
}
