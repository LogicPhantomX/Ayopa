import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export type EmailEvent =
    | 'registration'
    | 'order_placed'
    | 'escrow_funded'
    | 'dispute_opened'
    | 'escrow_released';

export interface EmailPayload {
    to: string;
    event: EmailEvent;
    data?: Record<string, any>;
}

/**
 * Transactional email service backed by SMTP (nodemailer).
 *
 * Required env vars:
 *   EMAIL_FROM       — sender address,  e.g. noreply@ayopa.ng
 *   SMTP_HOST        — SMTP server host (e.g. smtp.sendgrid.net)
 *   SMTP_PORT        — SMTP port        (default 587)
 *   SMTP_USER        — SMTP username
 *   SMTP_PASS        — SMTP password / API key
 *
 * If SMTP_HOST is absent the service falls back to a log-only stub.
 * STUB STATUS is flagged clearly on startup.
 */
@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private readonly transporter: nodemailer.Transporter | null;
    private readonly fromAddress: string;

    constructor(private readonly configService: ConfigService) {
        this.fromAddress = this.configService.get<string>(
            'EMAIL_FROM',
            'noreply@ayopa.ng',
        );

        const smtpHost = this.configService.get<string>('SMTP_HOST');
        if (!smtpHost) {
            this.logger.warn(
                '⚠️  SMTP_HOST is not set — email delivery is STUBBED. ' +
                'Transactional emails will be logged to the console only. ' +
                'Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS before going to production.',
            );
            this.transporter = null;
            return;
        }

        this.transporter = nodemailer.createTransport({
            host: smtpHost,
            port: this.configService.get<number>('SMTP_PORT', 587),
            secure: this.configService.get<number>('SMTP_PORT', 587) === 465,
            auth: {
                user: this.configService.get<string>('SMTP_USER'),
                pass: this.configService.get<string>('SMTP_PASS'),
            },
        });
    }

    // ─── Public API ───────────────────────────────────────────────────────────────

    async sendRegistrationEmail(to: string, fullName?: string | null): Promise<void> {
        const displayName = fullName ?? 'there';
        await this.send({
            to,
            subject: 'Welcome to Aγορά Marketplace',
            html: `
                <h2>Welcome, ${displayName}!</h2>
                <p>Your account has been created successfully.</p>
                <p>You can now start buying and selling on Aγορά.</p>
                <br/><p>— The Aγορά Team</p>
            `,
            text:
                `Welcome, ${displayName}!\n\n` +
                `Your account has been created successfully.\n` +
                `You can now start buying and selling on Aγορά.\n\n` +
                `— The Aγορά Team`,
        });
    }

    async sendOrderPlacedEmail(to: string, data: {
        transactionId: string;
        listingTitle?: string;
        amount: number;
        currency?: string;
    }): Promise<void> {
        const currency = data.currency ?? 'NGN';
        const formatted = new Intl.NumberFormat('en-NG', {
            style: 'currency', currency,
        }).format(data.amount / 100);   // amount stored in kobo

        await this.send({
            to,
            subject: 'Your order has been placed — Aγορά Marketplace',
            html: `
                <h2>Order placed!</h2>
                <p>Your order <strong>${data.transactionId}</strong> has been received.</p>
                ${data.listingTitle ? `<p>Item: <strong>${data.listingTitle}</strong></p>` : ''}
                <p>Amount held in escrow: <strong>${formatted}</strong></p>
                <p>Your funds are protected until delivery is confirmed.</p>
                <br/><p>— The Aγορά Team</p>
            `,
            text:
                `Order placed!\n\n` +
                `Transaction ID: ${data.transactionId}\n` +
                (data.listingTitle ? `Item: ${data.listingTitle}\n` : '') +
                `Amount held in escrow: ${formatted}\n\n` +
                `Your funds are protected until delivery is confirmed.\n\n` +
                `— The Aγορά Team`,
        });
    }

    async sendEscrowFundedEmail(to: string, data: {
        transactionId: string;
        amount: number;
        currency?: string;
        sellerName?: string | null;
    }): Promise<void> {
        const currency = data.currency ?? 'NGN';
        const formatted = new Intl.NumberFormat('en-NG', {
            style: 'currency', currency,
        }).format(data.amount / 100);

        await this.send({
            to,
            subject: 'Escrow funded — Aγορά Marketplace',
            html: `
                <h2>Escrow funded</h2>
                <p>Transaction <strong>${data.transactionId}</strong> has been funded.</p>
                <p>Amount: <strong>${formatted}</strong></p>
                ${data.sellerName ? `<p>Buyer's payment is now held securely pending delivery.</p>` : ''}
                <p>Release the item to proceed with the transaction.</p>
                <br/><p>— The Aγορά Team</p>
            `,
            text:
                `Escrow funded\n\n` +
                `Transaction: ${data.transactionId}\n` +
                `Amount: ${formatted}\n\n` +
                `The buyer's payment is held securely. Release the item to proceed.\n\n` +
                `— The Aγορά Team`,
        });
    }

    async sendDisputeOpenedEmail(to: string, data: {
        transactionId: string;
        disputeId: string;
        reason?: string;
    }): Promise<void> {
        await this.send({
            to,
            subject: 'A dispute has been opened — Aγορά Marketplace',
            html: `
                <h2>Dispute opened</h2>
                <p>A dispute has been filed for transaction <strong>${data.transactionId}</strong>.</p>
                <p>Dispute ID: <strong>${data.disputeId}</strong></p>
                ${data.reason ? `<p>Reason: ${data.reason}</p>` : ''}
                <p>Our team will review the case. Escrow funds are frozen until resolved.</p>
                <br/><p>— The Aγορά Team</p>
            `,
            text:
                `Dispute opened\n\n` +
                `Transaction: ${data.transactionId}\n` +
                `Dispute ID: ${data.disputeId}\n` +
                (data.reason ? `Reason: ${data.reason}\n` : '') +
                `\nEscrow funds are frozen until resolved.\n\n` +
                `— The Aγορά Team`,
        });
    }

    async sendEscrowReleasedEmail(to: string, data: {
        transactionId: string;
        amount: number;
        currency?: string;
        recipientName?: string | null;
    }): Promise<void> {
        const currency = data.currency ?? 'NGN';
        const formatted = new Intl.NumberFormat('en-NG', {
            style: 'currency', currency,
        }).format(data.amount / 100);

        await this.send({
            to,
            subject: 'Escrow released — Aγορά Marketplace',
            html: `
                <h2>Escrow released</h2>
                <p>Funds for transaction <strong>${data.transactionId}</strong> have been released.</p>
                <p>Amount: <strong>${formatted}</strong></p>
                ${data.recipientName ? `<p>Paid to: <strong>${data.recipientName}</strong></p>` : ''}
                <p>Thank you for using Aγορά Marketplace.</p>
                <br/><p>— The Aγορά Team</p>
            `,
            text:
                `Escrow released\n\n` +
                `Transaction: ${data.transactionId}\n` +
                `Amount: ${formatted}\n` +
                (data.recipientName ? `Paid to: ${data.recipientName}\n` : '') +
                `\nThank you for using Aγορά Marketplace.\n\n` +
                `— The Aγορά Team`,
        });
    }

    // ─── Low-level send ───────────────────────────────────────────────────────────

    private async send(opts: {
        to: string;
        subject: string;
        html: string;
        text: string;
    }): Promise<void> {
        if (!this.transporter) {
            // Stub — log to console
            this.logger.log(
                `[EMAIL STUB] To: ${opts.to} | Subject: ${opts.subject}\n${opts.text}`,
            );
            return;
        }

        try {
            const info = await this.transporter.sendMail({
                from: this.fromAddress,
                to: opts.to,
                subject: opts.subject,
                text: opts.text,
                html: opts.html,
            });
            this.logger.log(`Email sent to ${opts.to} — messageId: ${info.messageId}`);
        } catch (err: any) {
            // Never let email failure crash a business operation.
            this.logger.error(`Failed to send email to ${opts.to}: ${err?.message}`);
        }
    }
}
