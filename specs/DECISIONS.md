# Architecture Decision Records (ADRs)

This document tracks key architectural and design decisions for **metacent**.

---

### ADR-001: Zero-Based Envelope Budgeting Methodology
- **Date:** 2026-11-01
- **Status:** accepted
- **Context:** The application needs a clear budgeting philosophy to guide data modeling, UI design, and user workflows.
- **Decision:** Adopt the zero-based envelope budgeting methodology ("give every dollar a job"):
  - Inflows increase "Ready to Assign".
  - Users explicitly assign every dollar into categories until "Ready to Assign" reaches $0.00.
  - Spending decreases category "Available" balances.
- **Rationale:** Proven methodology that actively prevents overspending and forces intentional financial trade-offs.

---

### ADR-002: Integer Minor Units for Monetary Values
- **Date:** 2026-11-01
- **Status:** accepted
- **Context:** Financial applications suffer from precision loss and rounding errors when using IEEE-754 floating-point numbers.
- **Decision:** Store all currency amounts as integers representing the smallest unit (cents for EUR, e.g., 100,50 € is stored as `10050`).
- **Rationale:** Guarantees arithmetic accuracy without precision errors across calculations, aggregations, and balances.

---

### ADR-003: Local-First Desktop Web Architecture
- **Date:** 2026-11-01
- **Status:** accepted
- **Context:** Financial data is sensitive. Users require complete privacy and offline capability.
- **Decision:** Design metacent as local-first: data is stored on the user's local machine.

---

### ADR-004: Three-State Transaction Reconciliation Lifecycle
- **Date:** 2026-11-01
- **Status:** accepted
- **Context:** Users need confidence that their recorded transactions match actual bank statements.
- **Decision:** Model transactions with three lifecycle states: `uncleared`, `cleared`, and `reconciled`.

---

### ADR-005: Multi-Format Bank File Import with Automatic Duplicate Matching
- **Date:** 2026-11-01
- **Status:** accepted
- **Context:** Users need an easy way to load transactions without bank connections.
- **Decision:** Implement client-side parsing for OFX, QFX, QIF, and CSV files with rule-based deduplication against manual transactions.

---

### ADR-006: Tauri 2.0 (Rust) + Native Embedded SQLite for High-Speed Cross-Platform Execution
- **Date:** 2026-11-01
- **Status:** accepted
- **Context:** The application must run locally on Linux Mint OS, Windows, and macOS with zero compromise on execution speed and minimal resource usage.
- **Decision:** Build metacent using **Tauri 2.0** with a native **Rust** core and an embedded **SQLite** database (WAL mode, memory-mapped I/O), paired with a **React 19 / TypeScript** UI.
- **Rationale:**
  - Compiles directly to native packages (`.deb`, `AppImage`, `.exe`, `.msi`, `.dmg`).
  - Rust + SQLite provides maximum computational throughput for millions of records with memory footprint $< 50\text{MB}$ (compared to Electron's $> 350\text{MB}$).
  - Full access to local file systems and local daemons (Ollama) without web sandbox limitations.

---

### ADR-007: Materialized Monthly Rollup Architecture for Millions of Historical Transactions
- **Date:** 2026-11-01
- **Status:** accepted
- **Context:** Users possess years of categorical and transaction data. Dynamically re-aggregating millions of rows on every keystroke or view render causes latency.
- **Decision:** Maintain precomputed monthly summaries (`monthly_category_rollups` and `monthly_account_rollups`) with $O(1)$ incremental delta updates upon transaction mutations.
- **Rationale:**
  - Month budget views query only the ~50 category rollup rows for that specific month ($< 0.2\text{ms}$).
  - Modifying historical transactions cascades updates only across the small array of subsequent monthly rollup records, completely avoiding full-table scans.

---

### ADR-008: 3-Tier Categorization Engine (Deterministic -> Local Ollama SLM -> OpenRouter)
- **Date:** 2026-11-01
- **Status:** accepted
- **Context:** Automated categorization of imported transactions is needed, but user financial data must remain strictly private.
- **Decision:** Implement a three-tier categorization hierarchy:
  1. **Deterministic Rule Engine:** Exact payee matches, regex, and account-specific column matches.
  2. **Local Small Language Models (Ollama):** Local inference via `localhost:11434` (e.g. `llama3.2:3b`, `qwen2.5:3b`) without cloud transmission.
  3. **Cloud Decision Models (OpenRouter):** Optional user opt-in fallback via API key.
- **Rationale:** Maximizes speed and privacy for routine transactions while leveraging AI intelligence for ambiguous or novel payees.

---

### ADR-009: Saved Account-Specific Importer Templates
- **Date:** 2026-11-01
- **Status:** accepted
- **Context:** Users import from diverse institutions (e.g., Trade Republic, Commerzbank, DKB) that have idiosyncratic CSV formats and column headers.
- **Decision:** Allow users to save reusable `ImportProfile` configurations per account, storing delimiter, date format, decimal separator, column mappings, and custom category-matching field rules.
- **Rationale:** Turns subsequent imports into a seamless 1-click operation and ensures accurate categorization based on institution-specific metadata.

---

### ADR-010: Complete Elimination of Third-Party Bank Connectors
- **Date:** 2026-11-01
- **Status:** accepted
- **Context:** The user specified that no external bank connection services (such as Plaid, Finicity, Salt Edge) will be used.
- **Decision:** Strip out all bank connection buttons, credentials storage, third-party aggregation APIs, and UI references.
- **Rationale:** Enforces strict local-first privacy, zero ongoing subscription costs, and avoids security risks associated with sharing banking credentials.

---

### ADR-011: Minimalist Apple/Nothing OS Design System with Mint-Green Accent
- **Date:** 2026-11-01
- **Status:** accepted
- **Context:** The visual aesthetic must be clean, distraction-free, and high-contrast, matching the new bamboo logo.
- **Decision:** Adopt a monochrome foundation with low highlighting, using mint-green (`#ADEBB3`) strictly as a functional accent. Remove all emoji icons from categories and use 100% single-color line icons.
- **Rationale:** High information density, reduced visual fatigue during long budgeting sessions, and modern, elegant product aesthetics.
