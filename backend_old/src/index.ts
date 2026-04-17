import 'dotenv/config';
import Fastify from 'fastify';

import { authRoutes } from './routes/auth.js';
import { analysisRoutes } from './routes/analysis.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { historyRoutes } from './routes/history.js';
import { compareRoutes } from './routes/compare.js';

// ============================================================
// Fastify App
// ============================================================

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://ciclonotorio.com.br',
];

async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  // ---- CORS ----
  fastify.addHook('onRequest', async (req, reply) => {
    const origin = req.headers.origin;
    if (typeof origin === 'string' && ALLOWED_ORIGINS.some(o => origin === o || origin.startsWith(o + '/'))) {
      reply.header('Access-Control-Allow-Origin', origin);
      reply.header('Access-Control-Allow-Credentials', 'true');
      reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');
      reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    }
  });

  fastify.options('*', async (req, reply) => {
    const origin = req.headers.origin as string | undefined;
    if (origin && ALLOWED_ORIGINS.some(o => origin === o || origin.startsWith(o + '/'))) {
      reply.header('Access-Control-Allow-Origin', origin);
      reply.header('Access-Control-Allow-Credentials', 'true');
      reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');
      reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    }
    return reply.status(200).send();
  });

  // ---- Health check ----
  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // ---- Routes ----
  await fastify.register(authRoutes, { prefix: '/api' });
  await fastify.register(analysisRoutes, { prefix: '/api' });
  await fastify.register(dashboardRoutes, { prefix: '/api' });
  await fastify.register(historyRoutes, { prefix: '/api' });
  await fastify.register(compareRoutes, { prefix: '/api' });

  // ---- Error handler ----
  fastify.setErrorHandler((err, req, reply) => {
    fastify.log.error(err);
    reply.status(500).send({ success: false, error: 'Erro interno do servidor' });
  });

  return fastify;
}

// ---- Start ----
const port = parseInt(process.env.PORT || '3000');
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';

buildApp().then(fastify => {
  fastify.listen({ port, host }, (err, addr) => {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
    console.log(`\n🚀 Ciclo Notório API rodando em ${addr}\n`);
  });
}).catch(err => {
  console.error(err);
  process.exit(1);
});
