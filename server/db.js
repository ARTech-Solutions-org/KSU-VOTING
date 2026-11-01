import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_8HhJf9oyzkRr@ep-long-dawn-b9x95ske-pooler.c-7.eu-central-1.aws.neon.tech/neondb?sslmode=require';

export const pool = new pg.Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
});

// Initialize schema on boot
export async function initSchema() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS options (
        id VARCHAR(64) PRIMARY KEY,
        raw_name TEXT,
        title TEXT NOT NULL,
        subtitle TEXT DEFAULT '',
        votes INTEGER DEFAULT 0,
        enabled BOOLEAN DEFAULT TRUE,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS settings (
        id VARCHAR(64) PRIMARY KEY DEFAULT 'current',
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS voters (
        voter_token VARCHAR(128) PRIMARY KEY,
        count INTEGER DEFAULT 0,
        voted_option_ids JSONB DEFAULT '[]'::jsonb,
        fingerprint TEXT,
        ip TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        voter_token VARCHAR(128),
        option_id VARCHAR(64),
        ip TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        action TEXT NOT NULL,
        details JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
  } finally {
    client.release();
  }
}

// Seed options if table is empty
export async function seedOptionsIfEmpty(initialOptions) {
  const { rows } = await pool.query('SELECT COUNT(*) as count FROM options');
  if (parseInt(rows[0].count, 10) === 0) {
    for (const opt of initialOptions) {
      await pool.query(
        `INSERT INTO options (id, raw_name, title, subtitle, votes, enabled, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [opt.id, opt.rawName || opt.title, opt.title, opt.subtitle || '', opt.votes || 0, opt.enabled ?? true, opt.order ?? 0]
      );
    }
  }
}

// Seed settings if table is empty
export async function seedSettingsIfEmpty(initialSettings) {
  const { rows } = await pool.query("SELECT COUNT(*) as count FROM settings WHERE id = 'current'");
  if (parseInt(rows[0].count, 10) === 0) {
    await pool.query(
      `INSERT INTO settings (id, data, updated_at) VALUES ('current', $1, NOW())
       ON CONFLICT (id) DO NOTHING`,
      [JSON.stringify(initialSettings)]
    );
  }
}

// Fetch all options
export async function dbGetOptions() {
  const { rows } = await pool.query('SELECT * FROM options ORDER BY display_order ASC, id ASC');
  return rows.map((r) => ({
    id: r.id,
    rawName: r.raw_name,
    title: r.title,
    subtitle: r.subtitle || '',
    votes: r.votes || 0,
    enabled: r.enabled,
    order: r.display_order,
  }));
}

// Fetch settings
export async function dbGetSettings() {
  const { rows } = await pool.query("SELECT data FROM settings WHERE id = 'current'");
  if (rows.length > 0 && rows[0].data) {
    return rows[0].data;
  }
  return null;
}

// Save settings
export async function dbSaveSettings(settings) {
  await pool.query(
    `INSERT INTO settings (id, data, updated_at)
     VALUES ('current', $1, NOW())
     ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = NOW()`,
    [JSON.stringify(settings)]
  );
}

// Fetch voters into memory map
export async function dbGetVoters() {
  const { rows } = await pool.query('SELECT * FROM voters');
  const votersMap = {};
  for (const r of rows) {
    votersMap[r.voter_token] = {
      count: r.count,
      votedOptionIds: Array.isArray(r.voted_option_ids) ? r.voted_option_ids : [],
      fingerprint: r.fingerprint,
      ip: r.ip,
      updatedAt: r.updated_at ? new Date(r.updated_at).getTime() : Date.now(),
    };
  }
  return votersMap;
}

// Fetch recent audit logs
export async function dbGetAuditLog(limit = 100) {
  const { rows } = await pool.query('SELECT * FROM audit_log ORDER BY id DESC LIMIT $1', [limit]);
  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    details: r.details,
    timestamp: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
  }));
}

// Fetch recent vote history
export async function dbGetVoteHistory(limit = 500) {
  const { rows } = await pool.query('SELECT * FROM votes ORDER BY id DESC LIMIT $1', [limit]);
  return rows.map((r) => ({
    timestamp: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
    optionId: r.option_id,
  }));
}

// Save vote transaction
export async function dbRecordVote(voterToken, optionId, fingerprint, clientIp, voter) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Increment option vote count
    await client.query('UPDATE options SET votes = votes + 1 WHERE id = $1', [optionId]);

    // 2. Upsert voter record
    await client.query(
      `INSERT INTO voters (voter_token, count, voted_option_ids, fingerprint, ip, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (voter_token) DO UPDATE
       SET count = $2, voted_option_ids = $3, updated_at = NOW()`,
      [voterToken, voter.count, JSON.stringify(voter.votedOptionIds), fingerprint, clientIp]
    );

    // 3. Insert vote log
    await client.query(
      'INSERT INTO votes (voter_token, option_id, ip) VALUES ($1, $2, $3)',
      [voterToken, optionId, clientIp]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Save option edit or add
export async function dbUpsertOption(opt) {
  await pool.query(
    `INSERT INTO options (id, raw_name, title, subtitle, votes, enabled, display_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE
     SET raw_name = $2, title = $3, subtitle = $4, votes = $5, enabled = $6, display_order = $7`,
    [opt.id, opt.rawName || opt.title, opt.title, opt.subtitle || '', opt.votes || 0, opt.enabled ?? true, opt.order ?? 0]
  );
}

// Delete option
export async function dbDeleteOption(id) {
  await pool.query('DELETE FROM options WHERE id = $1', [id]);
}

// Adjust votes manually
export async function dbAdjustOptionVotes(id, votes) {
  await pool.query('UPDATE options SET votes = $1 WHERE id = $2', [votes, id]);
}

// Add audit log
export async function dbAddAuditLog(action, details) {
  await pool.query(
    'INSERT INTO audit_log (action, details) VALUES ($1, $2)',
    [action, JSON.stringify(details)]
  );
}

// Reset all
export async function dbResetAll(initialOptions) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM votes');
    await client.query('DELETE FROM voters');
    await client.query('DELETE FROM audit_log');

    if (Array.isArray(initialOptions) && initialOptions.length > 0) {
      await client.query('DELETE FROM options');
      for (const opt of initialOptions) {
        await client.query(
          `INSERT INTO options (id, raw_name, title, subtitle, votes, enabled, display_order)
           VALUES ($1, $2, $3, $4, 0, true, $5)`,
          [opt.id, opt.rawName || opt.title, opt.title, opt.subtitle || '', opt.order ?? 0]
        );
      }
    } else {
      await client.query('UPDATE options SET votes = 0');
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Reset option
export async function dbResetOption(id) {
  await pool.query('UPDATE options SET votes = 0 WHERE id = $1', [id]);
  await pool.query('DELETE FROM votes WHERE option_id = $1', [id]);
}

// Reset locks
export async function dbResetLocks() {
  await pool.query('DELETE FROM voters');
}
