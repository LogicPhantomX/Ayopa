import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequireFullProfile } from '../auth/decorators/require-full-profile.decorator';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@ApiBearerAuth()
@Controller('transactions')
export class TransactionsController {
    constructor(private readonly transactionsService: TransactionsService) { }

    @Post()
    @RequireFullProfile()
    @ApiOperation({ summary: 'Create a transaction for a listing (initiates escrow)' })
    @ApiResponse({ status: 201, description: 'Transaction created' })
    create(@Req() req: any, @Body() dto: CreateTransactionDto) {
        return this.transactionsService.create(req.user.id, dto);
    }

    @Get()
    @RequireFullProfile()
    @ApiOperation({ summary: 'List transactions for the authenticated user' })
    @ApiResponse({ status: 200, description: 'Transactions returned' })
    findAll(@Req() req: any) {
        return this.transactionsService.findAllForUser(req.user.id);
    }

    @Patch(':id/status')
    @RequireFullProfile()
    @ApiOperation({ summary: 'Update transaction status' })
    @ApiResponse({ status: 200, description: 'Transaction status updated' })
    updateStatus(@Param('id') id: string, @Body() dto: UpdateTransactionStatusDto) {
        return this.transactionsService.updateStatus(id, dto);
    }
}
