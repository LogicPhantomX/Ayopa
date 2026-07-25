import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as crypto from 'crypto';
import { PaystackService } from './paystack.service';

describe('PaystackService', () => {
    let service: PaystackService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaystackService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string, defaultValue?: string) => {
                            if (key === 'PAYSTACK_SECRET_KEY') return 'test_secret';
                            return defaultValue;
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<PaystackService>(PaystackService);
    });

    // ─── verifyWebhookSignature ───────────────────────────────────────────────────

    describe('verifyWebhookSignature', () => {
        it('returns true for valid signature', () => {
            const payload = { event: 'test.event', data: { id: 1 } };
            const payloadString = JSON.stringify(payload);
            const signature = crypto
                .createHmac('sha512', 'test_secret')
                .update(payloadString)
                .digest('hex');

            const result = service.verifyWebhookSignature(signature, payload);
            expect(result).toBe(true);
        });

        it('returns false for tampered payload', () => {
            const payload = { event: 'test.event', data: { id: 1 } };
            const tamperedPayload = { event: 'test.event', data: { id: 2 } };
            const signature = crypto
                .createHmac('sha512', 'test_secret')
                .update(JSON.stringify(payload))
                .digest('hex');

            const result = service.verifyWebhookSignature(signature, tamperedPayload);
            expect(result).toBe(false);
        });

        it('returns false for missing signature', () => {
            expect(service.verifyWebhookSignature('', { event: 'x' })).toBe(false);
        });
    });

    // ─── initializeTransaction ────────────────────────────────────────────────────

    describe('initializeTransaction', () => {
        it('calls Paystack API and returns authorization_url', async () => {
            const mockResponse = {
                status: true,
                data: {
                    authorization_url: 'https://checkout.paystack.com/abc',
                    access_code: 'access_abc',
                    reference: 'ref_abc',
                },
            };

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: jest.fn().mockResolvedValue(mockResponse),
            }) as any;

            const result = await service.initializeTransaction({
                email: 'buyer@example.com',
                amount: 100_000,
            });

            expect(result.authorization_url).toBe('https://checkout.paystack.com/abc');
            expect(result.reference).toBe('ref_abc');
        });

        it('throws BadRequestException when Paystack returns an error', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 400,
                json: jest.fn().mockResolvedValue({
                    status: false,
                    message: 'Invalid key',
                }),
            }) as any;

            await expect(
                service.initializeTransaction({ email: 'x@y.com', amount: 1000 }),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // ─── verifyTransaction ────────────────────────────────────────────────────────

    describe('verifyTransaction', () => {
        it('returns verified transaction data', async () => {
            const mockResponse = {
                status: true,
                data: {
                    status: 'success',
                    reference: 'ref_123',
                    amount: 50_000,
                    currency: 'NGN',
                    metadata: {},
                    gateway_response: 'Approved',
                },
            };

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: jest.fn().mockResolvedValue(mockResponse),
            }) as any;

            const result = await service.verifyTransaction('ref_123');

            expect(result.status).toBe('success');
            expect(result.reference).toBe('ref_123');
            expect(result.amount).toBe(50_000);
        });
    });

    // ─── createTransferRecipient ──────────────────────────────────────────────────

    describe('createTransferRecipient', () => {
        it('returns recipient_code from Paystack', async () => {
            const mockResponse = {
                status: true,
                data: {
                    recipient_code: 'RCP_abc123',
                    type: 'nuban',
                    name: 'John Doe',
                    details: {
                        account_number: '0123456789',
                        bank_code: '058',
                    },
                },
            };

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: jest.fn().mockResolvedValue(mockResponse),
            }) as any;

            const result = await service.createTransferRecipient({
                name: 'John Doe',
                accountNumber: '0123456789',
                bankCode: '058',
            });

            expect(result.recipient_code).toBe('RCP_abc123');
            expect(result.account_number).toBe('0123456789');
        });
    });

    // ─── initiateTransfer ─────────────────────────────────────────────────────────

    describe('initiateTransfer', () => {
        it('initiates a transfer and returns transfer_code', async () => {
            const mockResponse = {
                status: true,
                data: {
                    status: 'success',
                    transfer_code: 'TRF_abc',
                    amount: 10_000_000,
                },
            };

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: jest.fn().mockResolvedValue(mockResponse),
            }) as any;

            const result = await service.initiateTransfer({
                amount: 10_000_000,
                recipient: 'RCP_123',
                reason: 'Seller payout',
            });

            expect(result.status).toBe('success');
            expect(result.transfer_code).toBe('TRF_abc');
        });
    });

    // ─── listBanks ───────────────────────────────────────────────────────────────

    describe('listBanks', () => {
        it('returns list of banks', async () => {
            const mockResponse = {
                status: true,
                data: [
                    { name: 'Guaranty Trust Bank', code: '058', slug: 'gtbank', country: 'Nigeria', currency: 'NGN' },
                    { name: 'Access Bank', code: '044', slug: 'access-bank', country: 'Nigeria', currency: 'NGN' },
                ],
            };

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: jest.fn().mockResolvedValue(mockResponse),
            }) as any;

            const result = await service.listBanks();

            expect(result).toHaveLength(2);
            expect(result[0].code).toBe('058');
            expect(result[1].name).toBe('Access Bank');
        });
    });
});
