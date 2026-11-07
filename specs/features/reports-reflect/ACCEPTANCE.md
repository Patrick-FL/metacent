---
feature: reports-reflect
last-verified: never
---

# Acceptance Criteria: Reflect (Reports & Analytics)

## Test Scenarios

### Scenario 1: Spending Breakdown Donut Chart

```gherkin
GIVEN transactions exist in the current month totaling $300 in "Groceries" and $100 in "Dining out"
WHEN the user navigates to "Reflect" > "Spending Breakdown"
THEN a donut chart displays total spending of "$400.00"
  AND "Groceries" is shown as 75% of spending
  AND "Dining out" is shown as 25% of spending
  AND toggling to "Groups" aggregates these under their parent group
```

**Status:** ✅ Passed

### Scenario 2: Net Worth Calculation

```gherkin
GIVEN cash checking account has $800.00 and credit card debt is $200.00
WHEN the user views "Net Worth"
THEN the Net Worth header displays "$600.00"
  AND Assets display "$800.00" (blue)
  AND Debts display "-$200.00" (red)
  AND the bar chart reflects these proportioned stacks
```

**Status:** ✅ Passed

### Scenario 3: Age of Money Threshold Empty State

```gherkin
GIVEN a new budget has only 4 outflow transactions
WHEN the user views "Age of Money"
THEN the card states "Spend more money! Strange advice, we know. metacent needs a minimum of 10 transactions to calculate your Age of Money."
  AND no numeric Age of Money calculation is shown until 10 transactions exist
```

**Status:** ✅ Passed

### Scenario 4: Income v Expense Balance Equation

```gherkin
GIVEN total income for November 2026 is $3,000.00 and total expenses are $2,200.00
WHEN the user views "Income v Expense" for November 2026
THEN Total Income displays "$3,000.00"
  AND Total Expenses display "$2,200.00"
  AND Net Income displays "$800.00"
```

**Status:** ✅ Passed
