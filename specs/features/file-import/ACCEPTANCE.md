---
feature: file-import
last-verified: 2026-11-01
---

# Acceptance Criteria: Statement Import, Account Templates & AI Categorization

## Test Scenarios

### Scenario 1: Saved Import Profile Detection (Trade Republic)

```gherkin
GIVEN a saved import profile "Trade Republic" exists for account "TR Verrechnung" with delimiter ";" and date format "DD.MM.YYYY"
WHEN the user uploads a CSV file with header "Datum;Typ;Bezeichnung;Betrag;Saldo"
THEN the system automatically selects the "Trade Republic" import profile
  AND correctly maps:
    | Source Column | Target Field |
    | Datum         | Date         |
    | Bezeichnung   | Payee        |
    | Betrag        | Amount       |
  AND correctly parses German currency values like "1.250,50" into 125050 cents
```

**Status:** ✅ Passed

### Scenario 2: Deterministic Rule Categorization

```gherkin
GIVEN an active rule maps any payee containing "REWE" to category "Lebensmittel"
WHEN a statement with payee "REWE Filiale 412 Muenchen" is parsed
THEN the transaction category is automatically set to "Lebensmittel"
  AND the confidence indicator shows Rule-matched (100%)
```

**Status:** ✅ Passed

### Scenario 3: Local Ollama SLM Categorization Fallback

```gherkin
GIVEN an imported transaction with payee "Dr. Mueller Praxis Zahnarzt" has no deterministic rule match
  AND local Ollama is running with model "llama3.2:3b"
WHEN the import pipeline processes the transaction
THEN Ollama returns category "Gesundheit & Vorsorge"
  AND the transaction displays a subtle mint AI recommendation badge
  AND the user can accept or change the category before final commit
```

**Status:** ✅ Passed

### Scenario 4: User Correction Feeds Learning Loop

```gherkin
GIVEN an imported transaction was suggested by AI as "Freizeit"
WHEN the user manually changes the category to "Bürobedarf" and clicks "Übernehmen"
THEN the transaction is saved with category "Bürobedarf"
  AND a new categorization rule or AI cache entry is stored for that payee pattern
  AND future imports for that payee will default to "Bürobedarf"
```

**Status:** ✅ Passed

### Scenario 5: Duplicate Prevention via FITID

```gherkin
GIVEN a transaction with bank FITID "TR-2026-998811" already exists in the account
WHEN an imported OFX/CSV statement contains a row with FITID "TR-2026-998811"
THEN that row is marked as "Duplicate - Skipped" in the preview
  AND is not inserted into the transaction table
```

**Status:** ✅ Passed
