import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';
import { Transaction } from '../transactions/entities/transaction.entity';
import { EscrowController } from './escrow.controller';
import { EscrowEvent } from './entities/escrow-event.entity';
import { EscrowService } from './escrow.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([EscrowEvent, Transaction]),
        AuditModule,
        EmailModule,    // provides EmailService for escrow state change notifications
    ],
    controllers: [EscrowController],
    providers: [EscrowService],
    exports: [EscrowService],
})
export class EscrowModule {}
