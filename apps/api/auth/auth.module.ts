import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from '../email/email.module';
import { SmsModule } from '../sms/sms.module';
import { User } from '../users/entities/user.entity';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpStore } from './otp-store';
import { RefreshTokenStore } from './refresh-token-store';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([User]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                privateKey: configService.get<string>('JWT_PRIVATE_KEY'),
                publicKey: configService.get<string>('JWT_PUBLIC_KEY'),
                signOptions: {
                    algorithm: 'RS256',
                    expiresIn: configService.get<string>('JWT_TTL', '15m') as any,
                },
                verifyOptions: {
                    algorithms: ['RS256'],
                },
            }),
        }),
        SmsModule,
        EmailModule,
    ],
    controllers: [AuthController, AdminAuthController],
    providers: [AuthService, AdminAuthService, JwtStrategy, OtpStore, RefreshTokenStore],
    exports: [AuthService, AdminAuthService],
})
export class AuthModule {}
