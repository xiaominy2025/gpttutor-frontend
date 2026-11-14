import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { createChatHandler, createOpenAiCoach, mockCoach } from './chat.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const mode = process.env.PROCESS_COACH_MODE || 'mock';
if (!['mock', 'openai'].includes(mode)) throw new Error('PROCESS_COACH_MODE must be mock or openai.');
const coach = mode === 'mock' ? mockCoach : createOpenAiCoach({
  apiKey: process.env.PROCESS_COACH_OPENAI_API_KEY,
  model: process.env.PROCESS_COACH_OPENAI_MODEL,
});
const chat = createChatHandler(coach);

const server = await createServer({
  root,
  server: {
    host: '127.0.0.1',
    port: 5184,
    strictPort: true,
    fs: {
      deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/decision-process-coach/server/**'],
    },
  },
  plugins: [{
    name: 'local-process-coach-api',
    configureServer({ middlewares }) {
      middlewares.use('/api/decision-process/chat', (req, res, next) => {
        if (req.url !== '/' && !req.url.startsWith('/?')) return next();
        return chat(req, res);
      });
      middlewares.use('/api', (_req, res) => {
        res.writeHead(404).end();
      });
      middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] !== '/' || !req.headers.accept?.includes('text/html')) return next();
        res.writeHead(302, { Location: '/decision-process' }).end();
      });
    },
  }],
});
await server.listen();
console.log(`Decision Process Coach (${mode}) · http://127.0.0.1:5184/decision-process`);
