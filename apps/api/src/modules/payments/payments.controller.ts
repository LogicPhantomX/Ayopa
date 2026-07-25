import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequireFullProfile } from '../auth/decorators/require-full-profile.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post()
    @RequireFullProfile()
    @ApiOperation({ summary: 'Create a payment record for a transaction' })
    @ApiResponse({ status: 201, description: 'Payment record created' })
    create(@Body() dto: CreatePaymentDto) {
        return this.paymentsService.create(dto);
    }

    @Patch(':id/status')
    @RequireFullProfile()
    @ApiOperation({ summary: 'Update the status of a payment' })
    @ApiResponse({ status: 200, description: 'Payment status updated' })
    updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.paymentsService.updateStatus(id, status);
    }
}
