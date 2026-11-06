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
import DemoApp, { DemoRoute } from "./components/demo/DemoApp";

export default function App() {
  const [route, setRoute] = useState<DemoRoute>("marketplace");

  return (
    <DemoApp route={route} onRouteChange={setRoute} />
  );
}
