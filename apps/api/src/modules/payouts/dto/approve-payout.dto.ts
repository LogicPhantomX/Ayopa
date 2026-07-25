import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ApprovePayoutDto {
    @ApiPropertyOptional({ description: 'Optional comment from the approving admin' })
    @IsOptional()
    @IsString()
    comment?: string;
}
