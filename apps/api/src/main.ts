import { ClassSerializerInterceptor, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import 'reflect-metadata';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

// ── Item 1: Startup config validation ────────────────────────────────────────
const REQUIRED_ENV_VARS = [
    'DATABASE_URL',
    'JWT_PRIVATE_KEY',
    'JWT_PUBLIC_KEY',
    'PAYSTACK_SECRET_KEY',
    'PAYSTACK_WEBHOOK_SECRET',
    'REDIS_URL',
    'SMS_API_KEY',
    'EMAIL_FROM',
] as const;

function validateEnv(): void {
    const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        console.error(
            `[startup] Missing required environment variables: ${missing.join(', ')}. ` +
            `Set them before starting the application.`,
        );
        process.exit(1);
    }
}

async function bootstrap() {
    validateEnv();

    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    app.enableCors({
        origin: true,
        credentials: true,
    });

    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
    });

    app.use(helmet());
    app.use(compression());

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(
        new LoggingInterceptor(),
        new ClassSerializerInterceptor(app.get(Reflector)),
    );

    if (configService.get('SWAGGER_ENABLED') === 'true') {
        const config = new DocumentBuilder()
            .setTitle('Aγορά Marketplace API')
            .setDescription('Backend API for the livestock trading platform')
            .setVersion('1.0')
            .addBearerAuth()
            .build();

        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('docs', app, document);
    }

    const port = configService.get<number>('PORT', 3000);
    await app.listen(port);
    console.log(`Application running on: ${await app.getUrl()}`);
}

bootstrap();
