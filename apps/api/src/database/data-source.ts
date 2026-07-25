import 'dotenv/config';
import { join } from 'path';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USERNAME || 'ayopa',
    password: process.env.DB_PASSWORD || 'ayopa',
    database: process.env.DB_NAME || 'ayopa',
    entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
    migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
    synchronize: false,
    logging: process.env.NODE_ENV !== 'production',
    ssl: (process.env.DB_HOST || 'localhost') === 'localhost'
        ? false
        : { rejectUnauthorized: false },
});