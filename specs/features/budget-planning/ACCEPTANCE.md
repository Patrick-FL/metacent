---
feature: budget-planning
last-verified: never
---

# Acceptance Criteria: Budget Planning (Monatsplanung)

## Test Scenarios

### Scenario 1: Initial Planning Display with German Terminology

```gherkin
GIVEN a new budget with cash accounts totaling 800,00 €
WHEN the user views the "Planung" view for the current month
THEN the top banner displays "800,00 € Bereit zur Zuweisung" in mint-green
  AND category groups "Fixkosten", "Bedarfe", and "Wünsche" are shown
  AND categories are displayed in clean typography WITHOUT emoji icons
  AND all columns display Euro values formatted with German decimals ("0,00 €")
```

**Status:** ✅ Passed

### Scenario 2: Instant Rollup Update on Assigned Value Change

```gherkin
GIVEN "Bereit zur Zuweisung" is 800,00 €
WHEN the user inputs "500,00" into "Miete / Hypothek" Assigned field
THEN "Bereit zur Zuweisung" updates to "300,00 €" in under 16ms
  AND "Miete / Hypothek" Verfügbar updates to "500,00 €"
  AND "Fixkosten" group totals update to "500,00 €"
  AND the monthly rollup database record is updated without table scans
```

**Status:** ✅ Passed

### Scenario 3: Over-Assignment State

```gherkin
GIVEN "Bereit zur Zuweisung" is 300,00 €
WHEN the user assigns "1.000,00" to "ÖPNV / Mobilität"
THEN the banner flips to a muted red state displaying "-700,00 €"
  AND the message "Du hast mehr zugewiesen als verfügbar" is displayed
  AND a "Korrigieren" button appears
```

**Status:** ✅ Passed

### Scenario 4: Target Funding State Indicator

```gherkin
GIVEN category "Miete" has a monthly target of 5.000,00 €
WHEN 500,00 € is assigned
THEN a warning indicator displays "4.500,00 € diesen Monat noch benötigt"
  AND when 5.000,00 € is assigned, the indicator turns into a mint-green funded pill
```

**Status:** ✅ Passed

### Scenario 5: Renaming a Category in Category Details

```gherkin
GIVEN an existing category (e.g. "Strom & Heizung") with assigned transactions across accounts
WHEN the user clicks the category and triggers "Umbenennen" in the "Kategorie-Details" inspector panel
  AND submits a new name (e.g. "Energie & Heizung")
THEN the category name is updated immediately in the budget planning table and inspector
  AND all existing transactions assigned to this category on all accounts display the updated name
  AND the count and list of linked account transactions in the inspector remain synchronized
  AND undo (Ctrl+Z) cleanly reverts the name change across all views
```

**Status:** ✅ Passed
