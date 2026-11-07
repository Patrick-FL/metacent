---
feature: reports-reflect
status: review
priority: medium
created: 2026-11-01
updated: 2026-11-01
---

# Feature: Reflect (Reports & Analytics)

## Overview

The Reflect section provides comprehensive financial analytics through five dedicated tabs: Spending Breakdown, Spending Trends, Net Worth, Income v Expense, and Age of Money.

## Motivation

Beyond month-to-month budgeting, users need longitudinal visibility into spending habits, wealth accumulation, and financial security metrics.

- Related user stories: US-RR-01, US-RR-02, US-RR-03, US-RR-04, US-RR-05

## Requirements

### Functional Requirements

1. **FR-RR-01 (Shared Report Controls):**
   - Sub-navigation bar across all 5 report tabs: `Spending Breakdown`, `Spending Trends`, `Net Worth`, `Income v Expense`, `Age of Money`.
   - Date range selector with prev/next arrows (default: current month e.g., `Nov 2026`).
   - Category filter dropdown (`All Categories` or select specific categories).
   - Account filter dropdown (`All Accounts` or select specific accounts).
   - "Export" button for exporting report data to CSV/PDF.
2. **FR-RR-02 (Spending Breakdown Tab):**
   - Donut chart visualizing total spending split by category or group.
   - Toggle: `Categories` vs `Groups`.
   - Center of donut displays "Total Spending" amount.
   - Right-side list displaying each category/group, amount, and percentage.
   - Empty state when no spending exists: "Your spending breakdown will appear once you start recording your spending."
3. **FR-RR-03 (Spending Trends Tab):**
   - Line/area chart showing historical monthly spending over time.
   - Metric cards: "Average Monthly Spending" and "Total Spending".
   - Table at bottom displaying Month, Total Spending, and "Compared to Average".
4. **FR-RR-04 (Net Worth Tab):**
   - Stacked bar chart showing Assets (blue) vs Debts (red) over time.
   - Summary display: Net Worth amount, Assets total, Debts total, and Change in Net Worth (amount + percentage).
   - Monthly breakdown table with Net Worth and Monthly Change columns.
   - "Share Your Progress" action button.
5. **FR-RR-05 (Income v Expense Tab):**
   - Comprehensive comparative financial table:
     - Income section (All Income Sources, sub-items, Total Income).
     - Expense section (Category groups, categories, Total Expenses).
     - Net Income row: `Net Income = Total Income - Total Expenses`.
     - Columns: Selected Month(s), Average, Total.
6. **FR-RR-06 (Age of Money Tab):**
   - Metric display showing the average age in days that dollars sit in accounts between earning and spending.
   - Explanation card: "Age of Money is how long, on average, money sits in your account(s) between earning and spending it."
   - Threshold condition: Requires a minimum of 10 outflow transactions to calculate.
   - Empty state card: "Spend more money! Strange advice, we know. metacent needs a minimum of 10 transactions to calculate your Age of Money."

## UI/UX References

- Mockup: `reflect - 1.png` (Spending Breakdown)
- Mockup: `reflect - 2.png` (Spending Trends)
- Mockup: `reflect - 3.png` (Net Worth)
- Mockup: `reflect - 4.png` (Income v Expense)
- Mockup: `reflect - 5.png` (Age of Money)

## Dependencies

- Depends on: `transaction-register` (historical transaction data)
- Depends on: `account-management` (asset vs debt classification)
