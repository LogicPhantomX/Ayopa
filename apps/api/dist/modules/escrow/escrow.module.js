"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscrowModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const audit_module_1 = require("../audit/audit.module");
const email_module_1 = require("../email/email.module");
const transaction_entity_1 = require("../transactions/entities/transaction.entity");
const escrow_controller_1 = require("./escrow.controller");
const escrow_event_entity_1 = require("./entities/escrow-event.entity");
const escrow_service_1 = require("./escrow.service");
let EscrowModule = class EscrowModule {
};
exports.EscrowModule = EscrowModule;
exports.EscrowModule = EscrowModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([escrow_event_entity_1.EscrowEvent, transaction_entity_1.Transaction]),
            audit_module_1.AuditModule,
            email_module_1.EmailModule,
        ],
        controllers: [escrow_controller_1.EscrowController],
        providers: [escrow_service_1.EscrowService],
        exports: [escrow_service_1.EscrowService],
    })
], EscrowModule);
//# sourceMappingURL=escrow.module.js.map