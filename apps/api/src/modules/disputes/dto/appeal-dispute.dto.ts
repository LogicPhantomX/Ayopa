import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class AppealDisputeDto {
    @IsUUID()
    @IsNotEmpty()
    disputeId: string;

    @IsString()
    @IsNotEmpty()
    reason: string;
}
