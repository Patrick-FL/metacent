# metacent — Produktvision & Leitprinzipien

## Der Leitgedanke

**metacent** ist eine kompromisslos schnelle, lokale und datenschutzorientierte Budgetierungssoftware nach der Zero-Based-Budgeting-Methode ("Jedem Euro eine Aufgabe geben"). 

Inspiriert von der Designästhetik von **Apple** und **Nothing OS**, kombiniert metacent ein minimalistisches, monochromes Interface mit dezenten Mint-Grün-Akzenten (`#ADEBB3`), nativer Ausführungsgeschwindigkeit auf allen Betriebssystemen (Linux Mint, Windows, macOS) und robuster Skalierbarkeit für Millionen von Transaktionen.

---

## Das Problem

Bestehende Finanzsoftware zwingt Nutzer häufig in zwei Sackgassen:
1. **Verlust der Privatsphäre & Abhängigkeit**: Cloud-Dienste verlangen den Zugriff auf echte Bank-Zugangsdaten (PSD2 / Open Banking), erzeugen monatliche Abokosten und gefährden sensible Finanzdaten.
2. **Reine Vergangenheitsbetrachtung**: Viele Apps zeigen nur rückblickend bunte Diagramme darüber, wofür Geld ausgegeben wurde, anstatt dem Nutzer zu helfen, Geld *vor* dem Ausgeben bewusst zuzuweisen.
3. **Leistungseinbrüche bei großen Datenmengen**: Bei Jahren an historischen Kontodaten und Zehntausenden Buchungen werden gängige Web- oder Electron-Apps träge.

---

## Die Lösung: metacent

metacent basiert auf den vier Grundregeln des Zero-Based Budgeting:

1. **Jedem Euro eine Aufgabe geben**: Sobald Geld auf einem Konto eingeht, wird es konkreten Monatskategorien zugewiesen, bis "Bereit zur Zuweisung" exakt `0,00 €` beträgt.
2. **Echte Ausgaben vorausplanen**: Große, unregelmäßige Fixkosten (z.B. Versicherungen, Kfz-Steuer) werden in monatliche Zielbeträge aufgeteilt.
3. **Flexibel bleiben ("Roll with the Punches")**: Unvorhergesehene Ausgaben werden durch Umverteilung aus weniger wichtigen Töpfen ausgeglichen – ohne Frust oder rote Warnberge.
4. **Das Geld altern lassen ("Age of Money")**: Durch planvolles Sparen wird das Intervall zwischen Einnahme und Ausgabe schrittweise vergrößert, um den "Paycheck-to-Paycheck"-Kreislauf dauerhaft zu durchbrechen.

---

## Kernarchitektur & Alleinstellungsmerkmale

| Säule | Umsetzung in metacent |
| :--- | :--- |
| **Lokale Souveränität & Zero Cloud** | Keine externen Bank-Schnittstellen (Plaid/Finicity/usw.). Alle Konten, Buchungen und Budgets verbleiben verschlüsselt in einer lokalen SQLite-Datenbank auf dem Rechner des Nutzers. |
| **Native Geschwindigkeit für Millionen Buchungen** | Gebaut mit **Tauri 2.0 (Rust)** und embedded SQLite. Materialisierte monatliche Aggregationstabellen und DOM-Virtualisierung garantieren Reaktionszeiten $<1\text{ms}$ selbst bei 10+ Jahren Historie. |
| **Lokale KI-Kategorisierung (Ollama)** | Intelligente automatisierte Buchungszuordnung über lokale Small Language Models (z.B. via Ollama `llama3.2:3b`, `qwen2.5:3b`) direkt auf dem Rechner – ohne Datenabfluss ins Netz. |
| **Maßgeschneiderte Importer-Profile** | Speichern individueller Import-Vorlagen pro Konto (z.B. Trade Republic CSV, DKB, Commerzbank) mit automatischer Spalten- und Formaterkennung für 1-Klick-Importe. |
| **Monochrom & Konzentriert** | Minimalistisches Interface im Nothing OS / Apple-Stil: keine Emojis bei Kategorien, flache monochrome Icons, Mint-Grün als funktionaler Akzent. |
| **Tastatur-Zentriert** | Durchgängige Bedienbarkeit ohne Maus: Schnellerfassung, Buchungsbestätigung, Navigation und Abstimmen über globale Shortcuts. |

---

## Standard-Voreinstellungen

- **Sprache**: Deutsch (`de-DE`)
- **Währung**: Euro (`€`), intern in Cents als Ganzzahlen gespeichert
- **Datumsformat**: `DD.MM.YYYY` (z.B. `01.11.2026`)
- **Betriebssystem-Fokus**: Linux Mint OS (Hauptentwicklung), Windows, macOS

---

## Abgrenzung (Non-Goals)

- **Keine Cloud-Finanz-Aggregatoren**: Keine automatisierten Online-Bankkontoverbindungen.
- **Keine Steuererklärung / Elster**: metacent ist ein Planungs- und Budgetwerkzeug, kein Steuerprogramm.
- **Kein algorithmisches Day-Trading / Depot-Tracking**: Wertpapierdepots werden als Verrechnungskonten für Cash-Flows geführt, nicht als Realtime-Orderbuch.
