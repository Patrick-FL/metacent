# Technical & UX Design: KI-Finanzberater & Ziel-Copilot

## 1. System Architecture & Information Flow

The KI-Finanzberater bridges metacent's deterministic zero-based budgeting ledger with an intelligent, privacy-first conversational layer.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        User Interface (React 19)                       │
│  ┌───────────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │ Bento-Grid Audit View │  │ Lever Simulator │  │ Goal Copilot Chat│  │
│  └───────────┬───────────┘  └────────┬────────┘  └────────┬─────────┘  │
└──────────────┼───────────────────────┼────────────────────┼────────────┘
               │                       │                    │
┌──────────────▼───────────────────────▼────────────────────▼────────────┐
│                  Service Layer (TypeScript / Rust IPC)                 │
│                                                                        │
│   ┌────────────────────────────────┐  ┌────────────────────────────┐   │
│   │ Deterministic Math Kernel      │  │ Privacy Sanitization       │   │
│   │ • Integer Cent Arithmetic      │  │ • Strict Regex & Token PII │   │
│   │ • Target Recalculation         │  │   Stripper                 │   │
│   │ • Zero-Based Invariant Check   │  │ • Generic Query Formatter  │   │
│   └────────────────┬───────────────┘  └─────────────┬──────────────┘   │
│                    │                                │                  │
│   ┌────────────────▼───────────────┐  ┌─────────────▼──────────────┐   │
│   │ Local SQLite Engine            │  │ External Search Client     │   │
│   │ • Materialized Rollups         │  │ • SearXNG / Grounding API  │   │
│   │ • Protected Category Flags     │  │ • Provider Result Parser   │   │
│   │ • Audit & Recommendation Memory│  │ • Direct URL Cleaner       │   │
│   └────────────────────────────────┘  └────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. The Non-Patronizing Advisory Persona

The system prompt strictly regulates the tone of all advisory and conversational responses.

### 2.1 System Prompt Definition

```markdown
Du bist der KI-Finanzberater und Ziel-Copilot von metacent – einer hochpräzisen, lokalen Zero-Based-Budgeting-Software.

DEINE ROLLE:
- Du bist ein wohlwollender, verlässlicher Sparringspartner auf Augenhöhe.
- Du berätst sachlich, motivierend und unterstützend.
- Du bevormundest den Nutzer NIEMALS. Du hältst keine moralischen Vorträge und verurteilst kein Ausgabeverhalten.

SPRACHLICHE LEITPLANKEN (STRIKTE VERBOTE & GEBOTE):
1. KEINE BELEHRUNGEN ODER MORALISIERUNGEN:
   - Verwende NIEMALS Wörter wie: "überflüssig", "Verschwendung", "sündigen", "schlecht investiert", "disziplinlos".
   - Ausgaben für Genuss, Entspannung und persönliche Vorlieben sind absolut legitim und werden respektiert.
2. KEINE BEVORMUNDENDEN IMPERATIVE:
   - Verwende NIEMALS: "Du musst", "Du sollst", "Du darfst nicht mehr", "Hör auf mit".
   - Verwende stattdessen: "Eine Option wäre...", "Wenn du möchtest, könnten wir...", "Möchtest du testen, was passiert, wenn...", "Was hältst du davon?".
3. ZIELORIENTIERUNG STATT VERZICHT:
   - Sparen ist kein Selbstzweck. Verknüpfe jeden Einspargedanken direkt mit den Wünschen und Zielen des Nutzers (z.B. "Dadurch erreichst du deine Norwegen-Reise 2 Monate früher").
4. RESPEKT VOR GESCHÜTZTEN BEREICHEN:
   - Sobald der Nutzer signalisiert, dass ein Bereich für seine Lebensqualität unverzichtbar ist, akzeptiere dies sofort ohne weitere Nachfrage und markiere die Kategorie als geschützt.
5. MATHEMATISCHE PRÄZISION:
   - Erfinde keine Zahlen. Alle Berechnungen basieren auf den vom System übergebenen Cent-Beträgen.
```

---

## 3. Privacy Sanitization Gateway (Zero PII Leakage)

To perform internet research without exposing personal financial details, the sanitizer applies strict deterministic transformations:

### 3.1 Sanitization Pipeline

```typescript
export interface SanitizedQuery {
  rawTarget: string;
  sanitizedText: string;
  strippedTokens: string[];
}

export function sanitizeForWebSearch(
  categoryName: string,
  payee: string,
  memo: string,
  approximateAmountCents: number
): SanitizedQuery {
  const stripped: string[] = [];

  // 1. Strip IBANs and account numbers
  const ibanRegex = /[A-Z]{2}[0-9]{2}[0-9A-Z]{11,30}/gi;
  if (ibanRegex.test(memo) || ibanRegex.test(payee)) {
    stripped.push('IBAN/Account Identifier');
  }

  // 2. Classify broad utility type
  const lower = (categoryName + ' ' + payee).toLowerCase();
  let genericQuery = '';

  if (lower.includes('mobil') || lower.includes('handy') || lower.includes('telekom') || lower.includes('vodafone')) {
    genericQuery = 'Mobilfunk Allnet Flat 25GB 5G Deutschland monatlich kündbar Vergleich 2026';
  } else if (lower.includes('dsl') || lower.includes('internet') || lower.includes('glasfaser')) {
    genericQuery = 'Internet DSL Glasfaser 100 Mbit Flat Deutschland Vergleich 2026';
  } else if (lower.includes('strom') || lower.includes('energie') || lower.includes('stadtwerke')) {
    genericQuery = 'Ökostrom Tarif 2500 kWh Vergleich Deutschland 2026';
  } else if (lower.includes('gas')) {
    genericQuery = 'Gastarif 15000 kWh Vergleich Deutschland 2026';
  } else {
    // Generic purchase/goal item search: take only clean nouns from the category name
    const cleanCategory = categoryName.replace(/[^a-zA-ZäöüÄÖÜß0-9 ]/g, '').trim();
    genericQuery = `${cleanCategory} Preisvergleich Test Alternativen 2026`;
  }

  return {
    rawTarget: payee,
    sanitizedText: genericQuery,
    strippedTokens: stripped,
  };
}
```

---

## 4. Deterministic Financial Math Engine

All scenario simulations are governed by exact integer math:

$$\text{Remaining Needed} = \max(0, \text{Target Amount Cents} - \text{Current Available Cents})$$

$$\text{Effective Monthly Rate} = \text{Base Monthly Rate Cents} + \sum \Delta \text{Lever Cents}$$

$$\text{Projected Months} = \left\lceil \frac{\text{Remaining Needed}}{\text{Effective Monthly Rate}} \right\rceil$$

$$\text{Accelerated Months} = \text{Baseline Projected Months} - \text{Projected Months}$$

If $\text{Accelerated Months} > 0$, the UI displays:
`"${AcceleratedMonths} Monate früher (${formatDate(newDate)})"`

---

## 5. UI / UX Design Specifications (Nothing OS Design Tokens)

### 5.1 Bento-Grid Layout for `/advisor`

The view is structured into a cohesive 4-part Bento Grid:

1. **Header & Status Bento**:
   - Title: `KI-FINANZBERATER & ZIEL-COPILOT`
   - Trigger Button: `[ Ausgaben analysieren ]` (with subtle spinning dot during computation)
   - Privacy Shield Indicator: `100% LOKAL & ANONYMISIERT` (Mint Sage `#ADEBB3`)
2. **Audit & Recommendations Bento (Left Column, 60% Width)**:
   - Summary Banner: High-level observations in a neutral, objective tone.
   - Lever Cards:
     - Card Border: `1px solid var(--nothing-border)`
     - Card Background: `var(--nothing-surface)`
     - Category Label, Current Monthly Baseline, Slider (`-0 €` to `-150 €`)
     - Button `[ Web-Alternativen prüfen ]`
3. **Interactive Target Timeline Bento (Right Column, 40% Width)**:
   - Active Goal Selector (e.g. `Urlaub Schweden`, `Notgroschen`)
   - Comparative Bar:
     - Gray bar: Normales Zieldatum (`Dezember 2027`)
     - Mint Sage bar: Beschleunigtes Zieldatum (`September 2027`)
     - Delta Callout: `+ 3 Monate Zeitgewinn`
   - Action Button: `[ In Budget übernehmen ]`
4. **Conversational Copilot Drawer / Bottom Sheet**:
   - Chat feed with Nothing-style monospace bubble styling.
   - Quick action prompt chips:
     - `„Wie kann ich 100 € schneller sparen?“`
     - `„Neues Sparziel für E-Bike anlegen“`
     - `„Meine Sparziele neu priorisieren“`
     - `„Welche Kategorien sind geschützt?“`
