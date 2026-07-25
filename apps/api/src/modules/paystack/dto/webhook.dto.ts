import { IsNotEmpty, IsString } from 'class-validator';

export class WebhookDto {
    @IsString()
    @IsNotEmpty()
    payload: string;

    @IsString()
    @IsNotEmpty()
    signature: string;
}
