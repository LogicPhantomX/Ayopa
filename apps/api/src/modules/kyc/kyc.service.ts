import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycProfile } from './entities/kyc-profile.entity';
import { AuditService } from '../audit/audit.service';
import { KycUploadDto } from './dto/kyc-upload.dto';

@Injectable()
export class KycService {
    private readonly logger = new Logger(KycService.name);

    constructor(
        @InjectRepository(KycProfile)
        private readonly kycRepository: Repository<KycProfile>,
        private readonly auditService: AuditService,
    ) { }

    /**
     * Issues a Pre-Authenticated Request (PAR) for OCI private bucket upload.
     */
    async issuePar(userId: string, idType: string) {
        this.logger.log(`Issuing KYC PAR for user ${userId}, type: ${idType}`);
        
        // Audit log on every PAR issuance as required by spec
        await this.auditService.log('kyc', 'par_issued', userId, { idType });

        return {
            uploadUrl: `https://objectstorage.eu-frankfurt-1.oraclecloud.com/p/stub-par-${Math.random().toString(36).substring(7)}`,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15-minute expiry
        };
    }

    /**
     * Verifies NIMC or BVN via stubbed external service.
     */
    async verifyId(idType: string, idNumber: string) {
        this.logger.log(`Verifying ${idType}: ${idNumber}`);
        
        // Stub: Always pass for specific test values, fail for others
        if (idNumber === 'FAIL') {
            return { status: 'failed', reason: 'ID verification failed' };
        }

        return {
            status: 'verified',
            nameMatch: true,
            externalRef: `REF-${Date.now()}`,
        };
    }

    /**
     * Simulates virus scanning of uploaded documents.
     */
    async scanDocument(bucketPath: string): Promise<boolean> {
        this.logger.log(`Scanning document for viruses: ${bucketPath}`);
        // Stub: fail if path contains 'infected'
        return !bucketPath.includes('infected');
    }

    /** Retrieve KYC profile for a given user (admin/verification agents only). */
    async getForUser(userId: string) {
        const profile = await this.kycRepository.findOne({ where: { userId } });
        if (!profile) throw new NotFoundException('KYC profile not found for this user.');
        return profile;
    }

    /**
     * Full KYC submission flow: virus scan → ID verification → save profile.
     * This is the method used by the KYC upload controller endpoint.
     */
    async submit(userId: string, dto: KycUploadDto) {
        const idType = dto.documentType;
        const idNumber = dto.nin ?? dto.bvn ?? '';
        // bucketPath comes from a PAR-issued OCI URL; for submission we use the dto fields
        return this.submitKyc(userId, {
            idType,
            idNumber,
            bucketPath: `kyc/${userId}/${idType}-${Date.now()}`,
        });
    }

    /**
     * Update KYC verification status (verification agents / super_admin only).
     */
    async updateStatus(id: string, status: string, reviewNote?: string) {
        const profile = await this.kycRepository.findOne({ where: { id } });
        if (!profile) throw new NotFoundException('KYC profile not found.');

        profile.status = status;
        const saved = await this.kycRepository.save(profile);

        await this.auditService.log('kyc', 'status_updated', undefined, {
            profileId: id,
            status,
            reviewNote,
        });

        return saved;
    }

    async submitKyc(userId: string, data: { idType: string; idNumber: string; bucketPath: string }) {
        // 1. Virus scan
        const scanPassed = await this.scanDocument(data.bucketPath);
        if (!scanPassed) {
            await this.auditService.log('kyc', 'virus_detected', userId, { bucketPath: data.bucketPath });
            throw new BadRequestException('Virus detected in uploaded document');
        }

        // 2. Verify ID
        const verification = await this.verifyId(data.idType, data.idNumber);
        
        // 3. Save profile
        const profile = this.kycRepository.create({
            userId,
            idType: data.idType,
            idNumber: data.idNumber, // In real app, encrypt this
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
}
