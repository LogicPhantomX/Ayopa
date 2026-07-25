import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { KycProfile } from './entities/kyc.entity';

@Injectable()
export class KycService {
    constructor(
        @InjectRepository(KycProfile)
        private readonly kycRepository: Repository<KycProfile>,
    ) { }

    async getForUser(userId: string) {
        return this.kycRepository.findOne({ where: { userId } });
    }

    async submit(userId: string, dto: SubmitKycDto) {
        let kyc = await this.kycRepository.findOne({ where: { userId } });

        if (!kyc) {
            kyc = this.kycRepository.create({ userId, ...dto, status: dto.status ?? 'pending' });
            return this.kycRepository.save(kyc);
        }

        Object.assign(kyc, dto, { status: dto.status ?? kyc.status ?? 'pending' });
        return this.kycRepository.save(kyc);
    }

    async updateStatus(userId: string, status: string, reviewNote?: string) {
        const kyc = await this.kycRepository.findOne({ where: { userId } });
        if (!kyc) {
            throw new NotFoundException('KYC profile not found');
        }

        kyc.status = status;
        if (reviewNote) {
            kyc.reviewNote = reviewNote;
        }

        return this.kycRepository.save(kyc);
    }
}
