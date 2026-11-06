import { AppealDisputeDto } from './dto/appeal-dispute.dto';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeDto } from './dto/update-dispute.dto';
import { DisputesService } from './disputes.service';
export declare class DisputesController {
    private readonly disputesService;
    constructor(disputesService: DisputesService);
    create(req: any, dto: CreateDisputeDto): Promise<import("./entities/dispute.entity").Dispute>;
    findAll(req: any): Promise<import("./entities/dispute.entity").Dispute[]>;
    findOne(id: string): Promise<import("./entities/dispute.entity").Dispute>;
    update(id: string, dto: UpdateDisputeDto, req: any): Promise<import("./entities/dispute.entity").Dispute>;
    appeal(req: any, dto: AppealDisputeDto): Promise<import("./entities/dispute.entity").Dispute>;
    sellerRespond(id: string, req: any, response: string): Promise<import("./entities/dispute.entity").Dispute>;
}
