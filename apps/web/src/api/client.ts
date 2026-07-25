/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiClient } from "./types";
import { createMockApiClient } from "./mockAdapter";
import { createLiveApiClient } from "./liveAdapter";

export type { ApiClient } from "./types";
export { ApiError } from "./types";

// Defaults to the real backend now. Set VITE_API_MODE=mock in .env.local if
// you want to work on the UI without the NestJS server running.
const MODE = import.meta.env.VITE_API_MODE ?? "live";

let instance: ApiClient | null = null;

export function getApiClient(): ApiClient {
  if (!instance) {
    instance = MODE === "mock" ? createMockApiClient() : createLiveApiClient();
  }
  return instance;
}
