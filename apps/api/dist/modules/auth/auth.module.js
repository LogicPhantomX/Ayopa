"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const email_module_1 = require("../email/email.module");
const sms_module_1 = require("../sms/sms.module");
const user_entity_1 = require("../users/entities/user.entity");
const admin_auth_controller_1 = require("./admin-auth.controller");
const admin_auth_service_1 = require("./admin-auth.service");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const otp_store_1 = require("./otp-store");
const refresh_token_store_1 = require("./refresh-token-store");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User]),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    privateKey: configService
                        .get('JWT_PRIVATE_KEY', '')
                        .replace(/\\n/g, '\n'),
                    publicKey: configService
                        .get('JWT_PUBLIC_KEY', '')
                        .replace(/\\n/g, '\n'),
                    signOptions: {
                        algorithm: 'RS256',
                        expiresIn: configService.get('JWT_TTL', '15m'),
                    },
                    verifyOptions: {
                        algorithms: ['RS256'],
                    },
                }),
            }),
            sms_module_1.SmsModule,
            email_module_1.EmailModule,
        ],
        controllers: [auth_controller_1.AuthController, admin_auth_controller_1.AdminAuthController],
        providers: [auth_service_1.AuthService, admin_auth_service_1.AdminAuthService, jwt_strategy_1.JwtStrategy, otp_store_1.OtpStore, refresh_token_store_1.RefreshTokenStore],
        exports: [auth_service_1.AuthService, admin_auth_service_1.AdminAuthService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map