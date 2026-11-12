# metacent

> **Zero-Based Personal Budgeting.** Local-First, kompromisslos datenschutzorientiert, tastaturgesteuert und blitzschnell.

**metacent** (Version 1.0) ist eine moderne Desktop- und Web-Anwendung für budgetorientierte Finanzplanung nach dem Envelope-Prinzip (*Zero-Based Budgeting*: Gib jedem Euro eine Aufgabe). Entwickelt für maximale Geschwindigkeit, absolute Datensouveränität und höchste Privatsphäre.

Entworfen in einer minimalistischen, retro-futuristischen Designsprache angelehnt an **Nothing OS** und **Schweizer Typografie** (Light & Dark Theme, Null Drop-Shadows, 1px High-Contrast-Borders, Akzente in Nothing Red `#D71921` und Functional Sage `#ADEBB3`).

---

## Highlights & Kernfunktionen

### 1. Plan — Zero-Based Budgeting
- **Umschlag-Budgetierung**: *„Bereit zur Zuweisung“* berechnet in Echtzeit das verfügbare Budget aus allen Einnahmen und Vormonatsüberhängen.
- **Hierarchische Kategorien & Gruppen**: Strukturierung in flexible Kategoriegruppen mit Inline-Zuweisung und Notizen.
- **Intelligente Sparziele (Targets)**:
  - *Zielbetrag nach Datum* (Target Balance by Date): Automatische monatliche Sparratenberechnung bis zum Stichtag.
  - *Monatlicher Sparbetrag* (Monthly Savings Amount): Gleichmäßige monatliche Einzahlung.
  - *Zielbetrag auffüllen* (Target Balance): Sparpuffer mit automatischer Auffüllung nach Ausgaben.
- **Vormonat übernehmen (Quick Budgeting)**: Mit einem Klick Budgets aus dem Vormonat kopieren oder am tatsächlichen Ausgaben-Durchschnitt ausrichten.
- **6-Monats-Verlauf & Statistiken**: Direkt im Detail-Panel der Kategorien und Gruppen historische Ausgaben, Trends und Durchschnitte einsehen.

### 2. Register — Kontoverwaltung & Transaktionen
- **High-Performance Kontobuch**: Angetrieben durch **TanStack Virtual** für 60 FPS Scroll-Performance selbst bei zehntausenden Buchungen.
- **Massenbearbeitung (Batch Operations)**: Mehrere Transaktionen markieren und gemeinsam kategorisieren, als freigegeben/unbestätigt markieren oder löschen.
- **Dynamische Spaltenfilter & Suche**: Filterung nach Zeitraum, Empfänger, Kategorie, Betrag, Status und Notizen.
- **Split-Buchungen**: Aufteilen einer Sammelbuchung (z. B. Supermarkt) auf mehrere Kategorien mit exakter Cent-Prüfung.
- **Intelligente Kategorien-Combobox**: Tastatur-orientierte Schnellsuche mit Sofort-Zuweisung.
- **Kontenabstimmung (Reconciliation)**: Schneller Abgleich mit dem Bankauszug, Sperren abgestimmter Transaktionen und automatischer Ausgleich bei Differenzen.
- **Flexible Kontotypen**: Girokonto, Tagesgeld, Sparbuch, Bargeld, Kreditkarte sowie Tracking-Konten (Off-Budget wie Depots oder Kredite).

### 3. Smart Import & Automatisierung
- **CSV- & Kontoauszugs-Import**: Universeller Datei-Import mit automatischer Spalten- und Format-Erkennung.
- **Vorkonfigurierte Bankprofile**: Direkt einsatzbereite Vorlagen für **Trade Republic**, **Commerzbank**, **Sparkasse**, **ING**, **DKB** und universelle CSV-Dateien.
- **Regel-Editor (Rule Engine)**: Flexible Regeln definieren, um Transaktionen anhand von Empfänger- oder Verwendungszweck-Mustern automatisch zuzuordnen.
- **Lokale KI-Kategorisierung (Ollama)**: 100% private Transaktions-Kategorisierung über lokale LLMs (z. B. `llama3.2:3b`, `qwen2.5:3b`) ohne Datenweitergabe an Dritte (optionaler OpenRouter-Fallback).

### 4. Reflect — Finanzielle Analysen & Berichte
- **Ausgaben nach Kategorien**: Detaillierte Donut- und Balken-Aufschlüsselung aller Ausgabenarten.
- **Monatlicher Trend**: Historischer Ausgabenverlauf über Zeit.
- **Nettovermögen (Net Worth)**: Vermögensentwicklung über alle On-Budget- und Off-Budget-Konten hinweg.
- **Einnahmen vs. Ausgaben**: Direkter monatlicher Cashflow-Vergleich.
- **Geld-Alter (Age of Money)**: Kennzahl für finanzielle Reichweite und Stabilität.

### 5. Datenschutz & Technische Präzision
- **100% Offline & Local-First**: Alle Daten verbleiben lokal auf Ihrem System (SQLite im WAL-Modus / Local-Storage Engine). Kein Cloud-Zwang, keine Telemetrie, keine Bank-Logins.
- **Exakte Integer-Cent-Arithmetik (`i64`)**: Sämtliche Währungsberechnungen erfolgen in Minor Units (Ganzzahl-Cent), um IEEE-754 Rundungsfehler vollständig auszuschließen.
- **Tastatur-zentriert**: Umfassende Shortcuts für Buchungserfassung, Navigation und Filter (`?` drücken für Shortcuts-Übersicht).
- **Theme-Unterstützung**: Nahtloses Umschalten zwischen Nothing Light- und Dark-Mode.
- **Datensicherung**: Vollständiger JSON- und Datenbank-Export/-Import über die Einstellungen.

---

## Tech Stack

| Bereich | Technologie |
| --- | --- |
| **Desktop-Framework** | [Tauri 2.0](https://tauri.app/) (Rust) |
| **Frontend-Framework** | [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Styling & Design** | [Tailwind CSS v4](https://tailwindcss.com/), Nothing OS Design Tokens |
| **Datenbank / Storage** | SQLite (`rusqlite` mit WAL-Modus) & Browser Local Engine |
| **Virtualisierung** | [TanStack Virtual v3](https://tanstack.com/virtual/latest) |
| **Diagramme & Analytics** | [Recharts 3](https://recharts.org/) |
| **Lokale KI** | [Ollama API](https://ollama.com/) |
| **Icons & Fonts** | [Lucide React](https://lucide.dev/), Inter & JetBrains Mono |
| **Test-Runner** | [Vitest](https://vitest.dev/) (51 Tests, 7 Test-Suiten) |

---

## Entwicklung & Start

### 1. Web-Modus (Schnellstart im Browser)

Sie können metacent ohne native Rust-Voraussetzungen direkt im Browser ausführen:

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev

# Tests ausführen (55 Tests in 7 Suiten passing)
npm test

# Produktions-Build erstellen
npm run build

# Produktions-Build lokal ausführen & testen
npm run preview
```

Öffnen Sie Ihren Browser unter `http://localhost:1420`.

### 2. Produktions-Modus & Start mit echten Daten

metacent unterstützt zwei Betriebsmodi:
- **Echtbetrieb (Produktion)**: Sauberes Budget ohne Testkonten oder Buchungen (0,00 € Bereit zur Zuweisung), strukturierte Kategorievorlagen und vorkonfigurierte Bank-Importprofile. Bereit zum direkten Anlegen Ihrer echten Bankkonten oder zum CSV-Kontoauszug-Import.
- **Demo-Modus**: Vorkonfiguriertes Testkonto (Girokonto mit 800,00 €) zum Erkunden aller Funktionen.
- **Umschalten**: Direkt über den Hinweis-Banner am oberen Bildschirmrand (*„Echtes Budget starten (Demodaten entfernen)“*) oder in den Einstellungen unter *„Daten & Backup“*.

### 3. Native Desktop-App (Tauri 2)

#### Linux (Debian / Ubuntu / Linux Mint) Systemvoraussetzungen:
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf libdbus-1-dev
```

#### Desktop-App starten & paketieren:
```bash
# Entwicklungsmodus mit Tauri
npm run tauri dev

# Natives Linux-Paket (.deb und .AppImage) erstellen:
cargo tauri build --bundles deb,appimage
```

---

## Spezifikations-Dokumentation

Das Projekt folgt strikt der **Spec-Driven Development** Methodik. Sämtliche Spezifikationen, Architekturentscheidungen und Datenmodelle befinden sich unter [`specs/`](./specs/):

- [`specs/README.md`](./specs/README.md) — Spezifikations-Index und Übersicht
- [`specs/vision/VISION.md`](./specs/vision/VISION.md) — Produktvision & Leitprinzipien
- [`specs/architecture/DATA_MODEL.md`](./specs/architecture/DATA_MODEL.md) — Datenmodell & Rollup-Strukturen
- [`specs/architecture/ARCHITECTURE.md`](./specs/architecture/ARCHITECTURE.md) — Systemarchitektur & Rollup-Engine
- [`specs/architecture/TECH_STACK.md`](./specs/architecture/TECH_STACK.md) — Technologieauswahl & Begründung
- [`specs/ux/STYLE_GUIDE.md`](./specs/ux/STYLE_GUIDE.md) — Design-System & Design-Tokens
- [`specs/DECISIONS.md`](./specs/DECISIONS.md) — Architecture Decision Records (ADR-001 bis ADR-011)
- [`specs/features/`](./specs/features/) — Feature-Spezifikationen mit Gherkin-Akzeptanzkriterien
