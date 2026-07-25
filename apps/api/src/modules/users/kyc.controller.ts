import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { KycService } from './kyc.service';

@ApiTags('kyc')
@ApiBearerAuth()
@Controller('kyc')
export class KycController {
    constructor(private readonly kycService: KycService) { }

    @Get(':userId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'moderator')
    @ApiOperation({ summary: 'View KYC details for a user' })
    @ApiResponse({ status: 200, description: 'KYC profile returned' })
    getForUser(@Param('userId') userId: string) {
        return this.kycService.getForUser(userId);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Submit or update a user KYC profile' })
    @ApiResponse({ status: 201, description: 'KYC profile submitted' })
    submit(@Req() req: any, @Body() dto: SubmitKycDto) {
        return this.kycService.submit(req.user.id, dto);
    }

    @Patch(':userId/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'moderator')
    @ApiOperation({ summary: 'Review KYC status' })
    @ApiResponse({ status: 200, description: 'KYC status updated' })
    updateStatus(@Param('userId') userId: string, @Body() body: { status: string; reviewNote?: string }) {
        return this.kycService.updateStatus(userId, body.status, body.reviewNote);
    }
}
