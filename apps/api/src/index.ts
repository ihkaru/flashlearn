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

import { join } from 'node:path';
import { existsSync, statSync } from 'node:fs';

const port = Number(process.env.PORT) || 3001;
const publicDir = process.env.PUBLIC_DIR || join(import.meta.dir, '../../web/dist');

const app = new Elysia()
  .use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    })
  )
  .use(
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
  )
  .get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'flashlearn-api',
  }))
  .use(authController)
  .use(workspaceController)
  .use(contentController)
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
    if (existsSync(publicDir)) {
      const cleanPath = path.replace(/^\//, '');
      const candidate = join(publicDir, cleanPath);
      if (cleanPath && existsSync(candidate) && !statSync(candidate).isDirectory()) {
        if (cleanPath.startsWith('assets/')) {
          set.headers['Cache-Control'] = 'public, max-age=31536000, immutable';
        } else {
          set.headers['Cache-Control'] = 'public, max-age=3600';
        }
        return Bun.file(candidate);
      }
      set.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      return Bun.file(join(publicDir, 'index.html'));
    }
    return { message: '⚡ FlashLearn API Engine is operational. Web build not mounted.' };
  })
  .listen(port);

console.log(`⚡ FlashLearn API is running at http://localhost:${port}`);
console.log(`📖 OpenAPI Scalar Docs available at http://localhost:${port}/docs`);
