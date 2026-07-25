import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateDisputeDto {
    @IsIn(['open', 'seller_responded', 'under_review', 'resolved', 'appealed', 'rejected'])
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    sellerResponse?: string;

    @IsString()
    @IsOptional()
    resolution?: string;

    @IsUUID()
    @IsOptional()
    officerAssignedId?: string;
}
