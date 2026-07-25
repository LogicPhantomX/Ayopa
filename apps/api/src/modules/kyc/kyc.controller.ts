import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequireFullProfile } from '../auth/decorators/require-full-profile.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { KycUploadDto } from './dto/kyc-upload.dto';
import { KycService } from './kyc.service';

@ApiTags('kyc')
@ApiBearerAuth()
@Controller('kyc')
export class KycController {
    constructor(private readonly kycService: KycService) { }

    @Get(':userId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('verification_agent', 'moderator', 'super_admin', 'support_agent')
    @ApiOperation({ summary: 'Get KYC profile for a user (admin/agents only)' })
    @ApiResponse({ status: 200, description: 'KYC profile returned' })
    getForUser(@Param('userId') userId: string) {
        return this.kycService.getForUser(userId);
    }

    @Post('upload')
    @RequireFullProfile()               // must have chosen role=seller before submitting KYC
    @ApiOperation({
        summary: 'Submit KYC document (virus scan + NIMC/BVN verification + PAR issuance)',
        description:
            'Requires a completed profile (POST /auth/profile/setup first). ' +
            'Sellers cannot create listings until KYC status is APPROVED.',
    })
    @ApiResponse({ status: 201, description: 'KYC profile created/updated' })
    submit(@Req() req: any, @Body() dto: KycUploadDto) {
        return this.kycService.submit(req.user.id, dto);
    }

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('verification_agent', 'senior_dispute_officer', 'super_admin')
    @ApiOperation({ summary: 'Update KYC status (verification agents/admins only)' })
    @ApiResponse({ status: 200, description: 'KYC status updated' })
    updateStatus(
        @Param('id') id: string,
        @Body('status') status: string,
        @Body('reviewNote') reviewNote?: string,
    ) {
        return this.kycService.updateStatus(id, status, reviewNote);
    }
}
