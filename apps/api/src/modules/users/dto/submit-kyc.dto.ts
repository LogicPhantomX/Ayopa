import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SubmitKycDto {
    @IsString()
    @IsNotEmpty()
    idType: string;

    @IsString()
    @IsNotEmpty()
    idNumber: string;

    @IsOptional()
    @IsString()
    bvn?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsIn(['pending', 'approved', 'rejected'])
    status?: string;
}
