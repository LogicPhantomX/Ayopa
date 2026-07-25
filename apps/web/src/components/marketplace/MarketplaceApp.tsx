/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { getApiClient } from "../../api/client";
import { BackendUser, Listing } from "../../types/backend";
import { useCart } from "../../hooks/useCart";
import MarketHeader from "./MarketHeader";
import Home from "./Home";
import ListingDetail from "./ListingDetail";
import CartSheet from "./CartSheet";
import Checkout from "./Checkout";
import PaymentCallback from "./PaymentCallback";
import OrdersHistory from "./OrdersHistory";

type Screen =
  | { name: "home" }
  | { name: "listing"; listing: Listing }
  | { name: "checkout" }
  | { name: "orders" }
  | { name: "payment-callback"; reference: string };

function detectInitialScreen(): Screen {
  const params = new URLSearchParams(window.location.search);
  const reference = params.get("reference") ?? params.get("trxref");
  if (reference) return { name: "payment-callback", reference };
  return { name: "home" };
}

export default function MarketplaceApp() {
  const api = getApiClient();
  const [screen, setScreen] = useState<Screen>(detectInitialScreen);
  const [query, setQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [user, setUser] = useState<BackendUser | null>(null);

  const cart = useCart();

  useEffect(() => {
    api.auth.me().then(setUser);
  }, [api]);

  const handleSelectListing = (listing: Listing) => {
    setScreen({ name: "listing", listing });
    window.scrollTo({ top: 0 });
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    setScreen({ name: "checkout" });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-paper)" }}>
      <MarketHeader
        query={query}
        onQueryChange={(q) => {
          setQuery(q);
          if (screen.name !== "home") setScreen({ name: "home" });
        }}
        itemCount={cart.itemCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenOrders={() => setScreen({ name: "orders" })}
        user={user}
      />

      <main className="flex-1">
        {screen.name === "home" && <Home query={query} onSelectListing={handleSelectListing} />}

        {screen.name === "listing" && (
          <ListingDetail
            listing={screen.listing}
            onBack={() => setScreen({ name: "home" })}
            onAddToCart={(listing, quantity) => cart.addItem(listing, quantity)}
            onGoToCart={() => setIsCartOpen(true)}
          />
        )}

        {screen.name === "checkout" && (
          <Checkout
            user={user}
            activeLines={cart.activeLines}
            subtotal={cart.subtotal}
            onAuthenticated={(result) => setUser(result.user)}
            onProfileComplete={(updated) => setUser(updated)}
            onBack={() => setScreen({ name: "home" })}
          />
        )}

        {screen.name === "orders" && user && (
          <OrdersHistory currentUserId={user.id} onBack={() => setScreen({ name: "home" })} />
        )}

        {screen.name === "payment-callback" && (
          <PaymentCallback reference={screen.reference} onDone={() => setScreen({ name: "home" })} />
        )}
      </main>

      <CartSheet
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        activeLines={cart.activeLines}
        savedLines={cart.savedLines}
        subtotal={cart.subtotal}
        onUpdateQuantity={cart.updateQuantity}
        onRemove={cart.removeItem}
        onSaveForLater={cart.saveForLater}
        onMoveToCart={cart.moveToCart}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
