import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequireFullProfile } from '../auth/decorators/require-full-profile.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaystackService } from './paystack.service';

@ApiTags('paystack')
@ApiBearerAuth()
@Controller('paystack')
export class PaystackController {
    constructor(private readonly paystackService: PaystackService) {}

    /**
     * Seller onboarding — register a Paystack split-payment sub-account.
     * Called once per seller after KYC is approved.
     */
    @Post('subaccount')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('seller', 'admin', 'super_admin')
    @ApiOperation({ summary: 'Create a Paystack sub-account for a seller (split payments)' })
    @ApiResponse({ status: 201, description: 'Sub-account created.' })
    createSubAccount(
        @Body() dto: { businessName: string; bankCode: string; accountNumber: string; primaryContactEmail?: string },
    ) {
        return this.paystackService.createSubAccount(dto);
    }

    /**
     * Buyer checkout — initialize a Paystack transaction for a listing.
     * Returns authorization_url to redirect the buyer to Paystack hosted checkout.
     */
    @Post('initialize')
    @RequireFullProfile()
    @ApiOperation({ summary: 'Initialize a Paystack checkout transaction' })
    @ApiResponse({ status: 201, description: 'Checkout URL returned.' })
    initialize(
        @Body() dto: {
            email: string;
            amount: number;
            subaccount?: string;
            transactionId?: string;
            callbackUrl?: string;
        },
    ) {
        return this.paystackService.initializeTransaction({
            email: dto.email,
            amount: dto.amount,
            subaccount: dto.subaccount,
            metadata: dto.transactionId ? { transactionId: dto.transactionId } : undefined,
            callback_url: dto.callbackUrl,
        });
    }

    /**
     * Verify a Paystack transaction by reference.
     * Useful for confirming payment after redirect from Paystack hosted checkout.
     */
    @Get('verify/:reference')
    @RequireFullProfile()
    @ApiOperation({ summary: 'Verify a Paystack transaction by reference' })
    @ApiResponse({ status: 200, description: 'Transaction status returned.' })
    verify(@Param('reference') reference: string) {
        return this.paystackService.verifyTransaction(reference);
    }

    /**
     * Create a Paystack transfer recipient (required before initiating a transfer).
     */
    @Post('recipient')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('finance_officer', 'admin', 'super_admin')
    @ApiOperation({ summary: 'Create a Paystack transfer recipient (bank account)' })
    @ApiResponse({ status: 201, description: 'Recipient created.' })
    createRecipient(
        @Body() dto: { name: string; accountNumber: string; bankCode: string; currency?: string },
    ) {
        return this.paystackService.createTransferRecipient({
            name: dto.name,
            accountNumber: dto.accountNumber,
            bankCode: dto.bankCode,
            currency: dto.currency,
        });
    }

    /**
     * List all Nigerian banks supported by Paystack.
     */
    @Get('banks')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'List Nigerian banks supported by Paystack' })
    @ApiResponse({ status: 200, description: 'List of banks returned.' })
    listBanks() {
        return this.paystackService.listBanks();
    }
}
