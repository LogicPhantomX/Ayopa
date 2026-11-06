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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListingsController = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const require_full_profile_decorator_1 = require("../auth/decorators/require-full-profile.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const create_listing_dto_1 = require("./dto/create-listing.dto");
const update_listing_dto_1 = require("./dto/update-listing.dto");
const listings_service_1 = require("./listings.service");
let ListingsController = class ListingsController {
    listingsService;
    constructor(listingsService) {
        this.listingsService = listingsService;
    }
    create(req, dto) {
        return this.listingsService.create(req.user.id, dto);
    }
    findAll(search, category, page = '1', limit = '20') {
        return this.listingsService.findAll({
            search,
            category,
            page: Number(page),
            limit: Number(limit),
        });
    }
    findDeleted(page = '1', limit = '20') {
        return this.listingsService.findDeleted({
            page: Number(page),
            limit: Number(limit),
        });
    }
    findOne(id) {
        return this.listingsService.findOne(id);
    }
    update(req, id, dto) {
        return this.listingsService.update(req.user.id, id, dto);
    }
    remove(req, id) {
        return this.listingsService.remove(req.user.id, id);
    }
};
exports.ListingsController = ListingsController;
__decorate([
    (0, common_1.Post)(),
    (0, require_full_profile_decorator_1.RequireFullProfile)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new livestock listing (sellers only, KYC required)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Listing created' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_2.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_listing_dto_1.CreateListingDto]),
    __metadata("design:returntype", void 0)
], ListingsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Browse published listings — open to everyone including provisional users' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Listings returned' }),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('category')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], ListingsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('deleted'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'moderator'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: list soft-deleted listings (paginated)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Deleted listings returned' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ListingsController.prototype, "findDeleted", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single listing — open to everyone' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Listing returned' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ListingsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_full_profile_decorator_1.RequireFullProfile)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update a seller listing' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Listing updated' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_2.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_listing_dto_1.UpdateListingDto]),
    __metadata("design:returntype", void 0)
], ListingsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_full_profile_decorator_1.RequireFullProfile)(),
    (0, swagger_1.ApiOperation)({ summary: 'Soft-delete a seller listing (row preserved, deletedAt set)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Listing soft-deleted' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ListingsController.prototype, "remove", null);
exports.ListingsController = ListingsController = __decorate([
    (0, swagger_1.ApiTags)('listings'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('listings'),
    __metadata("design:paramtypes", [listings_service_1.ListingsService])
], ListingsController);
//# sourceMappingURL=listings.controller.js.map