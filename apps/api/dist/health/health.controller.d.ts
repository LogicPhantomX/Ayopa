import { Response } from 'express';
import { DataSource } from 'typeorm';
export declare class HealthController {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    getHealth(): Promise<{
        status: string;
        service: string;
        database: string;
        timestamp: string;
    }>;
    getReadiness(res: Response): Promise<{
        status: string;
        database: string;
        timestamp: string;
    }>;
}
