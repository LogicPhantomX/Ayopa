import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreatePayoutRequestDto {
    @ApiProperty({ description: 'Paystack recipient_code', example: 'RCP_1234567890' })
    @IsString()
    @IsNotEmpty()
    recipientCode: string;

    @ApiProperty({ description: 'Amount in kobo (smallest unit). Must be > 50,000,000 (₦500,000) for this endpoint.' })
    @IsInt()
    @Min(1)
    amount: number;

    @ApiProperty({ description: 'Reason / memo for the payout' })
    @IsString()
    @IsNotEmpty()
    reason: string;
}
