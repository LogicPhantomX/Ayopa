"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireFullProfile = RequireFullProfile;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const provisional_guard_1 = require("../guards/provisional.guard");
function RequireFullProfile() {
    return (0, common_1.applyDecorators)((0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, provisional_guard_1.ProvisionalGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiForbiddenResponse)({
        description: 'Profile incomplete — POST /auth/profile/setup first.',
    }));
}
//# sourceMappingURL=require-full-profile.decorator.js.map