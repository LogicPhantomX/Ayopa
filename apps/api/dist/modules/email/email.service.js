"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
let EmailService = EmailService_1 = class EmailService {
    configService;
    logger = new common_1.Logger(EmailService_1.name);
    transporter;
    fromAddress;
    constructor(configService) {
        this.configService = configService;
        this.fromAddress = this.configService.get('EMAIL_FROM', 'noreply@ayopa.ng');
        const smtpHost = this.configService.get('SMTP_HOST');
        if (!smtpHost) {
            this.logger.warn('⚠️  SMTP_HOST is not set — email delivery is STUBBED. ' +
                'Transactional emails will be logged to the console only. ' +
                'Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS before going to production.');
            this.transporter = null;
            return;
        }
        this.transporter = nodemailer.createTransport({
            host: smtpHost,
            port: this.configService.get('SMTP_PORT', 587),
            secure: this.configService.get('SMTP_PORT', 587) === 465,
            auth: {
                user: this.configService.get('SMTP_USER'),
                pass: this.configService.get('SMTP_PASS'),
            },
        });
    }
    async sendRegistrationEmail(to, fullName) {
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
            text: `Welcome, ${displayName}!\n\n` +
                `Your account has been created successfully.\n` +
                `You can now start buying and selling on Aγορά.\n\n` +
                `— The Aγορά Team`,
        });
    }
    async sendOrderPlacedEmail(to, data) {
        const currency = data.currency ?? 'NGN';
        const formatted = new Intl.NumberFormat('en-NG', {
            style: 'currency', currency,
        }).format(data.amount / 100);
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
            text: `Order placed!\n\n` +
                `Transaction ID: ${data.transactionId}\n` +
                (data.listingTitle ? `Item: ${data.listingTitle}\n` : '') +
                `Amount held in escrow: ${formatted}\n\n` +
                `Your funds are protected until delivery is confirmed.\n\n` +
                `— The Aγορά Team`,
        });
    }
    async sendEscrowFundedEmail(to, data) {
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
            text: `Escrow funded\n\n` +
                `Transaction: ${data.transactionId}\n` +
                `Amount: ${formatted}\n\n` +
                `The buyer's payment is held securely. Release the item to proceed.\n\n` +
                `— The Aγορά Team`,
        });
    }
    async sendDisputeOpenedEmail(to, data) {
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
            text: `Dispute opened\n\n` +
                `Transaction: ${data.transactionId}\n` +
                `Dispute ID: ${data.disputeId}\n` +
                (data.reason ? `Reason: ${data.reason}\n` : '') +
                `\nEscrow funds are frozen until resolved.\n\n` +
                `— The Aγορά Team`,
        });
    }
    async sendEscrowReleasedEmail(to, data) {
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
            text: `Escrow released\n\n` +
                `Transaction: ${data.transactionId}\n` +
                `Amount: ${formatted}\n` +
                (data.recipientName ? `Paid to: ${data.recipientName}\n` : '') +
                `\nThank you for using Aγορά Marketplace.\n\n` +
                `— The Aγορά Team`,
        });
    }
    async send(opts) {
        if (!this.transporter) {
            this.logger.log(`[EMAIL STUB] To: ${opts.to} | Subject: ${opts.subject}\n${opts.text}`);
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
        }
        catch (err) {
            this.logger.error(`Failed to send email to ${opts.to}: ${err?.message}`);
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map