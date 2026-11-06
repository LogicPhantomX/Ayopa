import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    create(dto: CreatePaymentDto): Promise<import("./entities/payment.entity").Payment>;
    updateStatus(id: string, status: string): Promise<import("./entities/payment.entity").Payment>;
}
