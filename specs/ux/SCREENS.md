# metacent — Screen & View Inventory

> Monochrome, minimalist design inspired by Apple and Nothing OS with mint-green accent (`#ADEBB3`).
> Default language: German (`de-DE`). Default currency: EUR (`€`). No category emoji icons.

---

## Screen S-01: Monatsplanung (Plan View)
- **Route**: `/plan`
- **Purpose**: Monthly zero-based budget planning where users allocate income into categories and review available balances.
- **Entry Points**: Sidebar top navigation link "Planung".
- **Key Elements**:
  - **Kopfzeile (Header)**:
    - Month navigator (e.g. `< Nov 2026 >`) with quick dropdown selector.
    - Undo (`Ctrl+Z`) and Redo (`Ctrl+Shift+Z`) buttons.
    - "+ Kategoriegruppe" button.
  - **Bereit zur Zuweisung Banner (Ready to Assign)**:
    - Large tabular balance display.
    - State $\ge 0$: Mint-green subtle highlight (`800,00 € Bereit zur Zuweisung`).
    - State $< 0$: Muted red badge (`-700,00 € Mehr zugewiesen als verfügbar`) with "Korrigieren" button.
  - **Kategorietabelle (Category Grid)**:
    - Columns: `KATEGORIE`, `ZUGEWIESEN`, `AKTIVITÄT`, `VERFÜGBAR`.
    - Collapsible Category Groups (e.g. `Fixkosten`, `Bedarfe`, `Wünsche`) with aggregated row sums.
    - Category rows with clean typography (no emoji icons).
    - Underfunded target indicators: Subtle amber text with clock icon (e.g. `4.500,00 € noch benötigt`).
    - Fully funded indicators: Subtle mint-green pill.
  - **Rechtes Inspektorfeld (Ziel-Editor)**:
    - Target configuration: Typ (Wöchentlich, Monatlich, Jährlich, Benutzerdefiniert), Zielbetrag in €, Fälligkeitsdatum.

---

## Screen S-02: Kontobuch / Buchungsliste (Transaction Register)
- **Route**: `/accounts/:id`
- **Purpose**: High-speed, virtualized ledger for viewing, searching, and managing transactions of a specific account.
- **Key Elements**:
  - **Kontokopf**:
    - Kontoname mit Favoriten-Stern.
    - Kontotyp-Badge (z.B. `Girokonto`, `Sparkonto`, `Kreditkarte`).
    - Abstimmungsstatus (z.B. "Noch nicht abgestimmt" oder "Abgestimmt am 24.10.2026").
    - **Salden-Gleichung**:
      $$\text{Bestätigter Saldo} + \text{Offener Saldo} = \text{Arbeitssaldo}$$
      (z.B. `800,00 € + 0,00 € = 800,00 €` in Mint-Grün).
    - "Abstimmen" Button (`Shift+E`).
  - **Aktionsleiste**:
    - `+ Buchung hinzufügen` (`Shift+N`)
    - `Datei importieren` (öffnet Import-Dialog)
    - Volltext-Suche (`Ctrl+Shift+F`)
    - Ansichtsfilter (Alle, Nur Offene, Nur Bestätigte)
    - *(Notice: "Link Account" removed)*
  - **Virtualisierte Buchungstabelle (TanStack Virtual)**:
    - Columns: Auswahl-Checkbox, Flagge (0–6), Datum (`DD.MM.YYYY`), Empfänger, Kategorie, Verwendungszweck, Ausgabe, Einnahme, Status (`C`).
    - Inline-Schnellerfassungszeile (`Shift+N`) mit "Speichern" und "Speichern & weitere anlegen".

---

## Screen S-03: Konto anlegen / Add Account Modal
- **Purpose**: Simple modal for adding a new local financial account.
- **Entry Points**: "+ Konto hinzufügen" in sidebar.
- **Key Elements**:
  - Kontoname / Nickname (Textfeld).
  - Kontotyp-Wahl:
    - **Barkonten**: Girokonto, Sparkonto, Bargeld.
    - **Kreditkonten**: Kreditkarte, Dispositionskredit.
    - **Kredite & Darlehen**: Immobilienkredit, Ratenkredit.
  - Aktueller Anfangssaldo (Währung in Euro).
  - *(Notice: No bank login forms or Plaid connections).*

---

## Screen S-04: Konto bearbeiten / Edit Account Modal
- **Purpose**: Manage account metadata and custom import settings.
- **Key Elements**:
  - Kontoname (Nickname).
  - Notizen (Freitextfeld).
  - Arbeitssaldo (Änderung erzeugt automatische Korrekturbuchung).
  - **Import-Vorlagen verwalten**: Button zum Öffnen der gespeicherten CSV-Profile (z.B. Trade Republic).
  - Konto löschen (Subdued red with security confirmation).

---

## Screen S-05: Datei-Import & Template Studio (File Import)
- **Purpose**: Parse statements, select account import profile, preview transactions, and trigger AI categorization.
- **Key Elements**:
  - Drag-and-Drop Datei-Upload-Zone (unterstützt CSV, OFX, QFX, QIF).
  - **Vorlagen-Auswahl / Template Selector**:
    - Dropdown gespeicherter Profile (z.B. `Trade Republic CSV`, `DKB Girokonto`, `Commerzbank`).
    - Automatische Erkennung anhand der Spalten-Header.
    - Button "Neues Profil anlegen / Profil bearbeiten":
      - Trennzeichen (`;`, `,`, Tab).
      - Datumsformat (`DD.MM.YYYY`, `YYYY-MM-DD`, etc.).
      - Dezimaltrennzeichen (`,` oder `.`).
      - Spalten-Zuordnung (Datum, Empfänger, Betrag, Verwendungszweck, Typ).
  - **Vorschau- & Prüftabelle**:
    - Status-Spalte: Neu, Duplikat (übersprungen), Automatisch zugeordnet (Regel), KI-Vorschlag (Ollama mit Mint-Badge).
    - Inline-Kategoriekorrektur.
  - "Ausgewählte übernehmen" / "Alles übernehmen" Buttons.

---

## Screen S-06: Saldenabstimmung (Reconciliation Popover)
- **Purpose**: Verify that the cleared register balance matches the real-world bank statement.
- **Key Elements**:
  - Abfrage-Popover: "Stimmt der aktuelle Saldo von 800,00 €?".
  - "Ja" Button $\to$ Sperrt alle bestätigten Buchungen als `reconciled` (Schloss-Symbol).
  - "Nein" Button $\to$ Fragt nach dem tatsächlichen Kontoauszug-Saldo, berechnet Differenz und bietet automatische Korrekturbuchung an.

---

## Screen S-07: Berichte & Auswertungen (Reflect Section)
- **Route**: `/reflect`
- **Sub-Tabs**:
  1. **Ausgaben nach Kategorien (Spending Breakdown)**:
     - Minimalistisches Donut-Diagramm (Kategorien oder Gruppen).
     - Gesamtausgaben im Zentrum.
     - Tabelle rechts mit Beträgen und Prozentanteilen.
  2. **Ausgabentrends (Spending Trends)**:
     - Verlaufsgrafik der monatlichen Gesamtausgaben.
     - Durchschnittliche Monatsausgaben vs. ausgewählter Monat.
  3. **Vermögensentwicklung (Net Worth)**:
     - Gestapeltes Balkendiagramm: Vermögenswerte (Blau/Mint) vs. Verbindlichkeiten (Muted Rot).
     - Nettovermögen, Monatliche Veränderung in Euro und Prozent.
  4. **Einnahmen vs. Ausgaben (Income v Expense)**:
     - Detaillierte Vergleichstabelle nach Monaten, Durchschnitt und Gesamt.
  5. **Geld-Alter (Age of Money)**:
     - Anzeige der durchschnittlichen Haltedauer von Euro-Cents zwischen Einnahme und Ausgabe.
     - Mindestanforderung: 10 Ausgabenbuchungen.
- **Filterleiste**: Zeitraum-Umschalter, Kategorie-Filter, Konten-Filter, "Exportieren" (CSV/PDF).
