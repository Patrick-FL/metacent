---
feature: ai-financial-advisor
status: verified
priority: high
created: 2026-11-14
updated: 2026-11-15
---

# Feature: KI-Finanzberater & Ziel-Copilot (AI Financial Advisor & Goal Copilot)

## Overview

The **KI-Finanzberater & Ziel-Copilot** is an intelligent, empathetic, and privacy-preserving advisory system embedded into metacent. It transforms personal budgeting from passive bookkeeping into active, empowering goal achievement.

The feature provides:
1. **On-Demand Spending Audits**: Uncovers recurring inefficiencies, hidden subscriptions, and subtle cost drift across 3–12 months of transaction history.
2. **Interactive Savings Scenarios ("What-If")**: Enables users to playfully test savings levers (e.g. trimming dining out by 40 €/month) and immediately see how many months earlier personal goals (e.g. "Japan-Reise", "Notgroschen") will be achieved.
3. **Privacy-Sanitized Internet Price Comparison**: Employs an agentic search engine to look up current market tariffs (mobile, broadband, electricity, insurance) and real purchase prices for target items, proposing concrete, verified alternatives.
4. **SMART Goal Refinement & Prioritization**: Helps users structure vague dreams into measurable envelope targets and resolve competing financial goals during tight cashflow months.
5. **Strictly Non-Patronizing Tone**: Communicates as a supportive partner on eye level—never judging, lecturing, or scolding. Users maintain complete sovereignty with one-click category protections ("Geschützte Lebensqualität").

---

## Motivation

Traditional budgeting apps either present static retrospective graphs or patronize the user with harsh warnings ("You overspent on coffee!"). Users frequently abandon budgeting because:
- Identifying realistic savings opportunities requires tedious manual cross-referencing of bank statements.
- Abstract monthly savings lack tangible motivation without direct linkage to beloved goals.
- Users are unaware of market rate alternatives (e.g., paying 50 € for an outdated mobile plan that now costs 15 € on the open market).
- Competing financial goals create decision paralysis.

The KI-Finanzberater solves this by combining **deterministic zero-based math**, **empathic conversational AI**, and **privacy-first internet research**.

- Related user stories: US-AI-01, US-AI-02, US-AI-03, US-AI-04, US-AI-05, US-AI-06

---

## Requirements

### Functional Requirements

1. **FR-AI-01 (Triggered Spending Audit):**
   - Users can trigger an in-depth spending audit on demand via the "Ausgaben analysieren" button in Plan, Reflect, or the dedicated `/advisor` studio.
   - The engine scans the last 3 to 12 months of transaction history for:
     - Recurring contracts & subscription creep (regular identical or slightly increasing outflows).
     - Category drift (discretionary spending rising faster than historical baselines).
     - Outlier spikes and unassigned leakage.
   - Output is structured into categorized findings: *Fixkosten-Optimierung*, *Abonnements*, *Flexible Hebel*.
   - Categories flagged as "Geschützte Lebensqualität" are automatically excluded from any reduction proposals.

2. **FR-AI-02 (Interactive What-If Scenario Simulator):**
   - Provides interactive sliders and stepper controls for each identified savings lever.
   - Adjusting a slider immediately recalculates all active target completion dates in real time using the deterministic financial math kernel.
   - Displays a side-by-side comparative timeline:
     - *Baseline*: Projected completion date without changes.
     - *Mit Sparhebel*: Accelerated completion date (e.g. "3 Monate früher: September 2027 statt Dezember 2027").
   - Changes are non-destructive and isolated to the simulator until explicitly applied with "In Budget übernehmen".

3. **FR-AI-03 (Privacy-Sanitized Web Research & Price Comparison):**
   - The agent can search the web for lower-priced alternatives for detected utility contracts (telecom, DSL, electricity, gas), recurring software/gym subscriptions, and target hardware/purchases.
   - **Zero-Privacy-Leakage Firewall**:
     - All PII (user names, IBANs, account balances, exact dates, vendor account IDs) is strictly stripped before issuing external network requests.
     - Only abstracted, generic queries are sent (e.g., `"Mobilfunk Allnet Flat 25GB 5G Deutschland monatlich kündbar Vergleich 2026"`).
   - Results are presented as structured Alternative Cards:
     - Provider name & official plan/product title.
     - Monthly price and one-time fees (in minor-unit cents).
     - Estimated net annual savings compared to current outflow.
     - Feature parity check & contract conditions (e.g. "Monatlich kündbar", "Telekom-Netz").
     - Clean, direct web link (free of affiliate tracking).
   - The UI includes an inspection trigger ("Datenschutz-Protokoll"), displaying the exact sanitized search term that was executed.

4. **FR-AI-04 (SMART Goal Refinement):**
   - Users can type natural language desires into the Goal Copilot (e.g., "Ich möchte nächsten Sommer 3 Wochen nach Norwegen" or "Ich brauche ein neues E-Bike").
   - The Copilot conducts a supportive, multi-turn dialogue to establish:
     - Specific target scope.
     - Realistic target balance in euros (optionally supported by quick market price benchmarks).
     - Target due date and required monthly contribution.
   - Proposes a ready-to-save target definition conforming to metacent's envelope target engine (`target_type`, `amount_cents`, `due_date`).

5. **FR-AI-05 (Goal Prioritization & Conflict Resolution):**
   - When total monthly funding requirements for all active targets exceed the user's available monthly cashflow capacity, the Copilot detects the bottleneck.
   - Presents a compassionate prioritization dialogue:
     - Suggests an objective tiering: 1. Notgroschen & Existenzsicherung $\to$ 2. Sinking Funds für unvermeidbare Fixkosten $\to$ 3. Zeitkritische Lebensziele $\to$ 4. Wünsche & Hobbys.
     - Formulates trade-off questions on eye level (e.g., "Möchtest du das Reiseziel vorziehen und den Laptop-Kauf um zwei Monate nach hinten verschieben?").
     - Provides a 1-click rebalance proposal adjusting target deadlines or monthly amounts.

6. **FR-AI-06 (Non-Patronizing Persona & Linguistic Guardrails):**
   - The AI must adhere to strict behavioral rules:
     - **No moralizing**: Avoid words like "überflüssig", "Verschwendung", "schlecht", "Fehler".
     - **No scolding imperatives**: Never use "Du musst", "Du darfst nicht", "Hör auf mit".
     - **Objective framing**: State facts and potential outcomes ("Im letzten Quartal betrugen die Ausgaben für ... Eine Reduktion um X € würde dir ermöglichen ...").
     - **Empathy for lifestyle choices**: Acknowledge that spending money on joy and comfort is valid and personal.
     - If the user indicates that an expense is important to their happiness, the AI affirms this immediately and permanently protects the category.

7. **FR-AI-07 (Category Protection: "Geschützte Lebensqualität"):**
   - Every category has a toggle in its detail inspector: "Geschützte Lebensqualität" (Shield icon).
   - When enabled, the AI audit and scenario engines are forbidden from proposing savings or cuts to this category.
   - If the user tells the chat "Rühre mein Budget für Restaurant nicht an", the AI automatically sets this flag with user consent.

8. **FR-AI-08 (1-Click Application of Recommendations):**
   - Accepted savings recommendations provide an "In Budget übernehmen" action.
   - The user chooses between:
     - *Zielrate anpassen*: Increases the monthly target allocation of the accelerated goal.
     - *Nächsten Monat einplanen*: Sets the assigned amount for the next calendar month in the planning table.
   - All mutations preserve the zero-based budgeting invariant (`Ready to Assign + Sum(Available) == Total Cash`).

---

### Non-Functional Requirements

1. **NFR-AI-01 (Data Privacy & Zero PII Leakage):**
   - 100% of transaction data, balances, and account notes remain strictly within the local SQLite database.
   - Web searches are routed through sanitized generic queries. If internet access is unavailable or disabled, the audit, scenario simulator, and goal prioritization remain 100% operational offline.
2. **NFR-AI-02 (Deterministic Mathematical Accuracy):**
   - All financial projections, target dates, monthly rates, and cent calculations are computed in native Rust/TypeScript using integer cents (`i64`). The LLM never invents or approximates financial math.
3. **NFR-AI-03 (Performance & Latency):**
   - Spending audit execution on 50,000 transactions completes in $< 350\text{ms}$.
   - Interactive slider scenario recalculations render in $< 16\text{ms}$ (60 FPS smooth sliding).
4. **NFR-AI-04 (Design Consistency):**
   - Built with the Nothing OS / Swiss design system: 1px high-contrast borders, zero drop shadows, monochrome surfaces with Nothing Red (`#D71921`) and Sage (`#ADEBB3`) accents.
   - All comparison charts and cards conform to Bento-Grid layout principles.

---

## Detailed Behavior & User Flows

### Happy Path 1: Triggering an Audit and Simulating Target Acceleration
1. User clicks "Ausgaben analysieren" in the planning view or navigates to `/advisor`.
2. The system queries historical rollups and detects:
   - Mobile contract: 44,99 €/month (historical baseline: 24 months unchanged).
   - Dining out: 210,00 €/month average (rising by 15% over last quarter).
3. The AI displays an objective summary:
   > "In den letzten 6 Monaten hast du 85% deiner Einnahmen fest zugewiesen. Es gibt zwei interessante Hebel: Ein langlebiger Mobilfunkvertrag und moderate Anpassungen bei Restaurantbesuchen. Zusammen könnten sie monatlich ca. 55,00 € freisetzen."
4. Below the summary, interactive cards appear:
   - Card A: "Mobilfunkvertrag prüfen" (Potential: 25,00 €/Monat) + Button "Markt-Alternativen recherchieren".
   - Card B: "Gastronomie Sparhebel" (Slider von 0 € bis 60 € Reduktion).
5. The user drags the Gastronomie slider to "-40,00 €/Monat".
6. The simulator immediately displays:
   > "Ziel 'Urlaub Schweden' (Zielbetrag: 1.200 €): Mit 40 € zusätzlicher Sparrate erreichst du dein Ziel im Juni 2027 statt im September 2027 (3 Monate früher)."
7. User clicks "In Budget übernehmen". The target monthly allocation updates automatically.

### Happy Path 2: Web Research for Alternative Contracts
1. User clicks "Markt-Alternativen recherchieren" on the mobile phone card.
2. The privacy firewall strips all personal metadata and formulates:
   `"Mobilfunk Allnet Flat 20GB 5G monatlich kündbar Vergleich 2026"`.
3. The search provider queries current offers and returns 3 verified alternatives:
   - Alternative 1: *SIM.de Allnet Flat 25GB 5G* — 9,99 €/Monat (Ersparnis: 35,00 €/Monat = 420,00 €/Jahr).
   - Alternative 2: *Congstar Allnet M 30GB 5G* (Telekom-Netz) — 17,00 €/Monat (Ersparnis: 27,99 €/Monat = 335,88 €/Jahr).
4. Each card includes contract term, network quality, and a direct verification URL.
5. User marks: "Erinnerung für Vertragswechsel anlegen" $\to$ Creates a scheduled task/memo in metacent.

### Happy Path 3: Goal Clarification & Prioritization
1. User opens the Goal Copilot chat: *"Ich will mir nächstes Jahr ein gutes Gravelbike kaufen, weiß aber nicht, wie ich das schaffen soll."*
2. Copilot responds warmly:
   > "Ein Gravelbike ist ein fantastisches Ziel für Sport und Alltag! Lass uns das gemeinsam greifbar machen.
   > Ein solides Allround-Gravelbike liegt typischerweise zwischen 1.200 € und 2.200 €. Hast du schon ein bestimmtes Modell im Blick oder peilen wir einen Richtwert von z.B. 1.600 € an? Und zu welchem Monat möchtest du spätestens im Sattel sitzen?"
3. User: *"1.500 € bis Mai 2027 wäre super."*
4. Copilot calculates with the math kernel:
   > "Bis Mai 2027 sind es noch 6 Monate. Das entspricht einer monatlichen Sparrate von 250,00 €.
   > Aktuell sind deine freien Mittel für neue Sparziele bei 180,00 €/Monat, da dein 'Notgroschen' und die 'Kfz-Inspektion' Vorrang haben.
   > Wir haben zwei komfortable Möglichkeiten:
   > A) Den Zieltermin auf Juli 2027 legen (187,50 €/Monat – passt fast perfekt in dein aktuelles Budget).
   > B) Temporär 40 € aus flexiblen Budgets umlenken.
   > Was passt besser zu deinen Plänen?"

---

## Edge Cases & Error Handling

- **Insufficient Transaction History (< 30 days)**:
  - If a user has fewer than 15 transactions or less than 1 full calendar month of history, the audit displays a welcoming state:
  > "Dein Budget wächst noch! Für eine fundierte Ausgabenanalyse benötigt metacent Buchungen aus mindestens einem vollen Monat. Sobald du deinen ersten Monatsabschluss machst, können wir fundierte Trends analysieren."
  - Basic goal refinement remains fully available.
- **Offline / Web Search Unavailable**:
  - If the computer is offline or the search service returns an error, the web comparison cards gracefully show:
  > "Web-Recherche offline: Aktuell können keine Live-Tarife abgerufen werden. Du kannst deine Sparhebel weiterhin interaktiv simulieren."
  - No crash, no UI blocking.
- **Extreme User Resistance / Declining Recommendations**:
  - If the user declines a recommendation ("Ich möchte hier nichts sparen"), the AI replies neutrally:
  > "Vollkommen verständlich! Dieser Bereich bleibt unberührt. Lass uns andere Optionen prüfen oder die Zielzeiträume anpassen."
  - The category can be marked protected with one click.
- **Overfunded or Impossible Targets**:
  - If a user sets a target of 10.000 € in 1 month with 2.000 € income, the Copilot points out the mathematical reality calmly:
  > "Bei 10.000 € in 1 Monat wäre eine Sparrate von 10.000 € erforderlich. Mit deinen aktuellen monatlichen Einnahmen von 2.400 € ist dieser Zeitrahmen rechnerisch nicht darstellbar. Sollen wir prüfen, welcher Zieltermin mit einer monatlichen Rate von z.B. 300 € realistisch ist?"

---

## Dependencies

- `specs/features/budget-planning`: Integration with Category Targets and Monthly Rollups.
- `specs/features/transaction-register`: Data source for historical outflows and payees.
- `specs/features/reports-reflect`: Correlation with spending trends and income vs. expense analytics.
- `src/services/targetCalculations.ts`: Deterministic calculation base.
