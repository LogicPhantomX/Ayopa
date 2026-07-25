import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateDisputeDto {
    @IsUUID()
    @IsNotEmpty()
    transactionId: string;

    @IsString()
    @IsNotEmpty()
    reason: string;
}
