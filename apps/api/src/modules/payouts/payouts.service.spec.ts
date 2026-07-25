import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService } from '../audit/audit.service';
import { PaystackService } from '../paystack/paystack.service';
import { PayoutApproval } from './entities/payout-approval.entity';
import { PayoutRequest } from './entities/payout-request.entity';
import { PayoutsService } from './payouts.service';

const mockPaystackService = {
    initiateTransfer: jest.fn(),
};

const mockAuditService = {
    log: jest.fn().mockResolvedValue({}),
};

describe('PayoutsService', () => {
    let service: PayoutsService;
    let payoutRequestRepo: any;
    let payoutApprovalRepo: any;

    beforeEach(async () => {
        jest.clearAllMocks();

        payoutRequestRepo = {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn().mockResolvedValue([]),
        };

        payoutApprovalRepo = {
            create: jest.fn(),
            save: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PayoutsService,
                { provide: getRepositoryToken(PayoutRequest), useValue: payoutRequestRepo },
                { provide: getRepositoryToken(PayoutApproval), useValue: payoutApprovalRepo },
                { provide: PaystackService, useValue: mockPaystackService },
                { provide: AuditService, useValue: mockAuditService },
            ],
        }).compile();

        service = module.get<PayoutsService>(PayoutsService);
    });

    // ─── createPayoutRequest ─────────────────────────────────────────────────────

    describe('createPayoutRequest', () => {
        it('executes small payouts directly via Paystack (≤ ₦500,000)', async () => {
            mockPaystackService.initiateTransfer.mockResolvedValue({
                status: 'success',
                transfer_code: 'TRF_abc',
                amount: 10_000_000,
            });

            const result = await service.createPayoutRequest('admin-1', {
                recipientCode: 'RCP_123',
                amount: 10_000_000, // ₦100,000
                reason: 'test payout',
            });

            expect(mockPaystackService.initiateTransfer).toHaveBeenCalledWith({
                amount: 10_000_000,
                recipient: 'RCP_123',
                reason: 'test payout',
            });
            expect(result.message).toContain('directly');
        });

        it('creates a payout request for large amounts (> ₦500,000) without executing', async () => {
            const savedRequest = {
                id: 'pr-1',
                status: 'pending',
                amount: 100_000_000,
                recipientCode: 'RCP_456',
                reason: 'large payout',
                requestedBy: 'admin-1',
                approvals: [],
            };
            payoutRequestRepo.create.mockReturnValue(savedRequest);
            payoutRequestRepo.save.mockResolvedValue(savedRequest);

            const result = await service.createPayoutRequest('admin-1', {
                recipientCode: 'RCP_456',
                amount: 100_000_000, // ₦1,000,000
                reason: 'large payout',
            });

            expect(mockPaystackService.initiateTransfer).not.toHaveBeenCalled();
            expect(result.message).toContain('two distinct admin approvals');
        });
    });

    // ─── approvePayout ───────────────────────────────────────────────────────────

    describe('approvePayout', () => {
        const pendingRequest = (overrides = {}) => ({
            id: 'pr-1',
            status: 'pending',
            amount: 100_000_000,
            recipientCode: 'RCP_456',
            reason: 'large payout',
            approvals: [],
            ...overrides,
        });

        it('records the first approval and waits for a second', async () => {
            const req = pendingRequest();
            payoutRequestRepo.findOne
                .mockResolvedValueOnce(req)    // initial load
                .mockResolvedValueOnce({ ...req, approvals: [{ approvedBy: 'admin-1' }] }); // reload after save

            const approval = { id: 'ap-1', payoutRequestId: 'pr-1', approvedBy: 'admin-1' };
            payoutApprovalRepo.create.mockReturnValue(approval);
            payoutApprovalRepo.save.mockResolvedValue(approval);

            const result = await service.approvePayout('pr-1', 'admin-1', {});

            expect(result.message).toContain('1/2');
            expect(mockPaystackService.initiateTransfer).not.toHaveBeenCalled();
        });

        it('executes transfer after second distinct admin approval', async () => {
            const firstApproval = { approvedBy: 'admin-1' };
            const req = pendingRequest({ approvals: [] });
            const reqWithOne = { ...req, approvals: [firstApproval] };
            const reqWithTwo = {
                ...req,
                approvals: [firstApproval, { approvedBy: 'admin-2' }],
            };

            payoutRequestRepo.findOne
                .mockResolvedValueOnce(req)        // first load (admin-2 approving)
                .mockResolvedValueOnce(reqWithTwo); // reload after approval saved

            payoutApprovalRepo.create.mockReturnValue({ approvedBy: 'admin-2' });
            payoutApprovalRepo.save.mockResolvedValue({ approvedBy: 'admin-2' });
            payoutRequestRepo.save.mockResolvedValue({ ...reqWithTwo, status: 'completed', transferCode: 'TRF_xyz' });

            mockPaystackService.initiateTransfer.mockResolvedValue({
                status: 'success',
                transfer_code: 'TRF_xyz',
                amount: 100_000_000,
            });

            const result = await service.approvePayout('pr-1', 'admin-2', {});

            expect(mockPaystackService.initiateTransfer).toHaveBeenCalledWith({
                amount: 100_000_000,
                recipient: 'RCP_456',
                reason: 'large payout',
            });
            expect(result.message).toContain('Both approvals');
        });

        it('rejects if the same admin tries to approve twice', async () => {
            const req = pendingRequest({
                approvals: [{ approvedBy: 'admin-1' }],
            });
            payoutRequestRepo.findOne.mockResolvedValue(req);

            await expect(service.approvePayout('pr-1', 'admin-1', {}))
                .rejects.toThrow(ForbiddenException);
        });

        it('rejects approval on a non-pending request', async () => {
            const req = pendingRequest({ status: 'completed' });
            payoutRequestRepo.findOne.mockResolvedValue(req);

            await expect(service.approvePayout('pr-1', 'admin-2', {}))
                .rejects.toThrow(BadRequestException);
        });

        it('logs each approval to the audit log', async () => {
            const req = pendingRequest();
            payoutRequestRepo.findOne
                .mockResolvedValueOnce(req)
                .mockResolvedValueOnce({ ...req, approvals: [{ approvedBy: 'admin-1' }] });

            payoutApprovalRepo.create.mockReturnValue({ approvedBy: 'admin-1' });
            payoutApprovalRepo.save.mockResolvedValue({ approvedBy: 'admin-1' });

            await service.approvePayout('pr-1', 'admin-1', { comment: 'Looks good' });

            expect(mockAuditService.log).toHaveBeenCalledWith(
                'payout',
                'approved',
                'admin-1',
                expect.objectContaining({ payoutRequestId: 'pr-1' }),
            );
        });
    });

    // ─── rejectPayout ────────────────────────────────────────────────────────────

    describe('rejectPayout', () => {
        it('marks a pending request as rejected', async () => {
            const req = { id: 'pr-1', status: 'pending', approvals: [] };
            payoutRequestRepo.findOne.mockResolvedValue(req);
            payoutRequestRepo.save.mockResolvedValue({ ...req, status: 'rejected' });

            const result = await service.rejectPayout('pr-1', 'admin-1', 'insufficient docs');

            expect(result.status).toBe('rejected');
            expect(mockAuditService.log).toHaveBeenCalledWith(
                'payout', 'rejected', 'admin-1', expect.objectContaining({ payoutRequestId: 'pr-1' }),
            );
        });

        it('cannot reject an already-completed request', async () => {
            const req = { id: 'pr-1', status: 'completed', approvals: [] };
            payoutRequestRepo.findOne.mockResolvedValue(req);

            await expect(service.rejectPayout('pr-1', 'admin-1'))
                .rejects.toThrow(BadRequestException);
        });
    });
});
