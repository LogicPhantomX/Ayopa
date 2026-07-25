import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateTransactionStatusDto {
    @IsString()
    @IsNotEmpty()
    @IsIn(['pending', 'paid', 'completed', 'cancelled'])
    status: string;

    @IsOptional()
    @IsString()
    note?: string;
}
