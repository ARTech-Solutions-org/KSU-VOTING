import express from 'express';
import cors from 'cors';
import { stateManager } from '../server/state.js';

const app = express();
app.use(cors());
app.use(express.json());

let isInitialized = false;
async function ensureInit() {
  if (!isInitialized) {
    try {
      await stateManager.init();
      isInitialized = true;
    } catch (err) {
      console.error('State manager initialization error:', err);
    }
  }
}

app.use(async (req, res, next) => {
  await ensureInit();
  next();
});

// GET state
app.get('/api/state', (req, res) => {
  res.json(stateManager.getPublicState());
});

// GET voter status
app.get('/api/voter/status', (req, res) => {
  const token = req.query.token;
  const fp = req.query.fp;
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '127.0.0.1';
  res.json(stateManager.getVoterStatus(token, fp, ip));
});

// POST submit vote
app.post('/api/vote', (req, res) => {
  const { optionId, voterToken, fingerprint } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '127.0.0.1';
  const result = stateManager.submitVote(voterToken, optionId, fingerprint, ip);
  res.json(result);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', dbConnected: stateManager.isDbConnected });
});

export default app;

