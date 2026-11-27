import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyOwnerRequest } from './functions/api/_lib/auth';
import {
  runLiveChat,
  runLiveSession,
  runProviderTest,
  runTts,
  type GatewayEnv,
} from './functions/api/_lib/gateway';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT || 3000);
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '2mb' }));

  const envConfig: GatewayEnv & {
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
    OWNER_EMAIL?: string;
  } = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
    GEMINI_LIVE_GATEWAY_URL: process.env.GEMINI_LIVE_GATEWAY_URL,
    GEMINI_LIVE_MODEL: process.env.GEMINI_LIVE_MODEL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    OWNER_EMAIL: process.env.OWNER_EMAIL,
  };

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'zara-web', timestamp: new Date().toISOString() });
  });

  app.post('/api/live-session', async (req, res) => {
    const auth = await verifyOwnerRequest(req.headers.authorization, envConfig);
    if (!auth.ok) {
      res.status(auth.status ?? 401).json({ ok: false, error: auth.error });
      return;
    }
    const result = await runLiveSession(envConfig);
    res.status(result.status).json(result.body);
  });

  app.post('/api/live-chat', async (req, res) => {
    const auth = await verifyOwnerRequest(req.headers.authorization, envConfig);
    if (!auth.ok) {
      res.status(auth.status ?? 401).json({ ok: false, error: auth.error });
      return;
    }
    const result = await runLiveChat(envConfig, req.body ?? {});
    res.status(result.status).json(result.body);
  });

  app.post('/api/tts', async (req, res) => {
    const auth = await verifyOwnerRequest(req.headers.authorization, envConfig);
    if (!auth.ok) {
      res.status(auth.status ?? 401).json({ ok: false, error: auth.error });
      return;
    }
    const result = await runTts(envConfig, req.body ?? {});
    res.status(result.status).json(result.body);
  });

  app.post('/api/provider-test', async (req, res) => {
    const auth = await verifyOwnerRequest(req.headers.authorization, envConfig);
    if (!auth.ok) {
      res.status(auth.status ?? 401).json({ ok: false, error: auth.error });
      return;
    }
    const result = await runProviderTest(envConfig, req.body ?? {});
    res.status(result.status).json(result.body);
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Zara server running on http://0.0.0.0:${port}`);
  });
}

void startServer();
