import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuditService } from './audit.service';

// ── Item 4: Audit log pagination ──────────────────────────────────────────────

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'moderator')
    @ApiOperation({ summary: 'List audit logs (paginated — page/limit required)' })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 50, description: 'Max 200' })
    @ApiResponse({ status: 200, description: 'Audit logs returned with pagination metadata' })
    findAll(
        @Query('page') page = '1',
        @Query('limit') limit = '50',
    ) {
        return this.auditService.findAll(Number(page), Number(limit));
    }
}
