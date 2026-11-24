import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { authController } from './infrastructure/http/controllers/auth.controller';
import { workspaceController } from './infrastructure/http/controllers/workspace.controller';
import { contentController } from './infrastructure/http/controllers/content.controller';
import { quizController } from './infrastructure/http/controllers/quiz.controller';
import { apiKeyController } from './infrastructure/http/controllers/apikey.controller';
import { sourceController } from './infrastructure/http/controllers/source.controller';
import { competencyController } from './infrastructure/http/controllers/competency.controller';
import { taskController } from './infrastructure/http/controllers/task.controller';
import { gateController } from './infrastructure/http/controllers/gate.controller';
import { reviewerController } from './infrastructure/http/controllers/reviewer.controller';
import { spacedController } from './infrastructure/http/controllers/spaced.controller';
import { auditController } from './infrastructure/http/controllers/audit.controller';
import { diagnosticController } from './infrastructure/http/controllers/diagnostic.controller';
import { consensusController } from './infrastructure/http/controllers/consensus.controller';
import { driftController } from './infrastructure/http/controllers/drift.controller';
import { credentialController } from './infrastructure/http/controllers/credential.controller';
import { domainController } from './infrastructure/http/controllers/domain.controller';
import { socraticChatController } from './infrastructure/http/controllers/socratic-chat.controller';
import { interactiveController } from './infrastructure/http/controllers/interactive.controller';
import { mediaController } from './infrastructure/http/controllers/media.controller';
import { container } from './infrastructure/di/container';
import { resolveAuth } from './infrastructure/http/middlewares/auth';
import { InMemoryTokenBucketLimiter, resolveClientIp } from './infrastructure/http/middlewares/rate-limiter';
import { BackgroundWorkerDaemon } from './worker';

import { join, resolve, sep } from 'node:path';
import { existsSync, statSync } from 'node:fs';

const port = Number(process.env.PORT) || 3001;
const publicDir = process.env.PUBLIC_DIR || join(import.meta.dir, '../../web/dist');
const resolvedPublicDir = resolve(publicDir);
const isProduction = process.env.NODE_ENV === 'production';

function buildCorsOrigin(): boolean | string[] | ((request: Request) => boolean) {
  const raw = process.env.CORS_ALLOWED_ORIGINS || '';
  const configured = raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (configured.length > 0) {
    return configured;
  }
  if (isProduction) {
    return false;
  }
  return (request: Request) => {
    const origin = request.headers.get('origin');
    if (!origin) return true;
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
  };
}

const authRateLimiter = new InMemoryTokenBucketLimiter(30, 0.5);
const socraticRateLimiter = new InMemoryTokenBucketLimiter(60, 1);

let app = new Elysia()
  .use(
    cors({
      origin: buildCorsOrigin(),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-api-key', 'x-learner-session'],
    })
  )
  .onBeforeHandle(({ path, headers, set }) => {
    if (process.env.NODE_ENV === 'test') return;
    if (path.startsWith('/api/v1/auth/')) {
      const check = authRateLimiter.consume(`auth:${resolveClientIp(headers)}`);
      if (!check.allowed) {
        set.status = 429;
        set.headers['Retry-After'] = String(check.retryAfterSeconds);
        return { error: 'Too Many Requests: Auth rate limit exceeded' };
      }
    } else if (path.startsWith('/api/v1/socratic/')) {
      const check = socraticRateLimiter.consume(`socratic:${resolveClientIp(headers)}`);
      if (!check.allowed) {
        set.status = 429;
        set.headers['Retry-After'] = String(check.retryAfterSeconds);
        return { error: 'Too Many Requests: Socratic tutor rate limit exceeded' };
      }
    }
  })
  .onAfterHandle(({ set }) => {
    set.headers['X-Content-Type-Options'] = 'nosniff';
    set.headers['X-Frame-Options'] = 'DENY';
    set.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
    set.headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()';
    if (isProduction) {
      set.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
    }
  });

const enableDocs = !isProduction || process.env.ENABLE_API_DOCS === 'true';
if (enableDocs) {
  app = app.use(
    swagger({
      provider: 'scalar',
      path: '/docs',
      documentation: {
        info: {
          title: '⚡ FlashLearn API Engine',
          version: '1.0.0',
          description:
            'Hexagonal Architecture Educational Engine with Material, Quiz, 3D Flashcards, and Scoped API Keys.',
          contact: {
            name: 'FlashLearn Engineering Team',
            url: 'https://github.com/ipds6104/flashlearn',
          },
        },
        tags: [
          { name: 'Authentication', description: 'Google Identity Services OAuth and JWT sessions' },
          { name: 'Workspaces', description: 'Isolated creator workspaces and public discovery' },
          { name: 'Contents', description: 'Materi, Quiz, and Combined educational objects' },
          { name: 'Quiz & Flashcards', description: 'Quiz evaluations and post-quiz 3D flashcards' },
          { name: 'API Keys', description: 'Developer programmatic CRUD authorization' },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT or API Key (fl_live_...)',
              description: 'Pass standard JWT token or scoped API Key (fl_live_...) in Authorization header',
            },
          },
        },
      },
    })
  ) as any;
}

app
  .get('/health', async ({ query }) => {
    const deep = query?.deep === 'true' || query?.deep === '1';
    const aiGateway = deep && container.aiGateway.healthCheck
      ? await container.aiGateway.healthCheck()
      : undefined;
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'flashlearn-api',
      ...(aiGateway ? { aiGateway } : {}),
    };
  })
  .get('/api/v1/health/ai', async ({ headers, set }) => {
    if (isProduction) {
      const auth = await resolveAuth(headers);
      if (!auth.user || auth.role !== 'superadmin') {
        set.status = 403;
        return { error: 'Forbidden: AI gateway health diagnostics require superadmin role in production' };
      }
    }
    const status = container.aiGateway.healthCheck
      ? await container.aiGateway.healthCheck()
      : { configured: false, reachable: false, baseUrl: '', defaultModel: '' };
    if (!status.configured || !status.reachable) {
      set.status = 503;
    }
    return status;
  })
  .use(authController)
  .use(workspaceController)
  .use(contentController)
  .use(interactiveController)
  .use(mediaController)
  .use(quizController)
  .use(apiKeyController)
  .use(sourceController)
  .use(competencyController)
  .use(taskController)
  .use(gateController)
  .use(reviewerController)
  .use(spacedController)
  .use(auditController)
  .use(diagnosticController)
  .use(consensusController)
  .use(driftController)
  .use(credentialController)
  .use(domainController)
  .use(socraticChatController)
  .get('/c/:id', ({ params, redirect }: any) => redirect(`/#/content/${params.id}`, 302))
  .get('/content/:id', ({ params, redirect }: any) => redirect(`/#/content/${params.id}`, 302))
  .get('/workspace/:id', ({ params, redirect }: any) => redirect(`/#/workspace/${params.id}`, 302))
  .all('*', ({ path, set }: any) => {
    if (path.startsWith('/api') || path.startsWith('/docs') || path.startsWith('/health')) {
      return;
    }
    if (existsSync(resolvedPublicDir)) {
      const cleanPath = path.replace(/^\/+/, '');
      const candidate = resolve(resolvedPublicDir, cleanPath);
      if (
        cleanPath &&
        candidate.startsWith(resolvedPublicDir + sep) &&
        existsSync(candidate) &&
        !statSync(candidate).isDirectory()
      ) {
        if (cleanPath.startsWith('assets/')) {
          set.headers['Cache-Control'] = 'public, max-age=31536000, immutable';
        } else {
          set.headers['Cache-Control'] = 'public, max-age=3600';
        }
        return Bun.file(candidate);
      }
      set.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      return Bun.file(join(resolvedPublicDir, 'index.html'));
    }
    return { message: '⚡ FlashLearn API Engine is operational. Web build not mounted.' };
  })
  .listen(port);

console.log(`⚡ FlashLearn API is running at http://localhost:${port}`);
if (enableDocs) {
  console.log(`📖 OpenAPI Scalar Docs available at http://localhost:${port}/docs`);
}

if (import.meta.main && process.env.DISABLE_EMBEDDED_WORKER !== 'true') {
  const intervalMs = Number(process.env.WORKER_INTERVAL_MS) || 60000;
  const embeddedWorker = new BackgroundWorkerDaemon(intervalMs);
  embeddedWorker.start();
}
