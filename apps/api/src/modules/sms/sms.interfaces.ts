/**
 * Provider-agnostic SMS interface.
 * Swap out the concrete implementation (TermiiSmsProvider, TwilioSmsProvider, etc.)
 * without touching the callers.
 */
export interface ISmsProvider {
    /**
     * Send a plain-text SMS message.
     * @param to      E.164 phone number (e.g. +2348012345678)
     * @param message Message body (keep under 160 chars for a single SMS segment)
     */
    send(to: string, message: string): Promise<{ messageId: string }>;
}
