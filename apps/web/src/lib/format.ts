/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export function formatNaira(amount: number): string {
  return nairaFormatter.format(amount);
}

export function formatUnit(unit: string, quantity: number): string {
  if (unit === "kg") return "kg";
  if (unit === "service") return quantity === 1 ? "visit" : "visits";
  return quantity === 1 ? "head" : "head";
}
