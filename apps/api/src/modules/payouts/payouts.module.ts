import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { PaystackModule } from '../paystack/paystack.module';
import { PayoutApproval } from './entities/payout-approval.entity';
import { PayoutRequest } from './entities/payout-request.entity';
import { PayoutsController } from './payouts.controller';
import { PayoutsService } from './payouts.service';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([PayoutRequest, PayoutApproval]),
        PaystackModule,
        AuditModule,
    ],
    controllers: [PayoutsController],
    providers: [PayoutsService],
    exports: [PayoutsService],
})
export class PayoutsModule {}
