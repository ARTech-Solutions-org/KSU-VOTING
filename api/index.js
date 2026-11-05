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

// Verify Admin Helper
function verifyPin(pin) {
  const expected = process.env.ADMIN_PIN || stateManager.settings.adminPin || '2026';
  return String(pin).trim() === String(expected).trim();
}

// POST /api/admin/verify or /admin/verify
router.post('/admin/verify', (req, res) => {
  const { pin } = req.body || {};
  const valid = verifyPin(pin);
  res.json({ success: valid, error: valid ? null : 'رمز الدخول غير صحيح' });
});

// POST /api/admin/action or /admin/action
router.post('/admin/action', async (req, res) => {
  const { action, payload = {}, pin } = req.body || {};
  if (!verifyPin(pin)) {
    return res.status(401).json({ success: false, error: 'غير مصرح - رمز الدخول غير صحيح' });
  }

  const clientIp =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1';

  try {
    switch (action) {
      case 'setVotingState':
      case 'admin:setVotingState':
        stateManager.setVotingState(payload.state, clientIp);
        break;
      case 'setScreenMode':
      case 'admin:setScreenMode':
        stateManager.setScreenMode(payload.mode, clientIp);
        break;
      case 'updateSettings':
      case 'admin:updateSettings':
        stateManager.updateSettings(payload.settings, clientIp);
        break;
      case 'addOption':
      case 'admin:addOption':
        stateManager.addOption(payload.option, clientIp);
        break;
      case 'editOption':
      case 'admin:editOption':
        stateManager.editOption(payload.id, payload.data, clientIp);
        break;
      case 'deleteOption':
      case 'admin:deleteOption':
        stateManager.deleteOption(payload.id, clientIp);
        break;
      case 'reorderOptions':
      case 'admin:reorderOptions':
        stateManager.reorderOptions(payload.orderedIds, clientIp);
        break;
      case 'adjustVotes':
      case 'admin:adjustVotes':
        stateManager.adjustOptionVotes(payload.id, payload.votes, payload.reason, clientIp);
        break;
      case 'resetAll':
      case 'admin:resetAll':
        await stateManager.resetAllVotes(clientIp);
        break;
      case 'resetOption':
      case 'admin:resetOption':
        stateManager.resetSingleOptionVotes(payload.id, clientIp);
        break;
      case 'resetLocks':
      case 'admin:resetLocks':
        stateManager.resetVoterLocks(clientIp);
        break;
      case 'revealNext':
      case 'admin:revealNext':
        stateManager.revealNext();
        break;
      case 'revealAll':
      case 'admin:revealAll':
        stateManager.revealAll();
        break;
      case 'revealReset':
      case 'admin:revealReset':
        stateManager.revealReset();
        break;
      case 'simulateVote':
      case 'admin:simulateVote':
        stateManager.simulateVote();
        break;
      default:
        return res.status(400).json({ success: false, error: `إجراء غير معروف: ${action}` });
    }

    return res.json({ success: true, state: stateManager.getPublicState() });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/export/csv or /admin/export/csv
router.get('/admin/export/csv', (req, res) => {
  const pin = req.query.pin;
  if (!verifyPin(pin)) {
    return res.status(401).send('Unauthorized');
  }

  const publicState = stateManager.getPublicState();
  const rows = ['الرقم,المشروع بالإنجليزية,اسم المشروع بالعربية,الأصوات,النسبة'];
  const total = publicState.stats.totalVotes || 0;
  const sorted = [...publicState.options].sort((a, b) => (b.votes || 0) - (a.votes || 0));

  sorted.forEach((opt, idx) => {
    const pct = total > 0 ? ((opt.votes / total) * 100).toFixed(1) : '0.0';
    rows.push(`${idx + 1},"${opt.englishName || ''}","${opt.arabicName || ''}",${opt.votes || 0},${pct}%`);
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="ksu_results_${Date.now()}.csv"`);
  res.send('\uFEFF' + rows.join('\n'));
});

// GET /api/admin/export/json or /admin/export/json
router.get('/admin/export/json', (req, res) => {
  const pin = req.query.pin;
  if (!verifyPin(pin)) {
    return res.status(401).send('Unauthorized');
  }

  const exportData = {
    exportedAt: new Date().toISOString(),
    stats: stateManager.getPublicState().stats,
    options: stateManager.getPublicState().options,
    auditLog: stateManager.auditLog,
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="ksu_results_${Date.now()}.json"`);
  res.json(exportData);
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
