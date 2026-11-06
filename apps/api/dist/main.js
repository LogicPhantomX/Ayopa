"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
require("reflect-metadata");
const app_module_1 = require("./app.module");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
const REQUIRED_ENV_VARS = [
    'DATABASE_URL',
    'JWT_PRIVATE_KEY',
    'JWT_PUBLIC_KEY',
    'PAYSTACK_SECRET_KEY',
    'PAYSTACK_WEBHOOK_SECRET',
    'REDIS_URL',
    'SMS_API_KEY',
    'EMAIL_FROM',
];
function validateEnv() {
    const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        console.error(`[startup] Missing required environment variables: ${missing.join(', ')}. ` +
            `Set them before starting the application.`);
        process.exit(1);
    }
}
async function bootstrap() {
    validateEnv();
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    app.enableCors({
        origin: true,
        credentials: true,
    });
    app.enableVersioning({
        type: common_1.VersioningType.URI,
        defaultVersion: '1',
    });
    app.use((0, helmet_1.default)());
    app.use((0, compression_1.default)());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor(), new common_1.ClassSerializerInterceptor(app.get(core_1.Reflector)));
    if (configService.get('SWAGGER_ENABLED') === 'true') {
        const config = new swagger_1.DocumentBuilder()
            .setTitle('Aγορά Marketplace API')
            .setDescription('Backend API for the livestock trading platform')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('docs', app, document);
    }
    const port = configService.get('PORT', 3000);
    await app.listen(port);
    console.log(`Application running on: ${await app.getUrl()}`);
}
bootstrap();
//# sourceMappingURL=main.js.map