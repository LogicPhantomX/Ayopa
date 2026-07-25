import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ISmsProvider } from './sms.interfaces';

/**
 * Termii SMS provider (https://termii.com) — primary choice for Nigerian numbers.
 *
 * Required env vars:
 *   SMS_API_KEY   — Termii API key
 *   SMS_SENDER_ID — Sender ID registered on Termii dashboard (default: "Agora")
 *
 * If SMS_API_KEY is absent the service falls back to a log-only stub so the
 * rest of the application can still start. Flag is clearly surfaced at startup.
 *
 * Termii API reference: https://developers.termii.com/messaging
 */
@Injectable()
export class SmsService implements ISmsProvider {
    private readonly logger = new Logger(SmsService.name);
    private readonly apiKey: string | undefined;
    private readonly senderId: string;
    private readonly termiiBase = 'https://api.ng.termii.com/api';

    constructor(private readonly configService: ConfigService) {
        this.apiKey = this.configService.get<string>('SMS_API_KEY');
        this.senderId = this.configService.get<string>('SMS_SENDER_ID', 'Agora');

        if (!this.apiKey) {
            this.logger.warn(
                '⚠️  SMS_API_KEY is not set — SMS delivery is STUBBED. ' +
                'OTP codes will be logged to the console only. ' +
                'Set SMS_API_KEY (Termii) before going to production.',
            );
        }
    }

    /**
     * Send an SMS via Termii.
     * Falls back to console log when SMS_API_KEY is absent.
     */
    async send(to: string, message: string): Promise<{ messageId: string }> {
        if (!this.apiKey) {
            // Stub — no credential available
            this.logger.log(`[SMS STUB] To: ${to} | Message: ${message}`);
            return { messageId: `stub-${Date.now()}` };
        }

        const body = {
            to,
            from: this.senderId,
            sms: message,
            type: 'plain',
            channel: 'dnd',       // DND channel reaches all Nigerian numbers
            api_key: this.apiKey,
        };

        let response: Response;
        try {
            response = await fetch(`${this.termiiBase}/sms/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
        } catch (networkErr: any) {
            this.logger.error(`Termii network error: ${networkErr?.message}`);
            // Degrade gracefully — OTP is already stored; delivery will be retried by the user.
            return { messageId: `error-${Date.now()}` };
        }

        let json: any;
        try {
            json = await response.json();
        } catch {
            this.logger.error('Termii returned an unparseable response');
            return { messageId: `error-${Date.now()}` };
        }

        const messageId: string = json?.message_id ?? json?.messageId ?? `term-${Date.now()}`;
        this.logger.log(`SMS sent to ${to} — messageId: ${messageId}`);
        return { messageId };
    }

    /**
     * Convenience helper for OTP messages.
     */
    async sendOtp(phone: string, code: string, expiresInMinutes = 5): Promise<void> {
        const message =
            `Your Agora verification code is ${code}. ` +
            `It expires in ${expiresInMinutes} minutes. Do not share it with anyone.`;
        await this.send(phone, message);
    }
}
