/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// The backend has no image upload/storage for listings — CreateListingDto has
// no photo field, no S3/OCI module is wired to listings. Rather than fake a
// photo, every listing gets a deterministic, tasteful gradient card so the
// grid still reads as a real catalog. This is clearly a placeholder, not a
// simulated photo.

const GRADIENTS = [
  "from-amber-700 to-stone-900",
  "from-stone-600 to-stone-900",
  "from-orange-700 to-stone-900",
  "from-amber-500 to-orange-800",
  "from-cyan-700 to-slate-900",
  "from-teal-700 to-slate-900",
  "from-stone-500 to-stone-800",
  "from-amber-800 to-orange-950",
];

export function gradientForListing(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}
