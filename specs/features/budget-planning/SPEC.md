---
feature: budget-planning
status: review
priority: high
created: 2026-11-01
updated: 2026-11-01
---

# Feature: Budget Planning (Monatsplanung)

## Overview

The Budget Planning view is the core of **metacent**. It implements monthly envelope budgeting where users allocate available funds into categorized buckets ("Jedem Euro eine Aufgabe geben") and monitor spending activity and remaining balances in real time.

In alignment with metacent's Apple/Nothing OS design system, categories feature **pure minimalist typography without emoji icons or colorful badges**.

---

## Motivation

Users need a proactive budgeting interface that immediately informs them:
- How much money is unallocated ("Bereit zur Zuweisung").
- What monthly targets need funding.
- Whether any category has been overspent.

Calculations update with sub-millisecond latency even across databases with decades of history thanks to precomputed monthly rollups.

- Related user stories: US-BP-01 through US-BP-07

---

## Requirements

### Functional Requirements

1. **FR-BP-01 (Monatsauswahl / Month Navigator):**
   - Centered month switcher (e.g. `Nov 2026`, `Dez 2026`) with prev/next buttons and quick month picker dropdown.
2. **FR-BP-02 (Bereit zur Zuweisung / Ready to Assign Banner):**
   - Displays unassigned cash funds at the top.
   - When positive or zero: Mint-green subtle highlight (`800,00 € Bereit zur Zuweisung`).
   - When negative: Muted red alert (`-700,00 € Du hast mehr zugewiesen als verfügbar`) with "Korrigieren" (Fix This) action button.
3. **FR-BP-03 (Kategoriegruppen & Kategorien):**
   - Hierarchical list of collapsible groups (Standard: `Fixkosten & Rechnungen`, `Bedarfe`, `Wünsche`).
   - **No emoji icons**: Categories display pure, clean typographic labels (e.g., `Miete / Hypothek`, `Telefon & Internet`, `Lebensmittel`).
   - **Kategorie-Details & Umbenennen**: Selecting a category opens the inspector on the right with inline renaming (via button or double-click), propagating the updated name dynamically to all linked account transactions and registers.
   - **Kategorie-Notizen & Beschreibung**: Jede Kategorie besitzt ein Notizfeld zur detaillierten Beschreibung (z.B. welche Ausgaben hineingehören, Verträge, Richtlinien). Notizen können im Inspektor-Panel („Notizen“) erfasst, bearbeitet und eingesehen werden. Bei der Neuerstellung einer Kategorie kann optional bereits eine Notiz hinterlegt werden. Zusätzlich können monatsspezifische Notizen im Rollup hinterlegt werden. In der Planungstabelle signalisiert ein dezentes Notiz-Icon vorhandene Beschreibungen per Tooltip.
   - Table columns:
     - **Kategorie** (Name)
     - **Zugewiesen** (Assigned budget amount)
     - **Aktivität** (Sum of all transaction outflows/inflows this month)
     - **Verfügbar** (Remaining balance available to spend)
   - Group rows display aggregated totals for Zugewiesen, Aktivität, and Verfügbar.
4. **FR-BP-04 (Echtzeit-Berechnungs-Engine):**
   - Editing a Zugewiesen cell instantaneously updates:
     - Category Available: $\text{Verfügbar} = \text{Vormonat-Übertrag} + \text{Zugewiesen} + \text{Aktivität}$
     - Bereit zur Zuweisung: $\text{Bereit} = \text{Gesamteinzahlungen} - \sum \text{Alle Zuweisungen}$
     - Group totals.
   - Changes write directly to `monthly_category_rollups` in $O(1)$ time.
5. **FR-BP-05 (Zielbeträge / Targets & Status-Pills):**
   - Selecting a category opens the target editor in the right-hand inspector:
     - Typ: Wöchentlich, Monatlich, Jährlich, Benutzerdefiniert.
     - Zielbetrag ("Ich benötige X,XX € bis zum [Datum]").
   - Visual status indicators (minimalist, low-highlighting):
     - **Vollständig finanziert**: Subtle mint-green pill (`500,00 €`).
     - **Teilweise finanziert**: Subtle amber/yellow warning text (`4.500,00 € diesen Monat noch benötigt`).
     - **Überzogen (Overspent)**: Subdued red pill indicating overspending that must be reallocated.
6. **FR-BP-06 (Rückgängig & Wiederholen / Undo & Redo):**
   - Toolbar and keyboard shortcuts (`Ctrl+Z`, `Ctrl+Shift+Z`) support undoing and redoing any budget assignment.

---

## Detailed Behavior: Real-Time Allocation Flow

1. User views November 2026 with `800,00 €` Bereit zur Zuweisung.
2. User focuses the "Miete / Hypothek" Assigned field and inputs `500`.
3. Within $<1\text{ms}$:
   - "Miete" Verfügbar updates to `500,00 €`.
   - Bereit zur Zuweisung drops to `300,00 €`.
   - Parent group "Fixkosten" totals update.
4. User tabs to "Lebensmittel" and inputs `300`.
5. Bereit zur Zuweisung reaches `0,00 €` (Balanced zero-based budget).

---

## UI/UX References

- Mockup: `mockups/planning view at start.png`
- Mockup: `mockups/assigning money to plan after adding the account balance.png`
- Mockup: `mockups/assign money to plan, updating the calculation in real time, seeing match to goal .png`

## Dependencies

- Depends on: `account-management` (Account cash balances fund Ready to Assign)
- Feeds from: `transaction-register` (Outflows create Activity)
