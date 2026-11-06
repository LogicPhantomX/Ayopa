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
exports.RestrictedUsersRepository = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
let RestrictedUsersRepository = class RestrictedUsersRepository extends typeorm_1.Repository {
    dataSource;
    request;
    constructor(dataSource, request) {
        super(user_entity_1.User, dataSource.createEntityManager());
        this.dataSource = dataSource;
        this.request = request;
    }
    async findOne(options) {
        const user = await super.findOne(options);
        if (user && this.request?.user?.role === 'finance_officer') {
            this.stripSensitiveFields(user);
        }
        return user;
    }
    async find(options) {
        const users = await super.find(options);
        if (this.request?.user?.role === 'finance_officer') {
            users.forEach(u => this.stripSensitiveFields(u));
        }
        return users;
    }
    stripSensitiveFields(user) {
        delete user.nin;
        delete user.bvn;
        delete user.bankAccountNumber;
        if (user.kycProfile) {
            delete user.kycProfile.idNumber;
            delete user.kycProfile.verificationDetails;
        }
    }
    createQueryBuilder(alias) {
        const qb = super.createQueryBuilder(alias);
        if (this.request?.user?.role === 'finance_officer') {
            this.logger.warn(`finance_officer ${this.request.user.id} is querying users. Sensitive fields will be stripped post-fetch.`);
        }
        return qb;
    }
    logger = { warn: (msg) => console.warn(`[RestrictedUsersRepository] ${msg}`) };
};
exports.RestrictedUsersRepository = RestrictedUsersRepository;
exports.RestrictedUsersRepository = RestrictedUsersRepository = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.REQUEST }),
    __param(1, (0, common_1.Inject)(core_1.REQUEST)),
    __metadata("design:paramtypes", [typeorm_1.DataSource, Object])
], RestrictedUsersRepository);
//# sourceMappingURL=users.repository.js.map