import { IsNotEmpty, IsString, Min } from 'class-validator';

export class CreatePaymentDto {
    @IsString()
    @IsNotEmpty()
    transactionId: string;

    @IsNotEmpty()
    @Min(0)
    amount: number;
}
