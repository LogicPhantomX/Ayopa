import {
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireFullProfile } from '../auth/decorators/require-full-profile.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { ListingsService } from './listings.service';

@ApiTags('listings')
@ApiBearerAuth()
@Controller('listings')
export class ListingsController {
    constructor(private readonly listingsService: ListingsService) { }

    @Post()
    @RequireFullProfile()                // JWT + provisional block; sellers also need KYC (enforced in service)
    @ApiOperation({ summary: 'Create a new livestock listing (sellers only, KYC required)' })
    @ApiResponse({ status: 201, description: 'Listing created' })
    create(@Req() req: any, @Body() dto: CreateListingDto) {
        return this.listingsService.create(req.user.id, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Browse published listings — open to everyone including provisional users' })
    @ApiResponse({ status: 200, description: 'Listings returned' })
    findAll(
        @Query('search') search?: string,
        @Query('category') category?: string,
        @Query('page') page = '1',
        @Query('limit') limit = '20',
    ) {
        return this.listingsService.findAll({
            search,
            category,
            page: Number(page),
            limit: Number(limit),
        });
    }

    // ── Item 3: Admin endpoint for soft-deleted listings ─────────────────────
    @Get('deleted')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'moderator')
    @ApiOperation({ summary: 'Admin: list soft-deleted listings (paginated)' })
    @ApiResponse({ status: 200, description: 'Deleted listings returned' })
    findDeleted(
        @Query('page') page = '1',
        @Query('limit') limit = '20',
    ) {
        return this.listingsService.findDeleted({
            page: Number(page),
            limit: Number(limit),
        });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a single listing — open to everyone' })
    @ApiResponse({ status: 200, description: 'Listing returned' })
    findOne(@Param('id') id: string) {
        return this.listingsService.findOne(id);
    }

    @Patch(':id')
    @RequireFullProfile()
    @ApiOperation({ summary: 'Update a seller listing' })
    @ApiResponse({ status: 200, description: 'Listing updated' })
    update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateListingDto) {
        return this.listingsService.update(req.user.id, id, dto);
    }

    @Delete(':id')
    @RequireFullProfile()
    @ApiOperation({ summary: 'Soft-delete a seller listing (row preserved, deletedAt set)' })
    @ApiResponse({ status: 200, description: 'Listing soft-deleted' })
    remove(@Req() req: any, @Param('id') id: string) {
        return this.listingsService.remove(req.user.id, id);
    }
}
