import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { EscrowModule } from '../escrow/escrow.module';
import { Payment } from '../payments/entities/payment.entity';
import { PaymentsModule } from '../payments/payments.module';
import { Transaction } from '../transactions/entities/transaction.entity';
import { PaystackController } from './paystack.controller';
import { PaystackService } from './paystack.service';
import { WebhookController } from './webhook.controller';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([Payment, Transaction]),
        AuditModule,
        PaymentsModule,   // provides PaymentsService to WebhookController
        EscrowModule,     // provides EscrowService to WebhookController
    ],
    controllers: [PaystackController, WebhookController],
    providers: [PaystackService],
    exports: [PaystackService],
})
export class PaystackModule { }
