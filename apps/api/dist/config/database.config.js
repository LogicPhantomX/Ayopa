"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseConfig = getDatabaseConfig;
const path_1 = require("path");
function getDatabaseConfig(configService) {
    const isProduction = configService.get('NODE_ENV') === 'production';
    const databaseUrl = configService.get('DATABASE_URL');
    const base = databaseUrl
        ? { type: 'postgres', url: databaseUrl }
        : {
            type: 'postgres',
            host: configService.get('DB_HOST', 'localhost'),
            port: configService.get('DB_PORT', 5432),
            username: configService.get('DB_USERNAME', 'ayopa'),
            password: configService.get('DB_PASSWORD', 'ayopa'),
            database: configService.get('DB_NAME', 'ayopa'),
        };
    const isLocalHost = !databaseUrl && configService.get('DB_HOST', 'localhost') === 'localhost';
    return {
        ...base,
        entities: [(0, path_1.join)(__dirname, '..', '**', '*.entity{.ts,.js}')],
        migrations: [(0, path_1.join)(__dirname, '..', 'database', 'migrations', '*{.ts,.js}')],
        synchronize: false,
        logging: !isProduction,
        ssl: isLocalHost ? false : { rejectUnauthorized: false },
        extra: { max: configService.get('DB_POOL_MAX', 5) },
        migrationsRun: false,
        autoLoadEntities: true,
    };
}
//# sourceMappingURL=database.config.js.map