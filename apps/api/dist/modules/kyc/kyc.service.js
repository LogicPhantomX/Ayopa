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
var KycService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KycService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const kyc_profile_entity_1 = require("./entities/kyc-profile.entity");
const audit_service_1 = require("../audit/audit.service");
let KycService = KycService_1 = class KycService {
    kycRepository;
    auditService;
    logger = new common_1.Logger(KycService_1.name);
    constructor(kycRepository, auditService) {
        this.kycRepository = kycRepository;
        this.auditService = auditService;
    }
    async issuePar(userId, idType) {
        this.logger.log(`Issuing KYC PAR for user ${userId}, type: ${idType}`);
        await this.auditService.log('kyc', 'par_issued', userId, { idType });
        return {
            uploadUrl: `https://objectstorage.eu-frankfurt-1.oraclecloud.com/p/stub-par-${Math.random().toString(36).substring(7)}`,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        };
    }
    async verifyId(idType, idNumber) {
        this.logger.log(`Verifying ${idType}: ${idNumber}`);
        if (idNumber === 'FAIL') {
            return { status: 'failed', reason: 'ID verification failed' };
        }
        return {
            status: 'verified',
            nameMatch: true,
            externalRef: `REF-${Date.now()}`,
        };
    }
    async scanDocument(bucketPath) {
        this.logger.log(`Scanning document for viruses: ${bucketPath}`);
        return !bucketPath.includes('infected');
    }
    async getForUser(userId) {
        const profile = await this.kycRepository.findOne({ where: { userId } });
        if (!profile)
            throw new common_1.NotFoundException('KYC profile not found for this user.');
        return profile;
    }
    async submit(userId, dto) {
        const idType = dto.documentType;
        const idNumber = dto.nin ?? dto.bvn ?? '';
        return this.submitKyc(userId, {
            idType,
            idNumber,
            bucketPath: `kyc/${userId}/${idType}-${Date.now()}`,
        });
    }
    async updateStatus(id, status, reviewNote) {
        const profile = await this.kycRepository.findOne({ where: { id } });
        if (!profile)
            throw new common_1.NotFoundException('KYC profile not found.');
        profile.status = status;
        const saved = await this.kycRepository.save(profile);
        await this.auditService.log('kyc', 'status_updated', undefined, {
            profileId: id,
            status,
            reviewNote,
        });
        return saved;
    }
    async submitKyc(userId, data) {
        const scanPassed = await this.scanDocument(data.bucketPath);
        if (!scanPassed) {
            await this.auditService.log('kyc', 'virus_detected', userId, { bucketPath: data.bucketPath });
            throw new common_1.BadRequestException('Virus detected in uploaded document');
        }
        const verification = await this.verifyId(data.idType, data.idNumber);
        const profile = this.kycRepository.create({
            userId,
            idType: data.idType,
            idNumber: data.idNumber,
            ociBucketPath: data.bucketPath,
            status: verification.status === 'verified' ? 'approved' : 'failed',
            virusScanPassed: scanPassed,
            verificationDetails: verification,
        });
        const savedProfile = await this.kycRepository.save(profile);
        await this.auditService.log('kyc', 'submitted', userId, {
            profileId: savedProfile.id,
            status: savedProfile.status,
        });
        return savedProfile;
    }
};
exports.KycService = KycService;
exports.KycService = KycService = KycService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(kyc_profile_entity_1.KycProfile)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        audit_service_1.AuditService])
], KycService);
//# sourceMappingURL=kyc.service.js.map