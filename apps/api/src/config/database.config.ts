import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export function getDatabaseConfig(configService: ConfigService): TypeOrmModuleOptions {
    const isProduction = configService.get<string>('NODE_ENV') === 'production';
    const databaseUrl = configService.get<string>('DATABASE_URL');

    // main.ts's startup check requires DATABASE_URL, but this function used to
    // ignore it entirely and read DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_NAME
    // instead. Managed Postgres providers (Neon, Supabase, Vercel Postgres) hand
    // you a single connection string, not five discrete vars — without this,
    // setting only DATABASE_URL would pass the startup check but silently try
    // to connect to localhost:5432/agora instead of the real database.
    const base: TypeOrmModuleOptions = databaseUrl
        ? { type: 'postgres', url: databaseUrl }
        : {
            type: 'postgres',
            host: configService.get<string>('DB_HOST', 'localhost'),
            port: configService.get<number>('DB_PORT', 5432),
            username: configService.get<string>('DB_USERNAME', 'agora'),
            password: configService.get<string>('DB_PASSWORD', 'agora'),
            database: configService.get<string>('DB_NAME', 'agora'),
        };

    const isLocalHost = !databaseUrl && configService.get<string>('DB_HOST', 'localhost') === 'localhost';

    return {
        ...base,
        entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
        migrations: [join(__dirname, '..', 'database', 'migrations', '*{.ts,.js}')],
        synchronize: false,
        logging: !isProduction,
        ssl: isLocalHost ? false : { rejectUnauthorized: false },
        // Serverless invocations are short-lived and can spin up many concurrent
        // cold starts; keep the pool small so a burst of function instances
        // doesn't exhaust the DB's max_connections.
        extra: { max: configService.get<number>('DB_POOL_MAX', 5) },
        migrationsRun: false,
        autoLoadEntities: true,
    };
}