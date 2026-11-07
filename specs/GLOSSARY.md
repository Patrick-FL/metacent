# metacent — Glossar (Fachbegriffe & Definitionen)

> Einheitliche Definitionen aller Fachbegriffe in metacent (Deutsch / Englisch).

---

## Budgetierungs-Konzepte (Budgeting Concepts)

### Kategorie / Category
Ein konkreter Budgettopf für einen bestimmten Zweck (z.B. `Miete / Hypothek`, `Telefon & Internet`, `Lebensmittel`). In metacent werden Kategorien **ohne Emojis oder bunte Icons** in klarer Typografie dargestellt. Jede Kategorie führt drei zentrale Werte: **Zugewiesen**, **Aktivität** und **Verfügbar**.

### Kategoriegruppe / Category Group
Ein einklappbarer Container zur thematischen Bündelung verwandter Kategorien (Standard: `Fixkosten & Rechnungen`, `Bedarfe`, `Wünsche`). Gruppen aggregieren die Summen ihrer Unterkategorien.

### Zugewiesen / Assigned
Der Geldbetrag in Euro-Cent, den der Nutzer einer Kategorie für den aktuellen Monat bewusst zugeteilt hat. Durch das Zuweisen wandert Geld aus dem Topf "Bereit zur Zuweisung" in das verfügbare Budget der Kategorie.

### Aktivität / Activity
Die Summe aller Ausgaben und Einnahmen, die einer Kategorie im ausgewählten Monat über das Kontobuch zugeordnet wurden. Ausgaben sind negativ, Rückerstattungen positiv.

### Verfügbar / Available
Das aktuell noch ausgebbare Budget einer Kategorie:
$$\text{Verfügbar} = \text{Verfügbar (Vormonat)} + \text{Zugewiesen} + \text{Aktivität}$$
Ein positiver Wert bedeutet gedecktes Budget (subtiler Mint-Grün-Pill). Ein negativer Wert (gedecktes Rot) signalisiert eine Budgetüberschreitung ("Overspending"), die durch Umverteilung ausgeglichen werden muss.

### Bereit zur Zuweisung / Ready to Assign
Der Topf an noch unverteilten Geldern aus Bareinnahmen. Im Zero-Based-Budgeting ist das Ziel, diesen Wert jeden Monat auf genau `0,00 €` zu bringen ("Jedem Euro eine Aufgabe geben").

### Zielbetrag / Target
Eine konfigurierbare Spar- oder Budgetierungsregel für eine Kategorie:
- **Wöchentlich / Weekly**: Z.B. wöchentliches Haushaltsgeld.
- **Monatlich / Monthly**: Z.B. monatliche Fixkosten wie Miete oder Strom.
- **Jährlich / Yearly**: Z.B. Kfz-Versicherung zum Jahresende.
- **Benutzerdefiniert / Custom**: Z.B. Notgroschen bis zu einem Stichtag.

---

## Konten & Buchungen (Accounts & Ledger)

### Barkonto / Cash Account
Konten mit eigenem Guthaben, das sofort ausgegeben werden kann (Girokonto, Tagesgeld, Sparkonto, Bargeld). Bestände fließen direkt in "Bereit zur Zuweisung".

### Kreditkonto / Credit Account
Konten mit geliehenem Geld (Kreditkarte, Dispositionskredit), das später zurückgezahlt werden muss.

### Salden-Gleichung / Balance Equation
$$\text{Bestätigter Saldo (Cleared)} + \text{Offener Saldo (Uncleared)} = \text{Arbeitssaldo (Working Balance)}$$

### Abstimmung / Reconciliation
Der Prozess, bei dem der bestätigte Saldo in metacent mit dem tatsächlichen Kontoauszug der Bank verglichen wird. Bei Übereinstimmung werden Buchungen als `reconciled` (gesperrt) markiert.

---

## Import & Performance-Konzepte

### Import-Profil / Import Profile
Ein gespeichertes Schema für CSV-Kontoauszüge eines bestimmten Instituts (z.B. Trade Republic, DKB). Speichert Spaltentrennzeichen, Datumsformat (`DD.MM.YYYY`), Dezimaltrennzeichen (`,`) und Feld-Zuordnungen für 1-Klick-Importe.

### Lokale KI-Kategorisierung / Local SLM Categorization
Ein dreistufiges Verfahren zur automatischen Zuweisung von Kategorien zu importierten Buchungen:
1. **Regel-Engine**: Exakte Empfänger, Textmuster und Spaltenregeln (sub-millisekunde).
2. **Lokales SLM (Ollama)**: Offline-Inferenz mit kompakten Modellen (`llama3.2:3b`, `qwen2.5:3b`) über den lokalen Ollama-Dienst.
3. **OpenRouter (optional)**: Cloud-Entscheidungsmodell nur bei explizitem Nutzer-Opt-in via API-Key.

### Monatliche Rollup-Tabellen / Materialized Monthly Rollups
Vorberechnete Aggregationstabellen (`monthly_category_rollups`, `monthly_account_rollups`), die durch inkrementelle Deltas bei jeder Buchungsänderung in $O(1)$ aktualisiert werden. Sie ermöglichen verzögerungsfreie Budget- und KPI-Abfragen über Millionen von Transaktionen hinweg.

### Ganzzahlige Cent-Beträge / Integer Minor Units
Alle Währungsbeträge werden in metacent ausnahmslos als `i64`-Ganzzahlen in Cents gespeichert (z.B. `123,45 €` = `12345`). Gleitkomma-Rundungsfehler (Floating-Point Bugs) sind dadurch mathematisch ausgeschlossen.
