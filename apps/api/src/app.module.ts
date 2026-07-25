import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { HealthController } from './health/health.controller';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { EmailModule } from './modules/email/email.module';
import { EscrowModule } from './modules/escrow/escrow.module';
import { KycModule } from './modules/kyc/kyc.module';
import { ListingsModule } from './modules/listings/listings.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PayoutsModule } from './modules/payouts/payouts.module';
import { PaystackModule } from './modules/paystack/paystack.module';
import { SmsModule } from './modules/sms/sms.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { UsersModule } from './modules/users/users.module';

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Three named throttler tiers:
//   'default' — baseline for all routes          (100 req / 60 s per IP)
//   'auth'    — regular auth endpoints            (20  req / 60 s per IP)
//   'otp'     — OTP request/verify and login      (5   req / 60 s per IP)

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', '.env.local'],
        }),
        ThrottlerModule.forRoot([
            {
                name: 'default',
                ttl: 60_000,
                limit: 1000,
            },
            {
                name: 'auth',
                ttl: 60_000,
                limit: 20,
            },
            {
                name: 'otp',
                ttl: 60_000,
                limit: 5,
            },
        ]),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => getDatabaseConfig(configService),
        }),
        AuthModule,
        UsersModule,
        ListingsModule,
        TransactionsModule,
        PaymentsModule,
        PaystackModule,
        EscrowModule,
        DisputesModule,
        KycModule,
        AuditModule,
        SmsModule,
        EmailModule,
        PayoutsModule,
    ],
    controllers: [HealthController],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule { }
