import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApprovePayoutDto } from './dto/approve-payout.dto';
import { CreatePayoutRequestDto } from './dto/create-payout-request.dto';
import { PayoutsService } from './payouts.service';
import { PayoutStatus } from './entities/payout-request.entity';

@ApiTags('payouts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payouts')
export class PayoutsController {
    constructor(private readonly payoutsService: PayoutsService) {}

    // ─── Create ────────────────────────────────────────────────────────────────

    @Post()
    @Roles('finance_officer', 'super_admin')
    @ApiOperation({
        summary: 'Initiate a payout. Amounts > ₦500,000 create a dual-approval request.',
    })
    @ApiResponse({ status: 201, description: 'Payout initiated or request queued.' })
    create(@Req() req: any, @Body() dto: CreatePayoutRequestDto) {
        return this.payoutsService.createPayoutRequest(req.user.id, dto);
    }

    // ─── Approve ───────────────────────────────────────────────────────────────

    @Post(':id/approve')
    @Roles('admin', 'super_admin')
    @ApiOperation({
        summary: 'Approve a pending payout request. Two distinct admin approvals execute the transfer.',
    })
    @ApiResponse({ status: 201, description: 'Approval recorded.' })
    approve(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() req: any,
        @Body() dto: ApprovePayoutDto,
    ) {
        return this.payoutsService.approvePayout(id, req.user.id, dto);
    }

    // ─── Reject ────────────────────────────────────────────────────────────────

    @Post(':id/reject')
    @Roles('admin', 'super_admin')
    @ApiOperation({ summary: 'Reject a pending payout request.' })
    @ApiResponse({ status: 201, description: 'Payout rejected.' })
    reject(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() req: any,
        @Body('reason') reason?: string,
    ) {
        return this.payoutsService.rejectPayout(id, req.user.id, reason);
    }

    // ─── List ──────────────────────────────────────────────────────────────────

    @Get()
    @Roles('finance_officer', 'admin', 'super_admin')
    @ApiOperation({ summary: 'List payout requests, optionally filtered by status.' })
    @ApiQuery({ name: 'status', required: false, enum: ['pending', 'approved', 'executing', 'completed', 'rejected', 'failed'] })
    findAll(@Query('status') status?: PayoutStatus) {
        return this.payoutsService.findAll(status);
    }

    // ─── Single ────────────────────────────────────────────────────────────────

    @Get(':id')
    @Roles('finance_officer', 'admin', 'super_admin')
    @ApiOperation({ summary: 'Get a single payout request with its approvals.' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.payoutsService.findOne(id);
    }
}
