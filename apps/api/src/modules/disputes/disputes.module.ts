import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';
import { EscrowModule } from '../escrow/escrow.module';
import { Transaction } from '../transactions/entities/transaction.entity';
import { DisputesController } from './disputes.controller';
import { DisputesService } from './disputes.service';
import { Dispute } from './entities/dispute.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Dispute, Transaction]),
        EscrowModule,    // provides EscrowService
        AuditModule,     // provides AuditService
        EmailModule,     // provides EmailService for dispute notifications
    ],
    controllers: [DisputesController],
    providers: [DisputesService],
    exports: [DisputesService],
})
export class DisputesModule {}
