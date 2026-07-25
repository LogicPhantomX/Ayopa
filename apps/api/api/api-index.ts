import 'reflect-metadata';
import { ClassSerializerInterceptor, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import compression from 'compression';
import express from 'express';
import helmet from 'helmet';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { LoggingInterceptor } from '../src/common/interceptors/logging.interceptor';

// ── Why this file exists ─────────────────────────────────────────────────────
// main.ts's bootstrap() calls app.listen(port) and keeps a process running
// forever — that's the traditional server model this app was built around
// (and still what Docker/Render/Railway/a VPS run). Vercel doesn't run a
// long-lived process at all: each request boots a function, it handles one
// request, and the runtime freezes or discards it. That model can't call
// app.listen() — it needs a plain (req, res) => void handler instead.
//
// The `server` instance is created once per cold start and reused across
// "warm" invocations of the same function instance, so most requests don't
// pay the Nest bootstrap cost again. But every cold start (new deploy, scale
// event, or after enough idle time) re-runs this whole file from scratch —
// which is exactly why the DB pool below is kept small (see database.config.ts)
// and why the fire-and-forget email/SMS calls elsewhere were changed to be
// awaited: a function can be frozen the instant it returns its response.

const server = express();
let cachedApp: Promise<express.Express> | null = null;

async function bootstrapServer(): Promise<express.Express> {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

    app.enableCors({ origin: true, credentials: true });
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.use(helmet());
    app.use(compression());
    app.useGlobalPipes(
        new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(
        new LoggingInterceptor(),
        new ClassSerializerInterceptor(app.get(Reflector)),
    );

    await app.init();
    return server;
}

export default async function handler(req: express.Request, res: express.Response) {
    if (!cachedApp) {
        // Assign synchronously before awaiting, so concurrent requests during
        // the same cold start share one bootstrap instead of racing to create
        // multiple Nest apps (and multiple DB connection pools) at once.
        cachedApp = bootstrapServer();
    }

    try {
        const expressInstance = await cachedApp;
        expressInstance(req, res);
    } catch (err) {
        // If bootstrap itself failed (e.g. a missing required env var), don't
        // leave a broken promise cached — let the next invocation retry.
        cachedApp = null;
        console.error('[serverless] Nest bootstrap failed:', err);
        res.status(500).json({ statusCode: 500, message: 'Server failed to start' });
    }
}
