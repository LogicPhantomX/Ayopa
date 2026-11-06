"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("dotenv/config");
const path_1 = require("path");
const typeorm_1 = require("typeorm");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USERNAME || 'ayopa',
    password: process.env.DB_PASSWORD || 'ayopa',
    database: process.env.DB_NAME || 'ayopa',
    entities: [(0, path_1.join)(__dirname, '..', '**', '*.entity{.ts,.js}')],
    migrations: [(0, path_1.join)(__dirname, 'migrations', '*{.ts,.js}')],
    synchronize: false,
    logging: process.env.NODE_ENV !== 'production',
    ssl: (process.env.DB_HOST || 'localhost') === 'localhost'
        ? false
        : { rejectUnauthorized: false },
});
//# sourceMappingURL=data-source.js.map