"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const auth_service_1 = require("./auth.service");
const setup_profile_dto_1 = require("./dto/setup-profile.dto");
const login_user_dto_1 = require("./dto/login-user.dto");
const register_user_dto_1 = require("./dto/register-user.dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async register(dto) {
        return this.authService.register(dto);
    }
    async login(dto) {
        return this.authService.login(dto);
    }
    async requestOtp(dto) {
        return this.authService.requestPhoneOtp(dto);
    }
    async verifyOtp(dto) {
        return this.authService.verifyPhoneOtp(dto);
    }
    async setupProfile(req, dto) {
        return this.authService.setupProfile(req.user.id, dto);
    }
    async refresh(dto) {
        return this.authService.refreshToken(dto.refreshToken);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, throttler_1.Throttle)({ auth: { ttl: 60_000, limit: 20 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Register with email/password (web / admin flows)' }),
    (0, swagger_1.ApiCreatedResponse)({ description: 'User registered, tokens issued.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_user_dto_1.RegisterUserDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, throttler_1.Throttle)({ otp: { ttl: 60_000, limit: 5 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Login with email or phone + password' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Tokens issued.' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Invalid credentials.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_user_dto_1.LoginUserDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('otp/request'),
    (0, throttler_1.Throttle)({ otp: { ttl: 60_000, limit: 5 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Send a 6-digit OTP to a Nigerian mobile number' }),
    (0, swagger_1.ApiBody)({ schema: { example: { phone: '+2348012345678' } } }),
    (0, swagger_1.ApiOkResponse)({ description: 'OTP dispatched (returned in response in dev mode).' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "requestOtp", null);
__decorate([
    (0, common_1.Post)('otp/verify'),
    (0, throttler_1.Throttle)({ otp: { ttl: 60_000, limit: 5 } }),
    (0, swagger_1.ApiOperation)({
        summary: 'Verify OTP — logs in existing users, auto-registers new ones as provisional',
        description: 'If the phone number is new, a provisional account is created and `isNewUser: true` ' +
            'is returned alongside a `nextStep` hint. Provisional tokens are valid but blocked ' +
            'from transactional endpoints until POST /auth/profile/setup is called.',
    }),
    (0, swagger_1.ApiBody)({ schema: { example: { phone: '+2348012345678', code: '123456' } } }),
    (0, swagger_1.ApiOkResponse)({ description: 'OTP verified. Tokens issued.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyOtp", null);
__decorate([
    (0, common_1.Post)('profile/setup'),
    (0, throttler_1.Throttle)({ auth: { ttl: 60_000, limit: 20 } }),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Complete onboarding — set name and choose buyer or seller role',
        description: 'Required after OTP registration. Promotes a provisional account to buyer or seller, ' +
            'revokes old tokens, and returns fresh tokens carrying the new role. ' +
            'Sellers must then POST /kyc/upload before their first listing.',
    }),
    (0, swagger_1.ApiBody)({ type: setup_profile_dto_1.SetupProfileDto }),
    (0, swagger_1.ApiOkResponse)({ description: 'Profile complete. Fresh tokens issued.' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, setup_profile_dto_1.SetupProfileDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "setupProfile", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, throttler_1.Throttle)({ auth: { ttl: 60_000, limit: 20 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Rotate tokens using a refresh token (single-use)' }),
    (0, swagger_1.ApiBody)({ schema: { example: { refreshToken: '<refresh-token>' } } }),
    (0, swagger_1.ApiOkResponse)({ description: 'New access + refresh tokens issued.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map