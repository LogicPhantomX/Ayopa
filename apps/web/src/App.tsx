/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Ayopá — livestock commerce.
//
// Three workspaces, all against the real backend:
//   - Marketplace (buyer browse → listing → cart → checkout) — anonymous
//     browsing, OTP login only at checkout.
//   - Sell on Ayopá (seller) — OTP login, listing CRUD, sales, KYC, disputes.
//   - Staff Admin — separate email+password+TOTP login for admin/super_admin
//     staff accounts; users, payouts, deleted-listing review.
//
// TopNav switches between them; each workspace manages its own auth gate.
import React, { useState } from "react";
import MarketplaceApp from "./components/marketplace/MarketplaceApp";
import SellerPortal from "./components/seller/SellerPortal";
import AdminPortal from "./components/admin/AdminPortal";
import TopNav, { Route } from "./components/layout/TopNav";

export default function App() {
  const [route, setRoute] = useState<Route>("marketplace");

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-paper)" }}>
      <TopNav route={route} onChange={setRoute} />
      <div className="flex-1">
        {route === "marketplace" && <MarketplaceApp />}
        {route === "seller" && <SellerPortal />}
        {route === "admin" && <AdminPortal />}
      </div>
    </div>
  );
}
