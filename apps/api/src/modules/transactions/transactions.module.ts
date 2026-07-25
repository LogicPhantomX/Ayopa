import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';
import { EscrowEvent } from '../escrow/entities/escrow-event.entity';
import { EscrowService } from '../escrow/escrow.service';
import { Listing } from '../listings/entities/listing.entity';
import { Transaction } from './entities/transaction.entity';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';


@Module({
    imports: [
        TypeOrmModule.forFeature([Transaction, EscrowEvent, Listing]),
        AuditModule,
        EmailModule,
    ],
    controllers: [TransactionsController],
    providers: [TransactionsService, EscrowService],
    exports: [TransactionsService, EscrowService],
})
export class TransactionsModule { }
