import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { DataSource } from 'typeorm';

@ApiTags('health')
@Controller('health')
export class HealthController {
    constructor(private readonly dataSource: DataSource) { }

    @Get()
    @ApiOperation({ summary: 'Health check endpoint' })
    @ApiResponse({ status: 200, description: 'Service is healthy' })
    async getHealth() {
        let database = 'unknown';

        try {
            await this.dataSource.query('SELECT 1');
            database = 'up';
        } catch {
            database = 'down';
        }

        return {
            status: 'ok',
            service: 'agora-api',
            database,
            timestamp: new Date().toISOString(),
        };
    }

    @Get('ready')
    @ApiOperation({ summary: 'Readiness check endpoint' })
    @ApiResponse({ status: 200, description: 'Service is ready' })
    @ApiResponse({ status: 503, description: 'Service is not ready' })
    async getReadiness(@Res({ passthrough: true }) res: Response) {
        try {
            await this.dataSource.query('SELECT 1');
            return {
                status: 'ready',
                database: 'up',
                timestamp: new Date().toISOString(),
            };
        } catch {
            res.status(HttpStatus.SERVICE_UNAVAILABLE);
            return {
                status: 'not-ready',
                database: 'down',
                timestamp: new Date().toISOString(),
            };
        }
    }
}
