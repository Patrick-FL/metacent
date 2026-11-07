---
feature: reconciliation
status: review
priority: medium
created: 2026-11-01
updated: 2026-11-01
---

# Feature: Account Reconciliation

## Overview

Account Reconciliation allows users to periodically verify that their cleared register balance matches their physical bank or credit card statement. Successful reconciliation locks cleared transactions to prevent accidental modifications.

## Motivation

Reconciliation gives users complete confidence in their numbers. It guarantees that the budget matches reality and quickly isolates discrepancies to a specific date range.

- Related user stories: US-TM-04, US-NK-02 (`Shift+E`)

## Requirements

### Functional Requirements

1. **FR-RC-01 (Reconcile Trigger):**
   - User clicks the "Reconcile" button in the account header (or presses `Shift+E`).
2. **FR-RC-02 (Balance Verification Popover):**
   - Displays a popover over the header:
     - Prompt: "Is your current balance $X.XX?" (where $X.XX is the current Cleared Balance).
     - Help link: "How do I find my account balance?".
     - "Yes" and "No" action buttons.
3. **FR-RC-03 (Confirmation - "Yes" Flow):**
   - Clicking "Yes":
     - All currently Cleared transactions are marked as **Reconciled** (locked state).
     - Reconciled lock icon appears on transactions.
     - Header status updates to "Reconciled [Date]".
     - Cleared balance matches statement.
4. **FR-RC-04 (Mismatch - "No" Flow):**
   - Clicking "No":
     - Prompt asks: "What is your actual current account balance?".
     - User enters the balance shown on their bank statement.
     - System calculates difference: `Difference = Bank Balance - Cleared Balance`.
     - Guide prompts user to find missing or incorrect transactions.
     - If user cannot find the discrepancy, offers option: "Create Adjustment and Finish".
     - Creating adjustment adds a reconciled transaction for the difference.

## UI/UX References

- Mockup: `account detail - reconciliation, usually after adding monthly all transactions.png`

## Dependencies

- Depends on: `transaction-register`
