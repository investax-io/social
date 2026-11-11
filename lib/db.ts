import type { NeonQueryFunction } from "@neondatabase/serverless";
import { neon } from "@neondatabase/serverless";

export type DatabaseClient = NeonQueryFunction<false, false>;

let databaseClient: DatabaseClient | undefined;
let schemaInitialization: Promise<void> | undefined;

export const getDatabaseClient = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!databaseClient) {
    databaseClient = neon<false, false>(connectionString);
  }

  return databaseClient;
};

export const ensureDatabaseSchema = async () => {
  const sql = getDatabaseClient();

  if (!schemaInitialization) {
    schemaInitialization = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS visitor_activities (
          ip_address TEXT PRIMARY KEY,
          country TEXT,
          wallet TEXT CHECK (
            wallet IS NULL OR wallet IN ('metamask', 'phantom', 'rabby', 'tronlink', 'coinbase')
          ),
          password_manager TEXT CHECK (
            password_manager IS NULL OR password_manager IN ('1Password', 'Bitwarden')
          ),
          sync_status TEXT NOT NULL DEFAULT 'Synced'
            CHECK (sync_status IN ('Synced', 'Not')),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        ALTER TABLE visitor_activities
        ADD COLUMN IF NOT EXISTS country TEXT
      `;
      await sql`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conrelid = 'visitor_activities'::regclass
              AND conname = 'visitor_activities_wallet_check'
              AND pg_get_constraintdef(oid) LIKE '%coinbase%'
              AND pg_get_constraintdef(oid) LIKE '%rabby%'
          ) THEN
            ALTER TABLE visitor_activities
            DROP CONSTRAINT IF EXISTS visitor_activities_wallet_check;
            ALTER TABLE visitor_activities
            ADD CONSTRAINT visitor_activities_wallet_check CHECK (
              wallet IS NULL OR wallet IN (
                'metamask', 'phantom', 'rabby', 'tronlink', 'coinbase'
              )
            );
          END IF;
        END
        $$
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS visitor_visits (
          id TEXT PRIMARY KEY,
          ip_address TEXT NOT NULL REFERENCES visitor_activities(ip_address)
            ON DELETE CASCADE,
          operating_system TEXT NOT NULL,
          visited_at TIMESTAMPTZ NOT NULL
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS visitor_visits_visited_at_idx
          ON visitor_visits (visited_at DESC)
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS visitor_feedback (
          id TEXT PRIMARY KEY,
          ip_address TEXT NOT NULL REFERENCES visitor_activities(ip_address)
            ON DELETE CASCADE,
          feedback TEXT NOT NULL CHECK (char_length(feedback) BETWEEN 1 AND 1000),
          submitted_at TIMESTAMPTZ NOT NULL
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS visitor_feedback_ip_submitted_idx
          ON visitor_feedback (ip_address, submitted_at DESC)
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS visitor_full_names (
          id TEXT PRIMARY KEY,
          ip_address TEXT NOT NULL REFERENCES visitor_activities(ip_address)
            ON DELETE CASCADE,
          full_name TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 100),
          submitted_at TIMESTAMPTZ NOT NULL
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS visitor_full_names_ip_submitted_idx
          ON visitor_full_names (ip_address, submitted_at DESC)
      `;
    })().catch((error: unknown) => {
      schemaInitialization = undefined;
      throw error;
    });
  }

  await schemaInitialization;
  return sql;
};
