# metacent

> Zero-Based Personal Budgeting. Local-first, privacy-focused, keyboard-driven, blazing fast.

Built with **Tauri 2.0 (Rust)**, **Embedded SQLite (WAL mode, memory-mapped I/O)**, and **React 19 / TypeScript / Tailwind CSS v4**.

Designed in an ultra-clean monochrome aesthetic inspired by **Apple** and **Nothing OS** with functional mint-green accents (`#ADEBB3`).

---

## Features

- **Zero-Based Budgeting**: Give every Euro a job (`Bereit zur Zuweisung`).
- **Scale to Millions of Transactions**: Materialized monthly rollups update in $O(1)$ time; TanStack Virtual renders accounts with 1,000,000+ entries at 60fps.
- **Local Privacy (No Bank Connections)**: 100% offline data in local SQLite. Zero cloud tracking or third-party bank log-ins.
- **Statement Import & Account Templates**: Pre-configured profiles for institutions like **Trade Republic** (`;` delimiter, `DD.MM.YYYY`, German comma decimals) with 1-click repeated imports.
- **Local AI Categorization**: Hybrid pipeline using deterministic rules $\to$ local Small Language Models (via **Ollama** `llama3.2:3b` / `qwen2.5:3b`) $\to$ optional OpenRouter fallback.
- **Reflect Analytics**: 5 reporting dashboards (Ausgaben nach Kategorien, Trends, Nettovermögen, Einnahmen vs. Ausgaben, Geld-Alter).
- **Keyboard-Driven**: Comprehensive shortcuts for rapid transaction entry and budget allocations.

---

## Development & Quick Start

### 1. Web Development (Instant Browser Mode)

You can run and test metacent directly in your browser without any prerequisites:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run unit tests (6/6 passing)
npm test

# Build production frontend
npm run build
```

Open your browser at `http://localhost:1420`.

### 2. Native Desktop App (Tauri 2)

#### Linux Mint / Ubuntu Prerequisites:
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf libdbus-1-dev
```

#### Run & Package:
```bash
# Launch desktop development app
npm run tauri dev

# Package native Linux .deb and AppImage:
cargo tauri build --bundles deb,appimage
```

---

## Specification Documents

All architecture and design specifications follow the **Spec-Driven Development** methodology and live under [`specs/`](./specs/):

- [`specs/README.md`](./specs/README.md) — Specification index
- [`specs/vision/VISION.md`](./specs/vision/VISION.md) — Product vision & principles
- [`specs/architecture/DATA_MODEL.md`](./specs/architecture/DATA_MODEL.md) — Database schema & rollups
- [`specs/architecture/ARCHITECTURE.md`](./specs/architecture/ARCHITECTURE.md) — System design & rollup engine
- [`specs/architecture/TECH_STACK.md`](./specs/architecture/TECH_STACK.md) — Technology stack
- [`specs/ux/STYLE_GUIDE.md`](./specs/ux/STYLE_GUIDE.md) — Design system & color tokens
- [`specs/DECISIONS.md`](./specs/DECISIONS.md) — Architecture Decision Records (ADR-001 to ADR-011)
- [`specs/features/`](./specs/features/) — Feature specifications with Gherkin acceptance criteria

