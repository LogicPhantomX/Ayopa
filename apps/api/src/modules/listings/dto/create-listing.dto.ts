import { IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateListingDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsString()
    @IsNotEmpty()
    category: string;

    @IsNotEmpty()
    @Min(0)
    price: number;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    currency?: string;
}
