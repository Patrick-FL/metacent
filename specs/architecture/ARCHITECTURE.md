# metacent — System Architecture Specification

## Overview

**metacent** is a high-performance, privacy-first desktop budgeting application built with **Tauri 2.0 (Rust)** and a **React 19 / TypeScript** frontend. It is designed to run locally with zero cloud dependencies, deliver native multi-platform builds (Linux Mint, Windows, macOS), and effortlessly handle historical databases containing **millions of transactions**.

---

## Architectural Topology

```mermaid
graph TD
    subgraph UI ["Frontend (React 19 + TypeScript)"]
        PV["Plan View (Budgeting)"]
        TR["Transaction Register (Virtual Scroll)"]
        RF["Reflect Analytics (5 Tabs)"]
        ADV["AI Advisor & Goal Studio (/advisor)"]
        IMP["Importer & Template Studio"]
        STATE["TanStack Query + Zustand Client State"]
    end

    subgraph IPC ["Tauri IPC Layer"]
        CMDS["Native Commands (Direct Rust Calls)"]
        EVENTS["Reactive Balance & Calculation Events"]
    end

    subgraph RUST ["Native Engine (Rust Core)"]
        SRV["Service Layer & Domain Invariants"]
        CALC["Incremental Rollup Engine"]
        AI["AI Pipeline: Rules -> Ollama -> OpenRouter"]
        ADVISOR["AI Advisor Orchestrator & Audit Engine"]
        FIREWALL["Privacy Sanitization Gateway (Zero PII Leakage)"]
        MATH["Deterministic Goal & Scenario Math Kernel (i64 Cents)"]
        CSV["Parallel CSV / OFX Streaming Parser"]
    end

    subgraph STORAGE ["Embedded Storage"]
        SQL["SQLite (Embedded WAL Mode)"]
        ROLL["Materialized Monthly Rollups"]
    end

    subgraph EXTERNAL ["Local Daemons & Web"]
        OLL["Local Ollama Daemon (http://localhost:11434)"]
        OR["Optional OpenRouter API (Cloud opt-in)"]
        SEARCH["Web Search Provider (SearXNG / Brave / Grounding)"]
    end

    UI <--> IPC
    IPC <--> RUST
    RUST <--> STORAGE
    AI <--> OLL
    AI -.-> OR
    ADVISOR --> MATH
    ADVISOR --> FIREWALL
    FIREWALL --> SEARCH
    ADVISOR <--> OLL
    ADVISOR -.-> OR
```

---

## 1. High-Performance Calculation Engine (Handling Millions of Transactions)

### The Challenge of Large Historical Data
When a user possesses 10+ years of categorized data (1,000,000+ transactions), executing on-the-fly SQL queries like:
```sql
SELECT category_id, SUM(amount_cents) FROM transactions WHERE date BETWEEN ? AND ? GROUP BY category_id;
```
during rapid typing or navigation causes UI micro-stutters and battery drain.

### The Solution: Materialized Monthly Rollups with Incremental Deltas

1. **Precomputed State**:
   - `monthly_category_rollups` stores the aggregated `activity_cents` and `assigned_cents` for each `(budget_id, month, category_id)` tuple.
   - `monthly_account_rollups` stores monthly cleared and uncleared flow totals.

2. **$O(1)$ Incremental Delta Updates**:
   - When a transaction is created, updated, or deleted, metacent does **not** re-sum millions of rows.
   - Instead, it applies a delta directly to the target month's rollup:
     $$\Delta_{\text{activity}} = \text{new\_amount} - \text{old\_amount}$$
     $$\text{activity\_cents}_{\text{month}} \leftarrow \text{activity\_cents}_{\text{month}} + \Delta_{\text{activity}}$$
   - If a transaction's date is changed from one month to another, deltas are cleanly applied to both respective monthly rollup records.

3. **Cumulative Available Balance Propagation**:
   - The available balance of a category in month $M$ depends on the rollover from month $M-1$.
   - When a historical transaction (e.g., from 3 years ago) is modified, the delta only cascades across the **monthly summary rows** (at most 120 rows for 10 years), taking less than $0.05\text{ms}$ in Rust.

4. **Instant View Queries**:
   - Opening any month's budget view performs a single `SELECT * FROM monthly_category_rollups WHERE budget_id = ? AND month = ?`. For 50 categories, this returns 50 rows in $< 0.2\text{ms}$.

---

## 2. AI Categorization Pipeline

Transactions imported from statements often have cryptic payees (e.g., `PAYPAL *AMZN MKTPLACE`, `SUMUP *BAECKEREI 2341`). metacent employs a 3-tier cascade:

```mermaid
flowchart TD
    TX["New Imported Transaction"] --> T1{"Tier 1: Deterministic Rules\n(Regex, Exact Payee, Field match)"}
    T1 -->|Match Found| CONF["Assign Category & Confidence = 1.0"]
    T1 -->|No Match| CACHE{"Check AI Memory Cache\n(Hash match of past choices)"}
    CACHE -->|Cache Hit| CONF
    CACHE -->|Cache Miss| T2{"Tier 2: Local Ollama SLM\n(qwen2.5:3b / llama3.2:3b)"}
    T2 -->|Ollama Available & High Confidence| AUTO["Suggest Category with Indicator"]
    T2 -->|Ollama Offline or Ambiguous| T3{"Tier 3: OpenRouter API\n(If enabled by user key)"}
    T3 -->|Success| AUTO
    T3 -->|Disabled / Unavailable| MANUAL["Flag for Manual User Selection"]
    AUTO --> USER["User Confirmation / Edit"]
    MANUAL --> USER
    USER --> LEARN["Save into Rule Engine & Cache"]
```

### Tier 1: Deterministic Rule Engine (Sub-millisecond)
- Evaluates exact payee matches, regex patterns, and account-specific field rules (e.g., column `Typ == 'Dauerauftrag'`).
- Handles 80–90% of routine transactions with 0% error rate.

### Tier 2: Local Small Language Models (Ollama)
- Communicates with local Ollama (`localhost:11434`).
- Prompts small, fast models (`qwen2.5:1.5b/3b`, `llama3.2:3b`, `phi3.5`) with a structured schema and the user's active category list.
- Runs 100% locally and offline without transmitting financial data over the internet.

### Tier 3: Optional Decision / Cloud Model (OpenRouter)
- Optional user-configured fallback for maximum intelligence when local compute is constrained.
- Requires explicit user API key input.

### The Feedback Learning Loop
- When a user confirms or corrects a suggestion, metacent writes the decision into `categorization_rules` and `ai_categorization_cache`, making subsequent imports faster and smarter.

---

## 3. Account-Specific Importer Template System

Different institutions export different CSV formats:
- **Trade Republic**: Semicolon-delimited, German date `DD.MM.YYYY`, separate columns for `Typ`, `Betrag`, `Notiz`.
- **Commerzbank / DKB**: Comma or semicolon, German decimal commas (`1.234,56`), separate booking/valuta dates.

### Architecture:
- Each account can have one or more linked **`ImportProfile`** configurations.
- During CSV upload, metacent tests the file headers against saved profiles for that account.
- If a match is detected, the preview auto-maps columns immediately.
- Custom field rules in the profile can route transactions based on statement metadata (e.g., if column `Buchungstext` contains "KARTENZAHLUNG" $\to$ category "Einkauf").

---

## 4. UI Virtualization & DOM Optimization

Even though the database can query millions of rows in milliseconds, the browser DOM cannot hold 100,000 table rows without crashing.
- The transaction register uses **TanStack Virtual**.
- Only the rows visible in the viewport (+ an overscan of 5 rows above and below, ~35 rows total) are mounted as DOM elements.
- Absolute positioning translates each row based on virtual scroll offset.
- Scrolling through millions of historical transactions remains locked at 60 frames per second.

---

## 5. KI-Finanzberater & Ziel-Copilot Architektur

The AI Financial Advisor architecture is designed around four strict engineering guarantees:
1. **Zero Data Leakage**: User banking details never reach the internet.
2. **Deterministic Financial Math**: LLMs do not calculate balances or target dates; a dedicated Rust math kernel computes exact integers in cents (`i64`).
3. **Autonomous User Control**: The AI advises and simulates; the user commands.
4. **Empathetic & Non-Patronizing Tone**: Hard prompt guidelines and automated tone verification prevent moralizing or patronizing language.

```mermaid
flowchart TD
    subgraph AUDIT ["1. Spending Audit Engine"]
        TX_DATA["Local Transaction History & Monthly Rollups"] --> SCANNER["Multi-Month Variance & Anomaly Scanner"]
        SCANNER --> PATTERNS["Detect Subscriptions, Price Creep & Discretionary Spikes"]
        PATTERNS --> PROMPT_BUILDER["Build Local Context (Anonymized Totals)"]
    end

    subgraph LLM_CORE ["2. Advisor Reasoning Engine"]
        PROMPT_BUILDER --> GUARDRAIL["Tone & Policy Guardrail (Non-Patronizing Check)"]
        GUARDRAIL --> LLM["Local Ollama SLM / Optional Cloud LLM"]
        LLM --> INSIGHTS["Structured Advisory Insights & Sparhebel"]
    end

    subgraph SIMULATOR ["3. Deterministic Scenario Math Kernel"]
        INSIGHTS --> LEVER_INPUT["User Interactive Lever Adjustments"]
        LEVER_INPUT --> MATH_KERNEL["Rust / TS Integer Cent Calculation Engine"]
        MATH_KERNEL --> ACCELERATION["Recalculated Target Due Dates & Months Saved"]
    end

    subgraph FIREWALL_SEARCH ["4. Privacy-Sanitized Web Research"]
        INSIGHTS --> CANDIDATE["Identified Contract or Purchase (e.g. DSL, E-Bike)"]
        CANDIDATE --> SANITIZER["Strict Sanitizer: Strip Names, IBANs, Memos, Locations"]
        SANITIZER --> CLEAN_QUERY["Generic Market Query (e.g. 'DSL 100Mbit Allnet Deutschland 2026')"]
        CLEAN_QUERY --> WEB_SEARCH["Web Search Provider (Local SearXNG / Grounded API)"]
        WEB_SEARCH --> PARSER["Extract Verified Market Rates, Plans & Links"]
        PARSER --> COMPARISON["Comparison Cards (Monthly Price, Annual Savings, Tradeoffs)"]
    end

    SIMULATOR --> UI_VIEW["Bento-Grid UI & Interactive What-If Studio"]
    COMPARISON --> UI_VIEW
    UI_VIEW --> USER_ACTION{"User Action"}
    USER_ACTION -->|Apply Lever| BUDGET_MUTATION["Update Category Target / Assigned (Zero-Based Invariant Preserved)"]
    USER_ACTION -->|Protect Category| PROTECT_FLAG["Flag 'Geschützte Lebensqualität' (Excluded from Future Cuts)"]
    USER_ACTION -->|Dismiss| LOG_DISMISS["Train Rejection Memory"]
```

### 5.1 Privacy Sanitization Gateway
Before any web search is initiated, candidate queries pass through a multi-pass regex and token stripper:
- Strips IBANs (`[A-Z]{2}[0-9]{2}[0-9A-Z]{11,30}`), BIC/SWIFT, account numbers.
- Strips personal names, street addresses, postal codes, and email addresses.
- Normalizes specific transaction amounts into market segment queries (e.g., a 49,99 € phone bill becomes "Mobilfunk Allnet Flat unbegrenzt/25GB").
- Logs sanitized query text to SQLite (`ai_market_researches.sanitized_query`), enabling full user auditability.

### 5.2 Deterministic Target & Scenario Engine
Given a target goal with remaining cents $R$, current monthly allocation $A$, and a proposed savings lever $\Delta s$:
$$\text{Baseline Months} = \left\lceil \frac{R}{A} \right\rceil$$
$$\text{Simulated Months} = \left\lceil \frac{R}{A + \Delta s} \right\rceil$$
$$\text{Months Accelerated} = \text{Baseline Months} - \text{Simulated Months}$$
All arithmetic is executed in `i64` minor units. Overspending risk in other categories is cross-checked before declaring feasibility.

