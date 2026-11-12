// metacent — Embedded SQLite Database Engine (Rust Core)
// Implements specs/architecture/DATA_MODEL.md with WAL mode and memory-mapped I/O

use rusqlite::{Connection, Result};
use std::path::Path;

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn init<P: AsRef<Path>>(path: P) -> Result<Self> {
        let conn = Connection::open(path)?;

        // High performance PRAGMAs for millions of transactions
        conn.execute_batch(
            "PRAGMA journal_mode = WAL;
             PRAGMA synchronous = NORMAL;
             PRAGMA foreign_keys = ON;
             PRAGMA cache_size = -64000;
             PRAGMA mmap_size = 268435456;",
        )?;

        let db = Database { conn };
        db.create_tables()?;
        Ok(db)
    }

    pub fn init_in_memory() -> Result<Self> {
        let conn = Connection::open_in_memory()?;
        let db = Database { conn };
        db.create_tables()?;
        Ok(db)
    }

    fn create_tables(&self) -> Result<()> {
        self.conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS budgets (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                currency TEXT NOT NULL DEFAULT 'EUR',
                currency_symbol TEXT NOT NULL DEFAULT '€',
                date_format TEXT NOT NULL DEFAULT 'DD.MM.YYYY',
                language TEXT NOT NULL DEFAULT 'de-DE',
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS accounts (
                id TEXT PRIMARY KEY,
                budget_id TEXT NOT NULL REFERENCES budgets(id),
                nickname TEXT NOT NULL,
                account_type TEXT NOT NULL,
                is_favorite INTEGER NOT NULL DEFAULT 0,
                is_closed INTEGER NOT NULL DEFAULT 0,
                notes TEXT DEFAULT '',
                sort_order INTEGER NOT NULL DEFAULT 0,
                last_reconciled_at INTEGER
            );

            CREATE TABLE IF NOT EXISTS category_groups (
                id TEXT PRIMARY KEY,
                budget_id TEXT NOT NULL REFERENCES budgets(id),
                name TEXT NOT NULL,
                is_collapsed INTEGER NOT NULL DEFAULT 0,
                sort_order INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS categories (
                id TEXT PRIMARY KEY,
                group_id TEXT NOT NULL REFERENCES category_groups(id),
                name TEXT NOT NULL,
                notes TEXT DEFAULT '',
                is_hidden INTEGER NOT NULL DEFAULT 0,
                sort_order INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS targets (
                id TEXT PRIMARY KEY,
                category_id TEXT NOT NULL UNIQUE REFERENCES categories(id),
                target_type TEXT NOT NULL,
                amount_cents INTEGER NOT NULL,
                due_date TEXT,
                rollover_action TEXT NOT NULL DEFAULT 'set_aside'
            );

            CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                account_id TEXT NOT NULL REFERENCES accounts(id),
                date TEXT NOT NULL,
                payee TEXT NOT NULL,
                category_id TEXT REFERENCES categories(id),
                memo TEXT DEFAULT '',
                amount_cents INTEGER NOT NULL,
                cleared_status TEXT NOT NULL DEFAULT 'uncleared',
                is_approved INTEGER NOT NULL DEFAULT 1,
                flag INTEGER NOT NULL DEFAULT 0,
                transfer_account_id TEXT REFERENCES accounts(id),
                transfer_transaction_id TEXT REFERENCES transactions(id),
                import_fitid TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_tx_account_date ON transactions(account_id, date DESC);
            CREATE INDEX IF NOT EXISTS idx_tx_category_date ON transactions(category_id, date);
            CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date);
            CREATE INDEX IF NOT EXISTS idx_tx_import_fitid ON transactions(import_fitid);

            -- Materialized Monthly Rollup for sub-millisecond planning queries
            CREATE TABLE IF NOT EXISTS monthly_category_rollups (
                budget_id TEXT NOT NULL REFERENCES budgets(id),
                month TEXT NOT NULL,
                category_id TEXT NOT NULL REFERENCES categories(id),
                assigned_cents INTEGER NOT NULL DEFAULT 0,
                activity_cents INTEGER NOT NULL DEFAULT 0,
                note TEXT DEFAULT '',
                PRIMARY KEY (budget_id, month, category_id)
            );

            -- Materialized Monthly Account Rollups
            CREATE TABLE IF NOT EXISTS monthly_account_rollups (
                account_id TEXT NOT NULL REFERENCES accounts(id),
                month TEXT NOT NULL,
                cleared_inflows_cents INTEGER NOT NULL DEFAULT 0,
                cleared_outflows_cents INTEGER NOT NULL DEFAULT 0,
                uncleared_inflows_cents INTEGER NOT NULL DEFAULT 0,
                uncleared_outflows_cents INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (account_id, month)
            );

            CREATE TABLE IF NOT EXISTS import_profiles (
                id TEXT PRIMARY KEY,
                account_id TEXT NOT NULL REFERENCES accounts(id),
                profile_name TEXT NOT NULL,
                delimiter TEXT NOT NULL DEFAULT ';',
                date_format TEXT NOT NULL DEFAULT 'DD.MM.YYYY',
                decimal_separator TEXT NOT NULL DEFAULT ',',
                thousands_separator TEXT NOT NULL DEFAULT '.',
                header_row_index INTEGER NOT NULL DEFAULT 0,
                field_mappings TEXT NOT NULL,
                category_match_rules TEXT DEFAULT '[]',
                created_at INTEGER NOT NULL
            );
            ",
        )?;
        Ok(())
    }
}

