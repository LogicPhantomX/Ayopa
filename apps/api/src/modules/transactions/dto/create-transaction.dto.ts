import { IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateTransactionDto {
    @IsString()
    @IsNotEmpty()
    listingId: string;

    @IsNotEmpty()
    @Min(0)
    amount: number;
}
