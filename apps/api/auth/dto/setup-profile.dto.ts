import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export enum IntendedRole {
    BUYER = 'buyer',
    SELLER = 'seller',
}

export class SetupProfileDto {
    @ApiProperty({ example: 'Emeka Okafor', description: 'Full legal name' })
    @IsString()
    @MinLength(2)
    @MaxLength(255)
    fullName: string;

    @ApiProperty({
        enum: IntendedRole,
        example: IntendedRole.SELLER,
        description: 'Choose buyer (purchase livestock) or seller (list livestock)',
    })
    @IsEnum(IntendedRole)
    role: IntendedRole;
}
