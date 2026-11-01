import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  initSchema,
  seedOptionsIfEmpty,
  seedSettingsIfEmpty,
  dbGetOptions,
  dbGetSettings,
  dbSaveSettings,
  dbGetVoters,
  dbGetAuditLog,
  dbGetVoteHistory,
  dbRecordVote,
  dbUpsertOption,
  dbDeleteOption,
  dbAdjustOptionVotes,
  dbAddAuditLog,
  dbResetAll,
  dbResetOption,
  dbResetLocks,
} from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'store.json');

const INITIAL_OPTIONS = [
  {
    id: 'opt-1',
    rawName: 'دوائي الذكي',
    title: 'دوائي الذكي',
    subtitle: '',
    votes: 0,
    enabled: true,
    order: 0,
  },
  {
    id: 'opt-2',
    rawName: 'RxCompass Ai | بوصلة الصرف الذكي',
    title: 'RxCompass Ai',
    subtitle: 'بوصلة الصرف الذكي',
    votes: 0,
    enabled: true,
    order: 1,
  },
  {
    id: 'opt-3',
    rawName: 'جسور',
    title: 'جسور',
    subtitle: '',
    votes: 0,
    enabled: true,
    order: 2,
  },
  {
    id: 'opt-4',
    rawName: 'MedCompanion',
    title: 'MedCompanion',
    subtitle: '',
    votes: 0,
    enabled: true,
    order: 3,
  },
  {
    id: 'opt-5',
    rawName: 'PharmGuard AI',
    title: 'PharmGuard AI',
    subtitle: '',
    votes: 0,
    enabled: true,
    order: 4,
  },
  {
    id: 'opt-6',
    rawName: 'نظام إدارة ورديات صيدلية العيادات الخارجية — مستشفى الملك خالد الجامعي',
    title: 'نظام إدارة ورديات صيدلية العيادات الخارجية',
    subtitle: 'مستشفى الملك خالد الجامعي',
    votes: 0,
    enabled: true,
    order: 5,
  },
];

const INITIAL_SETTINGS = {
  votingState: 'open', // 'open' | 'paused' | 'closed'
  screenMode: 'idle', // 'idle' | 'results'
  maxVotesPerPerson: 1,
  allowSameOptionMultiple: false,
  showCounts: true,
  showPercentages: true,
  showTopN: 0, // 0 = all
  autoCycle: false,
  autoCycleInterval: 15, // seconds
  revealMode: false,
  revealedCount: 0,
  soundEnabled: false,
  testMode: false,
  eventTitleArabic: 'ذكاء يُبتكر',
  eventSubtitleEnglish: 'AI INNOVATION COMPETITION',
  votingUrl: '', // auto-detected or custom
  adminPin: process.env.ADMIN_PIN || '2026',
};

class StateManager {
  constructor() {
    this.options = JSON.parse(JSON.stringify(INITIAL_OPTIONS));
    this.settings = { ...INITIAL_SETTINGS };
    this.voters = {}; // voterToken -> { count, votedOptionIds: [], ip, updatedAt }
    this.auditLog = [];
    this.voteHistory = []; // array of { timestamp, optionId } for votes/min stats
    this.isDbConnected = false;
    this.loadFallback();
  }

  // Load from local store.json as immediate bootstrap
  loadFallback() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.options = Array.isArray(parsed.options) && parsed.options.length > 0 ? parsed.options : INITIAL_OPTIONS;
        this.settings = { ...INITIAL_SETTINGS, ...(parsed.settings || {}) };
        this.voters = parsed.voters || {};
        this.auditLog = Array.isArray(parsed.auditLog) ? parsed.auditLog : [];
        this.voteHistory = Array.isArray(parsed.voteHistory) ? parsed.voteHistory : [];
      }
    } catch (err) {
      console.warn('Fallback store.json not loaded, using defaults:', err.message);
    }
  }

  // Async initialization with Neon PostgreSQL
  async init() {
    try {
      console.log('🔌 Connecting to Neon PostgreSQL...');
      await initSchema();
      await seedOptionsIfEmpty(INITIAL_OPTIONS);
      await seedSettingsIfEmpty(INITIAL_SETTINGS);

      // Load live data from Neon DB
      const dbOptions = await dbGetOptions();
      if (dbOptions && dbOptions.length > 0) {
        this.options = dbOptions;
      }

      const dbSettings = await dbGetSettings();
      if (dbSettings) {
        this.settings = { ...INITIAL_SETTINGS, ...dbSettings };
      }

      this.voters = await dbGetVoters();
      this.auditLog = await dbGetAuditLog(100);
      this.voteHistory = await dbGetVoteHistory(500);

      this.isDbConnected = true;
      console.log(`🚀 Neon DB connected! Loaded ${this.options.length} options, ${Object.keys(this.voters).length} voters.`);
      this.saveFallback();
    } catch (err) {
      console.error('⚠️ Could not connect to Neon DB, operating with local fallback cache:', err.message);
      this.isDbConnected = false;
    }
  }

  // Local file backup
  saveFallback() {
    try {
      const data = {
        options: this.options,
        settings: this.settings,
        voters: this.voters,
        auditLog: this.auditLog.slice(-100),
        voteHistory: this.voteHistory.slice(-500),
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save store.json backup:', err.message);
    }
  }

  getPublicState() {
    const totalVotes = this.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
    const sortedOptions = [...this.options].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // Calculate percentages
    const optionsWithPct = sortedOptions.map((opt) => ({
      ...opt,
      percentage: totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0,
      exactPercentage: totalVotes > 0 ? (((opt.votes || 0) / totalVotes) * 100).toFixed(1) : '0.0',
    }));

    // Votes per minute (last 10 minutes, bucketed)
    const now = Date.now();
    const tenMinsAgo = now - 10 * 60 * 1000;
    const recentVotes = this.voteHistory.filter((v) => v.timestamp >= tenMinsAgo);
    const uniqueVotersCount = Object.keys(this.voters).length;

    return {
      options: optionsWithPct,
      settings: {
        ...this.settings,
        adminPin: undefined, // Never expose PIN in public state
      },
      stats: {
        totalVotes,
        uniqueVotersCount,
        recentVotesCount: recentVotes.length,
      },
    };
  }

  getVoterStatus(voterToken, fingerprint, clientIp) {
    if (!voterToken) {
      return { canVote: false, votesRemaining: 0, votedOptionIds: [], reason: 'no-token' };
    }

    if (this.settings.votingState !== 'open') {
      return {
        canVote: false,
        votingState: this.settings.votingState,
        reason: this.settings.votingState === 'paused' ? 'paused' : 'closed',
      };
    }

    const voter = this.voters[voterToken];
    const votesUsed = voter ? voter.count : 0;
    const maxVotes = this.settings.maxVotesPerPerson || 1;
    const votesRemaining = Math.max(0, maxVotes - votesUsed);

    return {
      canVote: votesRemaining > 0,
      votesRemaining,
      maxVotes,
      votedOptionIds: voter ? voter.votedOptionIds : [],
      votingState: this.settings.votingState,
    };
  }

  submitVote(voterToken, optionId, fingerprint, clientIp) {
    if (this.settings.votingState !== 'open') {
      return { success: false, error: this.settings.votingState === 'paused' ? 'التصويت متوقف مؤقتاً' : 'التصويت مغلق' };
    }

    const option = this.options.find((o) => o.id === optionId && o.enabled);
    if (!option) {
      return { success: false, error: 'الخيار المحدد غير متوفر' };
    }

    const maxVotes = this.settings.maxVotesPerPerson || 1;
    let voter = this.voters[voterToken];
    if (!voter) {
      voter = { count: 0, votedOptionIds: [], fingerprint, ip: clientIp, createdAt: Date.now() };
      this.voters[voterToken] = voter;
    }

    if (voter.count >= maxVotes) {
      return { success: false, error: 'لقد استنفدت عدد الأصوات المسموح بها', alreadyVoted: true };
    }

    if (!this.settings.allowSameOptionMultiple && voter.votedOptionIds.includes(optionId)) {
      return { success: false, error: 'لا يمكن التصويت لنفس الخيار أكثر من مرة', alreadyVotedOption: true };
    }

    // Cast vote in memory
    option.votes = (option.votes || 0) + 1;
    voter.count += 1;
    voter.votedOptionIds.push(optionId);
    voter.updatedAt = Date.now();

    this.voteHistory.push({ timestamp: Date.now(), optionId });
    this.saveFallback();

    // Persist to Neon DB asynchronously
    if (this.isDbConnected) {
      dbRecordVote(voterToken, optionId, fingerprint, clientIp, voter).catch((err) => {
        console.error('Failed to persist vote to Neon DB:', err.message);
      });
    }

    return {
      success: true,
      votesRemaining: Math.max(0, maxVotes - voter.count),
      votedOptionIds: voter.votedOptionIds,
      optionId,
    };
  }

  // Admin Methods
  updateSettings(newSettings, adminIp) {
    const prev = { ...this.settings };
    this.settings = { ...this.settings, ...newSettings };
    this.addAudit('update_settings', { prev, new: newSettings }, adminIp);
    this.saveFallback();

    if (this.isDbConnected) {
      dbSaveSettings(this.settings).catch((err) => console.error('DB updateSettings error:', err.message));
    }
  }

  setVotingState(newState, adminIp) {
    if (['open', 'paused', 'closed'].includes(newState)) {
      this.settings.votingState = newState;
      this.addAudit('voting_state', { newState }, adminIp);
      this.saveFallback();

      if (this.isDbConnected) {
        dbSaveSettings(this.settings).catch((err) => console.error('DB setVotingState error:', err.message));
      }
    }
  }

  setScreenMode(mode, adminIp) {
    if (['idle', 'results'].includes(mode)) {
      this.settings.screenMode = mode;
      this.saveFallback();

      if (this.isDbConnected) {
        dbSaveSettings(this.settings).catch((err) => console.error('DB setScreenMode error:', err.message));
      }
    }
  }

  addOption(data, adminIp) {
    const raw = data.rawName || `${data.title}${data.subtitle ? ' | ' + data.subtitle : ''}`;
    let title = data.title;
    let subtitle = data.subtitle || '';

    if (raw.includes('|') && !title) {
      const parts = raw.split('|').map((s) => s.trim());
      title = parts[0];
      subtitle = parts.slice(1).join(' | ');
    } else if (!title) {
      title = raw;
    }

    const newOpt = {
      id: `opt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      rawName: raw,
      title,
      subtitle,
      votes: 0,
      enabled: true,
      order: this.options.length,
    };
    this.options.push(newOpt);
    this.addAudit('add_option', { newOpt }, adminIp);
    this.saveFallback();

    if (this.isDbConnected) {
      dbUpsertOption(newOpt).catch((err) => console.error('DB addOption error:', err.message));
    }
    return newOpt;
  }

  editOption(id, data, adminIp) {
    const opt = this.options.find((o) => o.id === id);
    if (!opt) return null;

    if (data.title !== undefined) opt.title = data.title;
    if (data.subtitle !== undefined) opt.subtitle = data.subtitle;
    if (data.rawName !== undefined) opt.rawName = data.rawName;
    if (data.enabled !== undefined) opt.enabled = Boolean(data.enabled);
    if (data.order !== undefined) opt.order = Number(data.order);

    this.addAudit('edit_option', { id, data }, adminIp);
    this.saveFallback();

    if (this.isDbConnected) {
      dbUpsertOption(opt).catch((err) => console.error('DB editOption error:', err.message));
    }
    return opt;
  }

  deleteOption(id, adminIp) {
    const idx = this.options.findIndex((o) => o.id === id);
    if (idx === -1) return false;
    const removed = this.options.splice(idx, 1)[0];
    this.addAudit('delete_option', { removed }, adminIp);
    this.saveFallback();

    if (this.isDbConnected) {
      dbDeleteOption(id).catch((err) => console.error('DB deleteOption error:', err.message));
    }
    return true;
  }

  reorderOptions(orderedIds, adminIp) {
    orderedIds.forEach((id, index) => {
      const opt = this.options.find((o) => o.id === id);
      if (opt) {
        opt.order = index;
        if (this.isDbConnected) {
          dbUpsertOption(opt).catch(() => {});
        }
      }
    });
    this.options.sort((a, b) => a.order - b.order);
    this.addAudit('reorder_options', { orderedIds }, adminIp);
    this.saveFallback();
  }

  adjustOptionVotes(id, newVoteCount, reason, adminIp) {
    const opt = this.options.find((o) => o.id === id);
    if (!opt) return null;
    const oldVotes = opt.votes || 0;
    opt.votes = Math.max(0, parseInt(newVoteCount, 10) || 0);
    this.addAudit('adjust_votes', { id, title: opt.title, oldVotes, newVotes: opt.votes, reason }, adminIp);
    this.saveFallback();

    if (this.isDbConnected) {
      dbAdjustOptionVotes(id, opt.votes).catch((err) => console.error('DB adjustVotes error:', err.message));
    }
    return opt;
  }

  resetAllVotes(adminIp) {
    this.options.forEach((opt) => {
      opt.votes = 0;
    });
    this.voters = {};
    this.voteHistory = [];
    this.settings.revealedCount = 0;
    this.addAudit('reset_all_votes', {}, adminIp);
    this.saveFallback();

    if (this.isDbConnected) {
      dbResetAll(INITIAL_OPTIONS).catch((err) => console.error('DB resetAll error:', err.message));
    }
  }

  resetSingleOptionVotes(id, adminIp) {
    const opt = this.options.find((o) => o.id === id);
    if (!opt) return null;
    const oldVotes = opt.votes || 0;
    opt.votes = 0;
    this.addAudit('reset_option_votes', { id, title: opt.title, oldVotes }, adminIp);
    this.saveFallback();

    if (this.isDbConnected) {
      dbResetOption(id).catch((err) => console.error('DB resetOption error:', err.message));
    }
    return opt;
  }

  resetVoterLocks(adminIp) {
    const voterCount = Object.keys(this.voters).length;
    this.voters = {};
    this.addAudit('reset_voter_locks', { clearedVotersCount: voterCount }, adminIp);
    this.saveFallback();

    if (this.isDbConnected) {
      dbResetLocks().catch((err) => console.error('DB resetLocks error:', err.message));
    }
    return voterCount;
  }

  revealNext() {
    const enabledCount = this.options.filter((o) => o.enabled).length;
    if (this.settings.revealedCount < enabledCount) {
      this.settings.revealedCount += 1;
      this.saveFallback();
      if (this.isDbConnected) {
        dbSaveSettings(this.settings).catch(() => {});
      }
    }
    return this.settings.revealedCount;
  }

  revealAll() {
    this.settings.revealedCount = this.options.filter((o) => o.enabled).length;
    this.saveFallback();
    if (this.isDbConnected) {
      dbSaveSettings(this.settings).catch(() => {});
    }
    return this.settings.revealedCount;
  }

  revealReset() {
    this.settings.revealedCount = 0;
    this.saveFallback();
    if (this.isDbConnected) {
      dbSaveSettings(this.settings).catch(() => {});
    }
    return 0;
  }

  simulateVote() {
    const enabledOpts = this.options.filter((o) => o.enabled);
    if (enabledOpts.length === 0) return null;
    const randomOpt = enabledOpts[Math.floor(Math.random() * enabledOpts.length)];
    randomOpt.votes = (randomOpt.votes || 0) + 1;
    this.voteHistory.push({ timestamp: Date.now(), optionId: randomOpt.id, simulated: true });
    this.saveFallback();

    if (this.isDbConnected) {
      dbAdjustOptionVotes(randomOpt.id, randomOpt.votes).catch(() => {});
    }
    return randomOpt;
  }

  addAudit(action, details, ip = 'unknown') {
    const entry = {
      id: `audit-${Date.now()}`,
      timestamp: Date.now(),
      action,
      details,
      ip,
    };
    this.auditLog.push(entry);

    if (this.isDbConnected) {
      dbAddAuditLog(action, { ...details, ip }).catch(() => {});
    }
  }
}

export const stateManager = new StateManager();
