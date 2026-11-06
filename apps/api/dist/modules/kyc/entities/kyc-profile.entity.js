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
Object.defineProperty(exports, "__esModule", { value: true });
exports.KycProfile = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
let KycProfile = class KycProfile {
    id;
    user;
    userId;
    idType;
    idNumber;
    ociBucketPath;
    status;
    virusScanPassed;
    verificationDetails;
    createdAt;
    updatedAt;
};
exports.KycProfile = KycProfile;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], KycProfile.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], KycProfile.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid' }),
    __metadata("design:type", String)
], KycProfile.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'id_type', length: 50 }),
    __metadata("design:type", String)
], KycProfile.prototype, "idType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'id_number', length: 255 }),
    __metadata("design:type", String)
], KycProfile.prototype, "idNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'oci_bucket_path', length: 500, nullable: true }),
    __metadata("design:type", String)
], KycProfile.prototype, "ociBucketPath", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'pending' }),
    __metadata("design:type", String)
], KycProfile.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'virus_scan_passed', default: false }),
    __metadata("design:type", Boolean)
], KycProfile.prototype, "virusScanPassed", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'verification_details', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], KycProfile.prototype, "verificationDetails", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], KycProfile.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], KycProfile.prototype, "updatedAt", void 0);
exports.KycProfile = KycProfile = __decorate([
    (0, typeorm_1.Entity)({ name: 'kyc_profiles' })
], KycProfile);
//# sourceMappingURL=kyc-profile.entity.js.map