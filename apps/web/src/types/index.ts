/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Barrel file — every domain type lives in its own file under src/types/,
// grouped by responsibility (commerce, chat, kyc, auth, notifications).
// Import from "../types" (or "../../types") anywhere in the app.

// Legacy commodity-export types — kept only so the not-yet-rebuilt
// Seller/Admin workspaces still compile. Not used anywhere in the buyer flow.
export * from "./commerce";

export * from "./chat";
export * from "./kyc";
export * from "./auth";
export * from "./notifications";

// Real backend contract (apps/api/src/modules/**/entities) lives in
// ./backend.ts and is imported directly by src/components/marketplace/** —
// not re-exported here, since UserRole/EscrowStatus collide with the legacy
// commodity types above.
