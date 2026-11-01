import express from 'express';
import cors from 'cors';
import { stateManager } from '../server/state.js';

const app = express();

// Permissive CORS for cross-origin access
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-voter-token'],
  })
);
app.use(express.json());

// Initialize state manager on cold start
let isInitialized = false;
let initPromise = null;

async function ensureInit() {
  if (isInitialized) return;
  if (!initPromise) {
    initPromise = stateManager
      .init()
      .then(() => {
        isInitialized = true;
      })
      .catch((err) => {
        console.error('State manager initialization error:', err.message);
        initPromise = null; // allow retry on next request
      });
  }
  return initPromise;
}

// Middleware to ensure DB connection is ready
app.use(async (req, res, next) => {
  try {
    await ensureInit();
  } catch (err) {
    console.warn('DB initialization pending/failed:', err.message);
  }
  next();
});

// Router for all voting endpoints
const router = express.Router();

// GET /api/state or /state
router.get('/state', (req, res) => {
  const publicState = stateManager.getPublicState();
  const host = req.get('host');
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';

  // If votingUrl is unset, empty, or localhost on a cloud domain, auto-point to the cloud deployment
  if (
    !publicState.settings.votingUrl ||
    publicState.settings.votingUrl.includes('localhost') ||
    publicState.settings.votingUrl.includes('127.0.0.1')
  ) {
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      publicState.settings.votingUrl = `${proto}://${host}/vote`;
    }
  }

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.json(publicState);
});

// GET /api/voter/status or /voter/status
router.get('/voter/status', (req, res) => {
  const token = req.query.token;
  const fp = req.query.fp;
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1';

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.json(stateManager.getVoterStatus(token, fp, ip));
});

// POST /api/vote or /vote
router.post('/vote', (req, res) => {
  const { optionId, voterToken, fingerprint } = req.body || {};
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1';

  if (!optionId || !voterToken) {
    return res.status(400).json({ success: false, error: 'بيانات التصويت غير مكتملة' });
  }

  const result = stateManager.submitVote(voterToken, optionId, fingerprint, ip);
  res.json(result);
});

// GET /api/health or /health
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    dbConnected: stateManager.isDbConnected,
    optionsCount: stateManager.options.length,
    totalVotes: stateManager.stats.totalVotes,
    timestamp: new Date().toISOString(),
  });
});

// Mount router on BOTH '/api' and '/' to guarantee matching in any Vercel rewrite mode
app.use('/api', router);
app.use('/', router);

export default app;
