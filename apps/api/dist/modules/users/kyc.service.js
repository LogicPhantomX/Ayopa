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
exports.KycService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const kyc_entity_1 = require("./entities/kyc.entity");
let KycService = class KycService {
    kycRepository;
    constructor(kycRepository) {
        this.kycRepository = kycRepository;
    }
    async getForUser(userId) {
        return this.kycRepository.findOne({ where: { userId } });
    }
    async submit(userId, dto) {
        let kyc = await this.kycRepository.findOne({ where: { userId } });
        if (!kyc) {
            kyc = this.kycRepository.create({ userId, ...dto, status: dto.status ?? 'pending' });
            return this.kycRepository.save(kyc);
        }
        Object.assign(kyc, dto, { status: dto.status ?? kyc.status ?? 'pending' });
        return this.kycRepository.save(kyc);
    }
    async updateStatus(userId, status, reviewNote) {
        const kyc = await this.kycRepository.findOne({ where: { userId } });
        if (!kyc) {
            throw new common_1.NotFoundException('KYC profile not found');
        }
        kyc.status = status;
        if (reviewNote) {
            kyc.reviewNote = reviewNote;
        }
        return this.kycRepository.save(kyc);
    }
};
exports.KycService = KycService;
exports.KycService = KycService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(kyc_entity_1.KycProfile)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], KycService);
//# sourceMappingURL=kyc.service.js.map