import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_8HhJf9oyzkRr@ep-long-dawn-b9x95ske-pooler.c-7.eu-central-1.aws.neon.tech/neondb?sslmode=require';

export const pool = new pg.Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function initDatabase() {
  const client = await pool.connect();
  try {
    console.log('🔄 Initializing Neon PostgreSQL schema...');

    // 1. Options Table
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
    `);

    // 2. Settings Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id VARCHAR(64) PRIMARY KEY DEFAULT 'current',
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. Voters Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS voters (
        voter_token VARCHAR(128) PRIMARY KEY,
        count INTEGER DEFAULT 0,
        voted_option_ids JSONB DEFAULT '[]'::jsonb,
        fingerprint TEXT,
        ip TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4. Votes Log Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        voter_token VARCHAR(128),
        option_id VARCHAR(64),
        ip TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 5. Audit Log Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        action TEXT NOT NULL,
        details JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    console.log('✅ Neon PostgreSQL tables verified/created successfully!');
  } finally {
    client.release();
  }
}

