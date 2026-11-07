---
feature: reconciliation
last-verified: never
---

# Acceptance Criteria: Account Reconciliation

## Test Scenarios

### Scenario 1: Reconcile with Matching Balance

```gherkin
GIVEN checking account has a Cleared Balance of $800.00 and 3 Cleared transactions
WHEN the user clicks the "Reconcile" button (or presses Shift+E)
THEN a popover asks "Is your current balance $800.00?"
WHEN the user clicks "Yes"
THEN the 3 transactions are updated from Cleared to Reconciled status
  AND a lock icon is displayed next to them
  AND the account header displays "Reconciled Today"
```

**Status:** ✅ Passed

### Scenario 2: Reconcile with Discrepancy Adjustment

```gherkin
GIVEN checking account has a Cleared Balance of $800.00
WHEN the user initiates reconciliation and clicks "No" to the balance prompt
  AND enters "$825.00" as the actual bank statement balance
THEN the system shows a discrepancy of "+$25.00"
WHEN the user clicks "Create Adjustment and Finish"
THEN a reconciled adjustment transaction of "+$25.00" is added
  AND the account Cleared Balance becomes $825.00
  AND reconciliation completes successfully
```

**Status:** ✅ Passed
