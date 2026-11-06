"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetupProfileDto = exports.IntendedRole = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var IntendedRole;
(function (IntendedRole) {
    IntendedRole["BUYER"] = "buyer";
    IntendedRole["SELLER"] = "seller";
})(IntendedRole || (exports.IntendedRole = IntendedRole = {}));
class SetupProfileDto {
    fullName;
    role;
}
exports.SetupProfileDto = SetupProfileDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Emeka Okafor', description: 'Full legal name' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], SetupProfileDto.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: IntendedRole,
        example: IntendedRole.SELLER,
        description: 'Choose buyer (purchase livestock) or seller (list livestock)',
    }),
    (0, class_validator_1.IsEnum)(IntendedRole),
    __metadata("design:type", String)
], SetupProfileDto.prototype, "role", void 0);
//# sourceMappingURL=setup-profile.dto.js.map