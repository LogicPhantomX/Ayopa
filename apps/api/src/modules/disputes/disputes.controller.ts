import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequireFullProfile } from '../auth/decorators/require-full-profile.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AppealDisputeDto } from './dto/appeal-dispute.dto';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeDto } from './dto/update-dispute.dto';
import { DisputesService } from './disputes.service';

@ApiTags('disputes')
@ApiBearerAuth()
@Controller('disputes')
export class DisputesController {
    constructor(private readonly disputesService: DisputesService) { }

    @Post()
    @RequireFullProfile()
    @UseGuards(RolesGuard)
    @Roles('buyer', 'seller')
    @ApiOperation({ summary: 'Raise a dispute on a transaction (freezes escrow immediately)' })
    @ApiResponse({ status: 201, description: 'Dispute created, escrow frozen.' })
    create(@Req() req: any, @Body() dto: CreateDisputeDto) {
        return this.disputesService.create(req.user.id, dto);
    }

    @Get()
    @RequireFullProfile()
    @ApiOperation({ summary: 'List disputes involving the authenticated user' })
    @ApiResponse({ status: 200, description: 'Disputes returned.' })
    findAll(@Req() req: any) {
        return this.disputesService.findAllForUser(req.user.id);
    }

    @Get(':id')
    @RequireFullProfile()
    @ApiOperation({ summary: 'Get a dispute by ID' })
    @ApiResponse({ status: 200, description: 'Dispute returned.' })
    findOne(@Param('id') id: string) {
        return this.disputesService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('dispute_officer', 'senior_dispute_officer', 'super_admin')
    @ApiOperation({ summary: 'Update a dispute (officers/admins only)' })
    @ApiResponse({ status: 200, description: 'Dispute updated.' })
    update(@Param('id') id: string, @Body() dto: UpdateDisputeDto, @Req() req: any) {
        return this.disputesService.update(id, dto, req.user.id);
    }

    @Post('appeal')
    @RequireFullProfile()
    @ApiOperation({ summary: 'Appeal a resolved dispute (one appeal max, enforced in service)' })
    @ApiResponse({ status: 201, description: 'Appeal submitted.' })
    appeal(@Req() req: any, @Body() dto: AppealDisputeDto) {
        return this.disputesService.appeal(req.user.id, dto);
    }

    @Post(':id/seller-response')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('seller')
    @ApiOperation({ summary: 'Seller responds to a dispute within 12-hour window' })
    @ApiResponse({ status: 200, description: 'Seller response recorded.' })
    sellerRespond(
        @Param('id') id: string,
        @Req() req: any,
        @Body('response') response: string,
    ) {
        return this.disputesService.sellerRespond(id, req.user.id, response);
    }
}
