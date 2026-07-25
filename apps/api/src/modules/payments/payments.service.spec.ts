import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService } from '../audit/audit.service';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Payment } from './entities/payment.entity';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
    let service: PaymentsService;
    let paymentRepository: { create: jest.Mock; save: jest.Mock; findOne: jest.Mock };
    let transactionRepository: { findOne: jest.Mock };
    let auditService: { log: jest.Mock };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentsService,
                {
                    provide: getRepositoryToken(Payment),
                    useValue: {
                        create: jest.fn(),
                        save: jest.fn(),
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(Transaction),
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: AuditService,
                    useValue: {
                        log: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<PaymentsService>(PaymentsService);
        paymentRepository = module.get(getRepositoryToken(Payment));
        transactionRepository = module.get(getRepositoryToken(Transaction));
        auditService = module.get(AuditService);
    });

    it('rejects non-positive payment amounts', async () => {
        transactionRepository.findOne.mockResolvedValue({ id: 'tx-1', buyerId: 'buyer-1' });

        await expect(service.create({ transactionId: 'tx-1', amount: 0 } as any)).rejects.toThrow(BadRequestException);
        expect(auditService.log).not.toHaveBeenCalled();
    });
});
