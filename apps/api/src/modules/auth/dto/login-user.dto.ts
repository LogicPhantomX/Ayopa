import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginUserDto {
    @IsString()
    @IsNotEmpty()
    identifier: string;

    @IsOptional()
    @IsString()
    password?: string;
}
