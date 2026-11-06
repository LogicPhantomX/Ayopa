"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const typeorm_1 = require("@nestjs/typeorm");
const database_config_1 = require("./config/database.config");
const health_controller_1 = require("./health/health.controller");
const audit_module_1 = require("./modules/audit/audit.module");
const auth_module_1 = require("./modules/auth/auth.module");
const disputes_module_1 = require("./modules/disputes/disputes.module");
const email_module_1 = require("./modules/email/email.module");
const escrow_module_1 = require("./modules/escrow/escrow.module");
const kyc_module_1 = require("./modules/kyc/kyc.module");
const listings_module_1 = require("./modules/listings/listings.module");
const payments_module_1 = require("./modules/payments/payments.module");
const payouts_module_1 = require("./modules/payouts/payouts.module");
const paystack_module_1 = require("./modules/paystack/paystack.module");
const sms_module_1 = require("./modules/sms/sms.module");
const transactions_module_1 = require("./modules/transactions/transactions.module");
const users_module_1 = require("./modules/users/users.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env', '.env.local'],
            }),
            throttler_1.ThrottlerModule.forRoot([
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
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => (0, database_config_1.getDatabaseConfig)(configService),
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            listings_module_1.ListingsModule,
            transactions_module_1.TransactionsModule,
            payments_module_1.PaymentsModule,
            paystack_module_1.PaystackModule,
            escrow_module_1.EscrowModule,
            disputes_module_1.DisputesModule,
            kyc_module_1.KycModule,
            audit_module_1.AuditModule,
            sms_module_1.SmsModule,
            email_module_1.EmailModule,
            payouts_module_1.PayoutsModule,
        ],
        controllers: [health_controller_1.HealthController],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map