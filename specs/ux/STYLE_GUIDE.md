# metacent — Visual Design & Style Guide

## Design Philosophy

**metacent** follows an ultra-clean, minimalist design language inspired by **Apple** and **Nothing OS**:
- **Monochrome & Low Highlighting**: A calm, high-contrast, black-and-white foundation. Color is never decorative — it is applied with strict intentionality only when user action or critical status feedback is required.
- **Mint-Green Accent**: The single brand accent color is mint-green (`#ADEBB3`), drawn directly from the metacent bamboo logo.
- **No Category Icons**: Categories rely strictly on clean typography and hierarchy — no emojis, no distracting colored badges.
- **Mono-Color Iconography**: All system icons use thin, single-color line strokes (1.5px stroke width).
- **Desktop Density & Speed**: High data density suitable for power users managing millions of financial records.

---

## Brand & Logo

- **Symbol**: Geometric bamboo stalk mark in crisp black lines against mint-green (`mockups/logo.png`).
- **Meaning**: Strength, flexibility, organic steady growth, resilience.
- **Placement**: Top-left sidebar brand header with the title `metacent`.

---

## Color Palette

### Primary Brand Colors

| Token | Hex | Role |
| :--- | :--- | :--- |
| `color-brand-primary` | `#ADEBB3` | Mint-green brand accent, active highlights, funded states |
| `color-brand-light` | `#D9F6DC` | Soft mint tint for hover states, selected item backgrounds |
| `color-brand-deep` | `#1A4023` | Dark forest green for text on mint badges, high-contrast labels |

### Dark Theme (Default)

| Token | Hex | Role |
| :--- | :--- | :--- |
| `bg-app` | `#0D110E` | Main application background (deep matte graphite) |
| `bg-surface` | `#141A16` | Cards, registers, table containers, popovers |
| `bg-sidebar` | `#0A0D0B` | Left navigation sidebar |
| `bg-input` | `#1B241E` | Text inputs, dropdowns, table edit cells |
| `border-subtle` | `#232E26` | Row dividers, subtle grid borders |
| `border-active` | `#ADEBB3` | Focus rings, active inputs |
| `text-primary` | `#F1F5F2` | High-contrast body text, balances |
| `text-secondary` | `#8C9E91` | Labels, headers, table column headers, helper text |
| `text-disabled` | `#4C5950` | Inactive or empty states |

### Light Theme

| Token | Hex | Role |
| :--- | :--- | :--- |
| `bg-app` | `#F7F9F7` | Clean paper background |
| `bg-surface` | `#FFFFFF` | Register and planning cards |
| `bg-sidebar` | `#EEF2EF` | Minimal light grey/green sidebar |
| `bg-input` | `#FFFFFF` | Input fields with `#D4DDD6` border |
| `border-subtle` | `#E1E8E3` | Dividers and table lines |
| `text-primary` | `#121814` | Primary high-contrast text |
| `text-secondary` | `#596B5F` | Secondary labels and notes |

### Functional Semantic States (Low Highlighting)

Status colors are strictly reserved for state communication, muted and desaturated:

| State | Dark Hex | Light Hex | Meaning |
| :--- | :--- | :--- | :--- |
| **Funded / Positive** | `#ADEBB3` | `#2E7D32` | Ready to assign, target fully met, positive net income |
| **Warning / Underfunded** | `#F3D279` | `#B26A00` | Target partially funded, approaching due date |
| **Danger / Overspent** | `#E8706D` | `#D32F2F` | Category overspent, assigned > ready funds |
| **Reconciled Lock** | `#8C9E91` | `#596B5F` | Neutral lock indicating reconciled/immutable state |

---

## Typography

- **Font Family**: Inter, SF Pro, or system sans-serif (`font-sans`).
- **Tabular Numerals**: Numeric balance columns, registers, and currency inputs must strictly use `font-variant-numeric: tabular-nums` (monospace numbers) to prevent horizontal jittering during updates.
- **Hierarchy**:
  - `Display / Large Balance`: 24px–32px, Medium weight (500)
  - `Section Header`: 16px–18px, Semi-Bold (600)
  - `Table Headers`: 11px, Uppercase, Tracking +0.05em, Secondary text
  - `Table Rows / Ledger`: 13px, Regular (400)
  - `Badges / Meta`: 11px, Medium (500)

---

## Localization & Number Formatting

- **Default Language**: German (`de-DE`).
- **Default Currency**: Euro (`€`).
- **Formatting Conventions**:
  - Currency: `1.234,56 €` (space before `€`, comma decimal, dot thousands).
  - Negative Currency: `-700,00 €`.
  - Dates: `DD.MM.YYYY` (e.g. `01.11.2026`).
  - Short Months: `Nov 2026`, `Dez 2026`, `Jan 2027`.

---

## Layout & Navigation

- **Sidebar (Fixed width: 240px)**:
  - Header: Logo mark + `metacent`
  - Main links:
    - **Planung** (`/plan`)
    - **Berichte** (`/reflect`)
    - **Alle Konten** (`/accounts`)
  - Kontenliste (grouped by `BARKONTEN`, `KREDITKONTEN`, `KREDITE & DARLEHEN`)
  - "+ Konto hinzufügen" button at the bottom of the list
  - Settings / Einstellungen cog at footer
  - *(Notice: All external bank connection links removed)*
- **Content Area**: Flexible width with virtualized scroll containers for high performance.
- **Inspector / Detail Panel (Width: 320px, collapsible)**: Context-dependent (Target settings, Selected transaction details, Importer template editor).

---

## Iconography & Component Styling

- **Icons**: 100% monochrome, line stroke (1.5px stroke width), no multicolored fills.
- **Buttons**:
  - Primary: Background `#ADEBB3`, Text `#0D110E`, rounded-md (6px), no shadow.
  - Secondary / Outline: Transparent background, subtle border `#232E26`, text `#F1F5F2`.
  - Destructive: Subdued red background or red text on hover only.
- **Table Cells**: Compact row height (32px–36px), zero extra padding, instantaneous focus.
