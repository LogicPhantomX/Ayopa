import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class KycUploadDto {
    @IsString()
    @IsNotEmpty()
    documentType: string;

    @IsString()
    @IsOptional()
    nin?: string;

    @IsString()
    @IsOptional()
    bvn?: string;
}
