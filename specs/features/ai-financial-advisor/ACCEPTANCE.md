---
feature: ai-financial-advisor
last-verified: 2026-11-15
---

# Acceptance Criteria: KI-Finanzberater & Ziel-Copilot

## Test Scenarios

### Scenario 1: On-Demand Ausgaben-Audit erkennt wiederkehrende Optimierungspotenziale

```gherkin
GIVEN a user has 6 months of historical transactions in metacent
  AND recurring outflows exist: "Telekom Mobilfunk" with 49.99 € each month
  AND discretionary spending in "Gastronomie" has risen from 120.00 € to 240.00 €/month
WHEN the user clicks "Ausgaben analysieren" in the Planning View
THEN the AI Audit completes in under 500ms
  AND an objective summary is displayed without scolding language
  AND a recommendation card "Mobilfunkvertrag prüfen" is generated with potential savings of ~35.00 €/month
  AND an interactive lever for "Gastronomie" is provided with current average "240.00 €"
```

**Status:** ✅ Passed (`src/services/__tests__/spendingAudit.test.ts`)

---

### Scenario 2: Interaktive Szenario-Simulation beschleunigt Zielerreichung in Echtzeit

```gherkin
GIVEN an active target "Japan-Reise" with remaining target balance 2,400.00 €
  AND current monthly target funding is 200.00 € (projected completion: 12 months, November 2027)
WHEN the user adjusts the "Gastronomie" savings lever slider to reduce monthly spending by 40.00 €
THEN the scenario simulator updates the target timeline in under 16ms
  AND the new projected monthly allocation is calculated as 240.00 €
  AND the new completion date is displayed as "September 2027 (2 Monate früher)"
  AND no actual budget rows are modified until "In Budget übernehmen" is clicked
```

**Status:** ✅ Passed (`src/services/__tests__/scenarioCalculations.test.ts`)

---

### Scenario 3: Datenschutz-Firewall filtert PII vor Web-Recherche vollständig heraus

```gherkin
GIVEN a transaction with payee "Vodafone D2 GmbH", memo "Kunden-Nr 123456789 Max Mustermann IBAN DE89370400440532013000", amount 59.99 €
WHEN the AI agent initiates web price research for alternative mobile plans
THEN the outbound search query contains no names, no customer numbers, and no IBAN
  AND the generated search query is sanitized to "Mobilfunk Allnet Flat 50GB 5G Deutschland monatlich kündbar Vergleich 2026"
  AND the sanitized query is logged to the local inspection drawer for user verification
```

**Status:** ✅ Passed (`src/services/__tests__/privacySanitizer.test.ts`)

---

### Scenario 4: Web-Recherche liefert strukturierte, verifizierte Markt-Alternativen

```gherkin
GIVEN a sanitized query for internet DSL alternatives is triggered
WHEN web research completes
THEN at least 2 structured alternative cards are presented
  AND each card displays: provider name, monthly price in cents, one-time fees, estimated annual savings, and direct verification link
  AND clicking the verification link opens the official provider page without affiliate parameters
```

**Status:** ✅ Passed (`src/services/__tests__/marketResearch.test.ts`)

---

### Scenario 5: Konversationelle SMART-Ziel-Konkretisierung

```gherkin
GIVEN the user opens the Goal Copilot chat and enters: "Ich will für einen Sommerurlaub sparen"
WHEN the assistant responds
THEN it asks supportive, clarifying questions regarding target amount and target month
  AND it proposes a structured target format:
    | Name          | Typ                  | Zielbetrag  | Fälligkeitsdatum |
    | Sommerurlaub  | Zielbetrag nach Datum | 1.800,00 €  | 30.06.2027       |
  AND it computes the required monthly rate based on remaining months
  AND a 1-click button "Ziel im Budget anlegen" is rendered
```

**Status:** ✅ Passed (`src/services/__tests__/goalCopilot.test.ts`)

---

### Scenario 6: Ziel-Priorisierung bei begrenztem Monats-Cashflow

```gherkin
GIVEN the user has 3 active targets requiring a total of 600.00 €/month
  AND the user's available unassigned cashflow capacity is only 400.00 €/month
WHEN the user requests advice: "Meine Sparziele übersteigen mein monatliches Budget"
THEN the AI Copilot does not criticize the user
  AND it analyzes the targets according to safety-first priority tiers:
    1. Notgroschen (Priority 1)
    2. Kfz-Reparaturrücklage (Priority 2)
    3. Neues E-Bike (Priority 3)
  AND it proposes an empathetic adjustment: fully funding Priority 1 & 2 while extending the due date of Priority 3 by 3 months
  AND the user can accept, customize, or reject the proposed rebalancing
```

**Status:** ✅ Passed (`src/services/__tests__/goalCopilot.test.ts`)

---

### Scenario 7: Überprüfung der nicht-bevormundenden Tonalität

```gherkin
GIVEN a user spending 350.00 €/month on "Hobbys & Gaming"
WHEN the AI conducts an audit or answers user questions
THEN the AI output contains 0 occurrences of moralizing words:
  | Forbidden Words: | "überflüssig", "Verschwendung", "sündigen", "schlecht", "musst aufhören" |
  AND the AI output acknowledges the user's autonomy:
    "Du entscheidest, welche Ausgaben dir wichtig sind. Wenn du bei Hobbys Einsparpotenzial siehst, könnten wir..."
```

**Status:** ✅ Passed (`src/services/__tests__/goalCopilot.test.ts`)

---

### Scenario 8: Kategorie als "Geschützte Lebensqualität" sperrt Kürzungs-Vorschläge

```gherkin
GIVEN the category "Kaffee & Bäckerei" has the toggle "Geschützte Lebensqualität" set to true
WHEN an audit is triggered or savings recommendations are computed
THEN "Kaffee & Bäckerei" is never included in savings lever recommendations
  AND the category is explicitly listed under "Geschützte Bereiche (3 Kategorien intakt)" in the audit report
```

**Status:** ✅ Passed (`src/services/__tests__/spendingAudit.test.ts`)

---

### Scenario 9: Hilfsbereiter Status bei unzureichender Historie (< 30 Tage)

```gherkin
GIVEN a freshly initialized budget with only 5 transactions
WHEN the user clicks "Ausgaben analysieren"
THEN no speculative or inaccurate trend analysis is shown
  AND a friendly informational banner explains that at least 1 month of transaction data is required for trend analysis
  AND the Goal Refinement chat remains fully accessible to create and plan new goals
```

**Status:** ✅ Passed (`src/services/__tests__/spendingAudit.test.ts`)

---

### Scenario 10: 1-Klick-Übernahme eines Sparhebels in das echte Budget

```gherkin
GIVEN a simulated scenario reducing "Streaming-Dienste" by 15.00 € and allocating 15.00 € to "Notgroschen"
WHEN the user clicks "In Budget übernehmen"
THEN the monthly target for "Notgroschen" increases by 15.00 €
  AND next month's assigned budget for "Streaming-Dienste" is adjusted to reflect the reduction
  AND the zero-based budgeting invariant is maintained:
    Total Cash == Ready to Assign + Sum(Category Available)
  AND an undo history entry is pushed onto the Ctrl+Z stack
```

**Status:** ✅ Passed (`src/services/__tests__/storage.test.ts`)

