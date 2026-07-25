import { Body, Controller, Post, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EscrowService } from './escrow.service';

class TransitionDto {
    status: string;
}

@ApiTags('escrow')
@ApiBearerAuth()
@Controller('escrow')
export class EscrowController {
    constructor(private readonly escrowService: EscrowService) { }

    @Post(':transactionId/transition')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('buyer', 'seller', 'moderator', 'super_admin')
    @ApiOperation({ summary: 'Transition escrow state (server-side state machine enforced)' })
    @ApiResponse({ status: 200, description: 'Escrow transitioned' })
    transition(
        @Param('transactionId') transactionId: string,
        @Body() dto: TransitionDto,
        @Req() req: any,
    ) {
        return this.escrowService.transitionTo(transactionId, dto.status as any, req.user.id);
    }

    @Post('auto-release')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('super_admin')
    @ApiOperation({ summary: 'Trigger 48hr auto-release sweep (super_admin / cron)' })
    @ApiResponse({ status: 200, description: 'Number of auto-released transactions returned' })
    autoRelease() {
        return this.escrowService.processAutoReleases();
    }
}
