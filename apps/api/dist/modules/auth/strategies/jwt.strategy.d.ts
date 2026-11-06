import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
interface JwtPayload {
    sub: string;
    email: string | null;
    role: string;
    iat: number;
    exp: number;
}
declare const JwtStrategy_base: new (...args: any) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly configService;
    private readonly authService;
    constructor(configService: ConfigService, authService: AuthService);
    validate(payload: JwtPayload): Promise<{
        id: string;
        email: string;
        role: import("../../users/entities/user.entity").UserRole;
        fullName: string;
        isProvisional: boolean;
    }>;
}
export {};
