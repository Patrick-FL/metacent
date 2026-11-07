---
feature: transaction-register
status: review
priority: high
created: 2026-11-01
updated: 2026-11-01
---

# Feature: Transaction Register (Kontobuch & Buchungsliste)

## Overview

The Transaction Register provides a lightning-fast, keyboard-accessible ledger for every account in **metacent**. Powered by **DOM virtualization**, it effortlessly renders accounts containing hundreds of thousands or millions of historical transactions with fluid 60fps scrolling and instantaneous inline editing.

All third-party bank linking elements are removed.

---

## Requirements

### Functional Requirements

1. **FR-TR-01 (Kopfbereich & Salden-Gleichung):**
   - Header shows: Kontoname, Favoriten-Stern, Kontotyp-Badge, Abstimmungsstatus ("Noch nicht abgestimmt" / "Abgestimmt am DD.MM.YYYY").
   - Live balance equation:
     $$\text{Bestätigter Saldo (Cleared)} + \text{Offener Saldo (Uncleared)} = \text{Arbeitssaldo (Working Balance)}$$
     Displayed in mint-green tabular numerals (e.g. `800,00 € + 0,00 € = 800,00 €`).
   - "Abstimmen" action button (`Shift+E`).
2. **FR-TR-02 (Aktionsleiste / Toolbar):**
   - `+ Buchung hinzufügen` (`Shift+N`)
   - `Datei importieren` (Opens file import modal with saved profile presets)
   - `Rückgängig` (`Ctrl+Z`), `Wiederholen` (`Ctrl+Shift+Z`)
   - Volltext-Suchleiste (`Payee`, `Kategorie`, `Notiz`, `Betrag`)
   - Filter-Dropdown (z.B. Nur offene Buchungen, Datumsbereich)
   - *(Notice: "Link Account" action button removed)*
3. **FR-TR-03 (Buchungstabelle mit Spalten):**
   - Mehrfachauswahl-Checkbox
   - Flagge (Monochrome Flaggen-Codes 0–6)
   - Datum (`DD.MM.YYYY`, Pfeiltasten-Navigation)
   - Zahlungsempfänger (Autovervollständigung mit bekannten Empfängern)
   - Kategorie (Gruppiertes Dropdown ohne Icons)
   - Notiz / Verwendungszweck (Freitext)
   - Ausgabe (Outflow in Euro-Cent)
   - Einnahme (Inflow in Euro-Cent)
   - Status: Offen vs. Bestätigt (`cleared_status`: Symbol `C`)
4. **FR-TR-04 (Inline-Schnellerfassung):**
   - `Shift+N` öffnet direkt eine editierbare Zeile am Tabellenanfang.
   - Enter speichert und verlässt die Zeile.
   - `Speichern und weitere anlegen` speichert und öffnet sofort die nächste Leerzeile für massenhafte Belegeingabe.
5. **FR-TR-05 (DOM-Virtualisierung für Millionen von Buchungen):**
   - Integriert **TanStack Virtual**: Maximal 40 sichtbare DOM-Knoten zu jedem Zeitpunkt gerendert, unabhängig davon, ob das Konto 100 oder 2.000.000 Buchungen umfasst.
   - B-Tree Indexierung in SQLite auf `(account_id, date DESC)`.
6. **FR-TR-06 (Tastaturnavigation):**
   - Vollständige Tastaturbedienung gemäß Shortcuts-Matrix:
     - `C`: Cleared-Status umschalten
     - `Delete`: Buchung löschen
     - `Shift+D`: Buchung duplizieren
     - `S`: Split-Buchung aufteilen

---

## Dependencies

- Depends on: `account-management`
- Updates: `monthly_category_rollups` and `monthly_account_rollups` in $O(1)$ time upon any transaction change.
