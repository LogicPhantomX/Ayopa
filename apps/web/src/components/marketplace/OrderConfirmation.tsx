/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { CheckCircle2, PackageCheck } from "lucide-react";
import { getApiClient } from "../../api/client";
import { Order } from "../../types/cart";
import { formatNaira } from "../../lib/format";

interface OrderConfirmationProps {
  orderId: string;
  onContinueShopping: () => void;
}

export default function OrderConfirmation({ orderId, onContinueShopping }: OrderConfirmationProps) {
  const api = getApiClient();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    api.orders.getById(orderId).then(setOrder);
  }, [api, orderId]);

  if (!order) return null;

  return (
    <div className="max-w-md mx-auto px-6 py-16 text-center animate-[slideUp_0.3s_ease-out]">
      <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-5" style={{ background: "var(--color-trust-100)" }}>
        <CheckCircle2 className="w-7 h-7" style={{ color: "var(--color-trust-500)" }} />
      </div>
      <h1 className="font-display font-extrabold text-2xl" style={{ color: "var(--color-ink)" }}>
        Payment secured in escrow
      </h1>
      <p className="text-sm mt-2" style={{ color: "var(--color-ink-muted)" }}>
        Order #{order.id.replace("ord-", "")} · {formatNaira(order.total)} is held safely and will only be released
        to the seller once you confirm delivery.
      </p>

      <div className="mt-6 p-4 rounded-[var(--radius-md)] border text-left space-y-2" style={{ borderColor: "var(--color-line)" }}>
        <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--color-ink)" }}>
          <PackageCheck className="w-4 h-4" style={{ color: "var(--color-brand-500)" }} />
          Estimated delivery: {order.estimatedDeliveryWindow}
        </div>
        <p className="text-[13px]" style={{ color: "var(--color-ink-muted)" }}>
          Delivering to {order.deliveryAddress.city}, {order.deliveryAddress.state}
        </p>
      </div>

      <button
        type="button"
        onClick={onContinueShopping}
        className="w-full mt-6 py-3.5 rounded-full font-semibold text-sm"
        style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}
      >
        Continue browsing
      </button>
    </div>
  );
}
