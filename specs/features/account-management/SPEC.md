---
feature: account-management
status: review
priority: high
created: 2026-11-01
updated: 2026-11-01
---

# Feature: Account Management

## Overview

Account Management enables users to create, configure, organize, and edit financial accounts in **metacent**. Accounts represent real-world financial holdings (checking accounts, savings accounts, credit cards, investment clearing accounts, loans) and supply the funds that drive budget planning.

In accordance with metacent's privacy principles, all accounts are managed locally. External bank login aggregation is completely excluded. Instead, accounts feature **reusable import templates** for statement files.

---

## Requirements

### Functional Requirements

1. **FR-AM-01 (Konto anlegen / Add Account Wizard):**
   - Triggered via "+ Konto hinzufügen" in the sidebar.
   - Screen 1: "Konto hinzufügen" form:
     - Kontoname / Nickname (e.g. "DKB Girokonto", "Trade Republic Verrechnung")
     - Kontotyp auswählen (Type selector)
     - Aktueller Kontostand (Current Balance in EUR)
   - Screen 2: Kontotyp-Auswahl grouped into:
     - **Barkonten (Cash):** Girokonto (Checking), Sparkonto (Savings), Bargeld (Cash)
     - **Kreditkonten (Credit):** Kreditkarte (Credit Card), Dispositionskredit (Line of Credit)
     - **Kredite & Darlehen (Loans):** Immobilienkredit (Mortgage), Ratenkredit (Loan)
2. **FR-AM-02 (Automatische Anfangssaldo-Buchung):**
   - For accounts with a non-zero starting balance, creating the account generates an initial transaction:
     - Payee: `Anfangssaldo`
     - Category: `Zuordnung: Bereit zur Zuweisung` (for cash accounts) or NULL (for debt accounts)
     - Amount: configured starting balance
     - Status: `cleared`
3. **FR-AM-03 (Sidebar Kontenübersicht & Gruppentotale):**
   - Accounts are listed in the left sidebar grouped by category (`BARKONTEN`, `KREDITKONTEN`, `KREDITE`).
   - Group headers display aggregated balances.
   - Each account item displays: favorite star toggle, nickname, and formatted Euro balance (e.g. `1.850,00 €`).
   - Drag-and-drop or manual sort order support within groups.
4. **FR-AM-04 (Konto bearbeiten / Edit Account):**
   - Opened by clicking the pencil icon next to the account name.
   - Fields:
     - Kontoname (Nickname)
     - Notizen (Notes / Description)
     - Arbeitskontostand (Working Balance)
     - **Import-Vorlagen verwalten (Manage Import Templates)**: Link to view or edit saved CSV templates (e.g. Trade Republic, DKB) for this account.
     - Konto löschen (Delete Account - styled with muted destructive treatment and confirmation safeguard).
   - Editing the Working Balance directly generates an automatic reconciliation adjustment transaction for the difference.
5. **FR-AM-05 (Konto schließen / Archivieren):**
   - Ability to archive/close an account with zero balance so historical transaction data is preserved without cluttering the active sidebar.

---

## UI/UX References

- Mockup: `mockups/account definition window.png`
- Mockup: `mockups/account definition window 2.png`
- Mockup: `mockups/edit account screen after clicking on pen symbol near account name.png`
- *(Note: All "Link Account" and "Bank Connection" elements from original mockups are eliminated).*

## Dependencies

- Feeds into: `budget-planning` (cash balances determine "Bereit zur Zuweisung")
- Feeds into: `transaction-register` (each account has a transaction ledger)
- Feeds into: `file-import` (holds saved import profiles)
