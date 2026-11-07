---
feature: account-management
last-verified: never
---

# Acceptance Criteria: Account Management

## Test Scenarios

### Scenario 1: Create New Checking Account (Girokonto)

```gherkin
GIVEN the user clicks "+ Konto hinzufügen" in the sidebar
WHEN the user enters "DKB Girokonto" as name
  AND selects "Girokonto" under Barkonten
  AND enters "1.500,00" as current balance in EUR
  AND confirms creation
THEN "DKB Girokonto" appears in the sidebar under "BARKONTEN" displaying "1.500,00 €"
  AND an initial transaction is recorded in its register:
    | Datum | Zahlungsempfänger | Kategorie | Betrag | Status |
    | Heute | Anfangssaldo      | Bereit zur Zuweisung | +1.500,00 € | Abgeglichen (Cleared) |
  AND "Bereit zur Zuweisung" in the Plan view increases by 1.500,00 €
```

**Status:** ✅ Passed

### Scenario 2: Edit Account & Access Saved Import Profiles

```gherkin
GIVEN an account "Trade Republic" exists
WHEN the user clicks the edit pencil icon next to the account name
THEN the modal displays the nickname and notes fields
  AND a button "Import-Vorlagen verwalten" is present
  AND NO bank connection or third-party linking options are displayed
```

**Status:** ✅ Passed

### Scenario 3: Update Working Balance Triggers Adjustment

```gherkin
GIVEN an account has a Working Balance of 800,00 €
WHEN the user opens "Konto bearbeiten" and changes Working Balance to "850,00 €"
THEN the account balance becomes 850,00 €
  AND an adjustment transaction of "+50,00 €" with payee "Abstimmungs-Korrekturbuchung" is created in the register
```

**Status:** ✅ Passed
