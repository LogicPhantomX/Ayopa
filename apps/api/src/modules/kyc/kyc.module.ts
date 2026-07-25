import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { KycController } from './kyc.controller';
import { KycProfile } from './entities/kyc-profile.entity';
import { KycService } from './kyc.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([KycProfile]),
        AuditModule,
    ],
    controllers: [KycController],
    providers: [KycService],
    exports: [KycService],
})
export class KycModule { }
