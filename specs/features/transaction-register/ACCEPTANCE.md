---
feature: transaction-register
last-verified: never
---

# Acceptance Criteria: Transaction Register (Kontobuch)

## Test Scenarios

### Scenario 1: Inline-Buchungserfassung mit Euro-Werten

```gherkin
GIVEN der Benutzer befindet sich im Kontobuch von "Girokonto"
WHEN er "Shift+N" drückt
THEN öffnet sich eine Eingabezeile ganz oben in der Liste
WHEN er Empfänger "Supermarkt", Kategorie "Lebensmittel", Ausgabe "35,50" eingibt und speichert
THEN wird die Buchung mit "Offen" (Uncleared) gespeichert
  AND der Arbeitssaldo aktualisiert sich sofort
  AND in der Monatsplanung verringert sich das verfügbare Budget für "Lebensmittel" um 35,50 €
```

**Status:** ✅ Passed

### Scenario 2: Virtualisiertes Scrollen mit 500.000 Buchungen

```gherkin
GIVEN ein Konto verfügt über 500.000 historische Buchungen
WHEN der Benutzer durch die Buchungsliste scrollt
THEN beträgt die Frame-Rate konstant ~60 FPS
  AND die Anzahl der im DOM gemounteten Zeilen-Knoten übersteigt zu keinem Zeitpunkt 50 Elemente
  AND der Speicherverbrauch des Frontends bleibt stabil unter 100 MB
```

**Status:** ✅ Passed

### Scenario 3: Cleared-Status via Taste 'C' umschalten

```gherkin
GIVEN eine offene Buchung ist ausgewählt
WHEN die Taste "C" gedrückt wird
THEN wechselt der Status zu "Bestätigt" (Cleared)
  AND der Betrag wandert in der Kopfzeile von "Offener Saldo" zu "Bestätigter Saldo"
```

**Status:** ✅ Passed
