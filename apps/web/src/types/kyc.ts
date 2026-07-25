/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SellerKYC {
  status: "Unverified" | "Pending" | "Verified" | "Rejected";
  companyName: string;
  registrationNumber: string;
  taxId: string;
  country: string;
  licenseDocumentName: string;
  bankAccount: string;
}
