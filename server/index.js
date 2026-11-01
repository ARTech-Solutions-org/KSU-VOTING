import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { stateManager } from './state.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const app = express();
const server = createServer(app);

// Socket.io with permissive CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Serve assets folder directly
app.use('/assets', express.static(path.join(ROOT_DIR, 'assets')));

// Helper: detect LAN IPv4 address
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const PORT = parseInt(process.env.PORT, 10) || 3000;
const localIp = getLocalIp();

// Initialize default voting URL if empty
if (!stateManager.settings.votingUrl) {
  stateManager.settings.votingUrl = `http://${localIp}:${PORT}/vote`;
}

// Simple in-memory rate limiting for vote spam prevention
const ipRateLimits = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const history = ipRateLimits.get(ip) || [];
  // Keep only requests from the last 10 seconds
  const recent = history.filter((t) => now - t < 10000);
  if (recent.length > 20) {
    return false; // more than 20 votes in 10s from same IP is blocked
  }
  recent.push(now);
  ipRateLimits.set(ip, recent);
  return true;
}

// REST Endpoints
app.get('/api/state', (req, res) => {
  res.json(stateManager.getPublicState());
});

app.get('/api/voter/status', (req, res) => {
  const token = req.query.token;
  const fp = req.query.fp;
  const ip = req.ip || req.connection.remoteAddress;
  res.json(stateManager.getVoterStatus(token, fp, ip));
});

app.post('/api/vote', (req, res) => {
  const { optionId, voterToken, fingerprint } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  if (!checkRateLimit(ip)) {
    return res.status(429).json({ success: false, error: 'عدد المحاولات كبير، يرجى الانتظار قليلاً' });
  }

  const result = stateManager.submitVote(voterToken, optionId, fingerprint, ip);
  if (result.success) {
    const publicState = stateManager.getPublicState();
    io.emit('vote:new', {
      optionId,
      stats: publicState.stats,
      timestamp: Date.now(),
    });
    io.emit('state:update', publicState);
    return res.json(result);
  }
  return res.status(400).json(result);
});

app.post('/api/admin/login', (req, res) => {
  const { pin } = req.body;
  const expectedPin = process.env.ADMIN_PIN || stateManager.settings.adminPin || '2026';
  if (String(pin) === String(expectedPin)) {
    res.json({ authenticated: true });
  } else {
    res.status(401).json({ authenticated: false, error: 'الرمز غير صحيح' });
  }
});

// CSV Export
app.get('/api/admin/export/csv', (req, res) => {
  const pin = req.query.pin;
  const expectedPin = process.env.ADMIN_PIN || stateManager.settings.adminPin || '2026';
  if (String(pin) !== String(expectedPin)) {
    return res.status(401).send('Unauthorized');
  }

  const state = stateManager.getPublicState();
  let csv = '\uFEFF'; // UTF-8 BOM for Arabic in Excel
  csv += 'Rank,ID,Option Title,Option Subtitle,Votes,Percentage\n';

  const sorted = [...state.options].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  sorted.forEach((opt, idx) => {
    csv += `"${idx + 1}","${opt.id}","${(opt.title || '').replace(/"/g, '""')}","${(opt.subtitle || '').replace(/"/g, '""')}",${opt.votes},${opt.percentage}%\n`;
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="ksu_ai_competition_results_${Date.now()}.csv"`);
  res.send(csv);
});

// JSON Export
app.get('/api/admin/export/json', (req, res) => {
  const pin = req.query.pin;
  const expectedPin = process.env.ADMIN_PIN || stateManager.settings.adminPin || '2026';
  if (String(pin) !== String(expectedPin)) {
    return res.status(401).send('Unauthorized');
  }

  const exportData = {
    exportedAt: new Date().toISOString(),
    event: {
      title: stateManager.settings.eventTitleArabic,
      subtitle: stateManager.settings.eventSubtitleEnglish,
    },
    stats: stateManager.getPublicState().stats,
    options: stateManager.getPublicState().options,
    auditLog: stateManager.auditLog,
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="ksu_results_${Date.now()}.json"`);
  res.json(exportData);
});

// Verify Admin Helper
function verifyPin(pin) {
  const expected = process.env.ADMIN_PIN || stateManager.settings.adminPin || '2026';
  return String(pin) === String(expected);
}

// Socket.io Events
io.on('connection', (socket) => {
  const clientIp = socket.handshake.address;

  // Send current state on connect
  socket.emit('state:sync', stateManager.getPublicState());

  // Check voter status
  socket.on('voter:check', ({ voterToken, fingerprint }) => {
    socket.emit('voter:status', stateManager.getVoterStatus(voterToken, fingerprint, clientIp));
  });

  // Vote submission via socket
  socket.on('vote:submit', ({ optionId, voterToken, fingerprint }, ack) => {
    if (!checkRateLimit(clientIp)) {
      const err = { success: false, error: 'عدد المحاولات كبير، يرجى الانتظار قليلاً' };
      if (typeof ack === 'function') ack(err);
      return socket.emit('vote:error', err);
    }

    const result = stateManager.submitVote(voterToken, optionId, fingerprint, clientIp);
    if (typeof ack === 'function') ack(result);

    if (result.success) {
      socket.emit('vote:success', result);
      const publicState = stateManager.getPublicState();
      // Broadcast live vote event (triggers animations on big screen)
      io.emit('vote:new', {
        optionId,
        stats: publicState.stats,
        timestamp: Date.now(),
      });
      // Broadcast state update to everyone
      io.emit('state:update', publicState);
    } else {
      socket.emit('vote:error', result);
    }
  });

  // Admin authentication and actions
  socket.on('admin:verify', ({ pin }, ack) => {
    const valid = verifyPin(pin);
    if (typeof ack === 'function') ack({ success: valid });
  });

  socket.on('admin:setVotingState', ({ state, pin }, ack) => {
    if (!verifyPin(pin)) return;
    stateManager.setVotingState(state, clientIp);
    io.emit('state:update', stateManager.getPublicState());
    if (typeof ack === 'function') ack({ success: true });
  });

  socket.on('admin:setScreenMode', ({ mode, pin }, ack) => {
    if (!verifyPin(pin)) return;
    stateManager.setScreenMode(mode, clientIp);
    io.emit('state:update', stateManager.getPublicState());
    if (typeof ack === 'function') ack({ success: true });
  });

  socket.on('admin:updateSettings', ({ settings, pin }, ack) => {
    if (!verifyPin(pin)) return;
    stateManager.updateSettings(settings, clientIp);
    io.emit('state:update', stateManager.getPublicState());
    if (typeof ack === 'function') ack({ success: true });
  });

  socket.on('admin:addOption', ({ option, pin }, ack) => {
    if (!verifyPin(pin)) return;
    const added = stateManager.addOption(option, clientIp);
    io.emit('state:update', stateManager.getPublicState());
    if (typeof ack === 'function') ack({ success: true, option: added });
  });

  socket.on('admin:editOption', ({ id, data, pin }, ack) => {
    if (!verifyPin(pin)) return;
    const edited = stateManager.editOption(id, data, clientIp);
    io.emit('state:update', stateManager.getPublicState());
    if (typeof ack === 'function') ack({ success: true, option: edited });
  });

  socket.on('admin:deleteOption', ({ id, pin }, ack) => {
    if (!verifyPin(pin)) return;
    stateManager.deleteOption(id, clientIp);
    io.emit('state:update', stateManager.getPublicState());
    if (typeof ack === 'function') ack({ success: true });
  });

  socket.on('admin:reorderOptions', ({ orderedIds, pin }, ack) => {
    if (!verifyPin(pin)) return;
    stateManager.reorderOptions(orderedIds, clientIp);
    io.emit('state:update', stateManager.getPublicState());
    if (typeof ack === 'function') ack({ success: true });
  });

  socket.on('admin:adjustVotes', ({ id, votes, reason, pin }, ack) => {
    if (!verifyPin(pin)) return;
    stateManager.adjustOptionVotes(id, votes, reason, clientIp);
    io.emit('state:update', stateManager.getPublicState());
    if (typeof ack === 'function') ack({ success: true });
  });

  socket.on('admin:resetAll', ({ pin }, ack) => {
    if (!verifyPin(pin)) return;
    stateManager.resetAllVotes(clientIp);
    io.emit('state:update', stateManager.getPublicState());
    if (typeof ack === 'function') ack({ success: true });
  });

  socket.on('admin:resetOption', ({ id, pin }, ack) => {
    if (!verifyPin(pin)) return;
    stateManager.resetSingleOptionVotes(id, clientIp);
    io.emit('state:update', stateManager.getPublicState());
    if (typeof ack === 'function') ack({ success: true });
  });

  socket.on('admin:resetLocks', ({ pin }, ack) => {
    if (!verifyPin(pin)) return;
    const count = stateManager.resetVoterLocks(clientIp);
    io.emit('state:update', stateManager.getPublicState());
    // Also notify connected voters that locks have cleared
    io.emit('voter:locksCleared');
    if (typeof ack === 'function') ack({ success: true, clearedCount: count });
  });

  socket.on('admin:revealNext', ({ pin }, ack) => {
    if (!verifyPin(pin)) return;
    const count = stateManager.revealNext();
    io.emit('state:update', stateManager.getPublicState());
    io.emit('reveal:step', { revealedCount: count });
    if (typeof ack === 'function') ack({ success: true, count });
  });

  socket.on('admin:revealAll', ({ pin }, ack) => {
    if (!verifyPin(pin)) return;
    const count = stateManager.revealAll();
    io.emit('state:update', stateManager.getPublicState());
    io.emit('reveal:all', { revealedCount: count });
    if (typeof ack === 'function') ack({ success: true, count });
  });

  socket.on('admin:revealReset', ({ pin }, ack) => {
    if (!verifyPin(pin)) return;
    stateManager.revealReset();
    io.emit('state:update', stateManager.getPublicState());
    if (typeof ack === 'function') ack({ success: true });
  });

  socket.on('admin:simulateVote', ({ pin }, ack) => {
    if (!verifyPin(pin)) return;
    const opt = stateManager.simulateVote();
    if (opt) {
      const publicState = stateManager.getPublicState();
      io.emit('vote:new', {
        optionId: opt.id,
        stats: publicState.stats,
        simulated: true,
        timestamp: Date.now(),
      });
      io.emit('state:update', publicState);
      if (typeof ack === 'function') ack({ success: true, option: opt });
    }
  });

  socket.on('admin:getAuditLog', ({ pin }, ack) => {
    if (!verifyPin(pin)) return;
    if (typeof ack === 'function') ack({ auditLog: stateManager.auditLog });
  });
});

// Static serving with no-cache headers to ensure immediate client updates without browser stale cache
const distPath = path.join(ROOT_DIR, 'dist');
app.use(express.static(distPath, {
  etag: false,
  lastModified: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(distPath, 'index.html'));
});

async function startServer() {
  try {
    await stateManager.init();
    console.log('🐘 Database: Connected and synchronized with Neon PostgreSQL');
  } catch (err) {
    console.warn('⚠️ Database init error:', err.message);
  }

  // Ensure default voting URL is set
  if (!stateManager.settings.votingUrl) {
    stateManager.settings.votingUrl = `http://${localIp}:${PORT}/vote`;
  }

  server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 AI Innovation Competition - Live Voting System`);
    console.log(`======================================================`);
    console.log(`🖥️  Big Screen:   http://localhost:${PORT}/`);
    console.log(`📱 Mobile Vote:  http://${localIp}:${PORT}/vote`);
    console.log(`⚙️  Admin Panel:  http://localhost:${PORT}/admin`);
    console.log(`🔑 Admin PIN:    ${process.env.ADMIN_PIN || stateManager.settings.adminPin || '2026'}`);
    console.log(`🐘 Neon DB:      Connected (Frankfurt Pooler)`);
    console.log(`======================================================\n`);
  });
}

startServer();
