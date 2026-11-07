---
feature: file-import
status: review
priority: high
created: 2026-11-01
updated: 2026-11-01
---

# Feature: Statement Import, Account Templates & AI Categorization

## Overview

The File Import subsystem allows users to import bank and broker statements (CSV, OFX, QFX, QIF) entirely locally. It features **account-specific saved import templates** (e.g., Trade Republic, DKB, Commerzbank) and an intelligent **hybrid categorization engine** (deterministic rules $\to$ local Ollama SLMs $\to$ optional OpenRouter fallback).

All third-party bank linking APIs are excluded: financial data remains 100% on the local device.

---

## Motivation

Users import statements regularly from different financial institutions. Each bank uses different column names, date formats (e.g., `DD.MM.YYYY` in Germany), and decimal conventions (`,` vs `.`). By saving import profiles per account and leveraging local AI categorization, the import process becomes a fast, friction-free 1-click operation.

- Related user stories: US-DI-01, US-DI-02, US-DI-03

---

## Requirements

### Functional Requirements

1. **FR-FI-01 (Account-Specific Import Profiles):**
   - Each account can have one or more saved `ImportProfile` configurations.
   - Example profile: "Trade Republic Bar-Konto"
     - Delimiter: `;`
     - Date format: `DD.MM.YYYY` (e.g. `24.10.2026`)
     - Decimal separator: `,` (e.g. `1.250,00`)
     - Column mappings:
       - Date $\to$ `Datum` / `Buchungstag`
       - Payee $\to$ `Empfänger` / `Buchungstext`
       - Amount $\to$ `Betrag` (positive/negative) or separate Inflow/Outflow columns
       - Memo $\to$ `Verwendungszweck`
       - Transaction Type $\to$ `Typ`
   - During file selection, if a CSV matches the header fingerprint of a saved profile, the profile is selected automatically.
   - Users can create, edit, test, and save new profiles directly in the import preview modal.

2. **FR-FI-02 (Format Support):**
   - **CSV**: Configurable delimiter, encoding (UTF-8, ISO-8859-1 / Windows-1252 for legacy German bank exports), and column mapping.
   - **OFX / QFX**: Native parsing of standard XML/SGML bank formats with automatic `FITID` extraction.
   - **QIF**: Standard Quicken Interchange Format parsing.

3. **FR-FI-03 (Duplicate Detection & Reconciliation Matching):**
   - Exact `FITID` match: Automatically skipped.
   - Fuzzy match against manual register transactions: Same date ($\pm 2$ days), same exact amount, and compatible payee $\to$ matches existing transaction and marks it as Cleared (`cleared_status = 'cleared'`).

4. **FR-FI-04 (Hybrid 3-Tier Categorization Engine):**
   - **Tier 1 (Deterministic Rules):**
     - Exact Payee mapping: If "Aldi Süd" was previously categorized as "Lebensmittel", assign "Lebensmittel".
     - Field-matching rules: If statement column `Typ == 'Zinsen'` $\to$ Category "Zinserträge".
     - Regex rules: Matching regex patterns in payee or memo.
   - **Tier 2 (Local Ollama SLM Inference):**
     - When Tier 1 yields no confident match and local Ollama is running (`http://localhost:11434`):
     - Sends prompt to local model (e.g., `llama3.2:3b`, `qwen2.5:3b`, `phi3.5`) containing:
       - Transaction payee and memo
       - Available category list
     - Model returns structured JSON with `category_id` and confidence score.
     - Transactions categorized by AI show a subtle mint-tinted AI indicator in the review table.
   - **Tier 3 (Optional OpenRouter Fallback):**
     - If enabled in settings and an API key is provided, user can opt to use cloud decision models for transactions that local SLM could not confidently categorize.

5. **FR-FI-05 (Import Review & Bulk Approval):**
   - Staging table showing all parsed transactions before final commit to the ledger.
   - Highlights: New transactions, auto-matched manual transactions, skipped duplicates.
   - Inline category dropdown to override suggestions before committing.
   - "Alles übernehmen" (Approve all) or selective checkboxes.
   - Corrected categorizations automatically update the rule engine and AI cache for future imports.

---

## Detailed Behavior: Trade Republic CSV Import Walkthrough

1. User selects "Trade Republic Depot/Verrechnungskonto" in metacent.
2. User clicks "Datei importieren" (`File Import`) and drops `kontoauszug_oktober.csv`.
3. metacent detects the headers: `Datum;Typ;Bezeichnung;Betrag;Saldo`.
4. The system recognizes the saved "Trade Republic" profile:
   - Maps `Datum` $\to$ Date
   - Maps `Bezeichnung` $\to$ Payee
   - Maps `Betrag` $\to$ Amount (detects German decimal comma)
   - Checks `Typ`: rows with `Zinsen` are auto-mapped to category "Kapitalerträge".
5. For a row with payee `SUMUP *CAFE KRONBERG`, Tier 1 has no match. Ollama SLM (`qwen2.5:3b`) runs in background ($\sim 180\text{ms}$) and suggests "Gastronomie / Ausgehen".
6. User reviews the staging view and clicks "Übernehmen".
7. Transactions are written to SQLite; monthly rollup counters update instantly.

---

## UI/UX References

- Mockup: `mockups/account detail - import csv to transactions.png` (updated with template selector and AI badge).

## Dependencies

- Depends on: `account-management` (Account context and saved profiles)
- Feeds into: `transaction-register` (Ledger creation)
