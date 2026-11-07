# metacent — Specification Documents

> Zero-based personal budgeting, inspired by YNAB. Privacy-first, keyboard-driven, local-first.

This directory contains the living specification for **metacent**. Every feature, screen, and architectural decision is documented here *before* it is built. The specs serve as the single source of truth for what the product does, why it exists, and how it should behave.

## Directory Structure

```
specs/
├── README.md                  ← You are here
├── GLOSSARY.md                ← Domain terminology & definitions
├── DECISIONS.md               ← Architecture Decision Records (ADRs)
├── vision/
│   ├── VISION.md              ← Product vision, principles & goals
│   └── USER_STORIES.md        ← User stories grouped by theme
├── ux/
│   ├── SCREENS.md             ← Catalog of every screen & view
│   ├── FLOWS.md               ← End-to-end user flow walkthroughs
│   └── STYLE_GUIDE.md         ← Visual design language & conventions
├── architecture/
│   ├── ARCHITECTURE.md        ← System design & component architecture
│   ├── DATA_MODEL.md          ← Entity relationships, schemas & state machines
│   ├── API.md                 ← Service layer commands & query specifications
│   └── TECH_STACK.md          ← Technology choices and rationale
├── features/
│   ├── budget-planning/       ← SPEC.md + ACCEPTANCE.md (Gherkin)
│   ├── account-management/    ← SPEC.md + ACCEPTANCE.md (Gherkin)
│   ├── transaction-register/  ← SPEC.md + ACCEPTANCE.md (Gherkin)
│   ├── file-import/           ← SPEC.md + ACCEPTANCE.md (Gherkin)
│   ├── reconciliation/        ← SPEC.md + ACCEPTANCE.md (Gherkin)
│   └── reports-reflect/       ← SPEC.md + ACCEPTANCE.md (Gherkin)
└── releases/
    └── _TEMPLATE.md           ← Release checklist and version template
```

## How to Read These Specs

| If you want to…                        | Start with |
| --------------------------------------- | ---------- |
| Understand *what* metacent is           | [`vision/VISION.md`](./vision/VISION.md) |
| See *who* uses it and *why*             | [`vision/USER_STORIES.md`](./vision/USER_STORIES.md) |
| Learn the budgeting vocabulary          | [`GLOSSARY.md`](./GLOSSARY.md) |
| Know every screen and its elements      | [`ux/SCREENS.md`](./ux/SCREENS.md) |
| Walk through key user journeys          | [`ux/FLOWS.md`](./ux/FLOWS.md) |
| Check colors, typography, and style     | [`ux/STYLE_GUIDE.md`](./ux/STYLE_GUIDE.md) |
| Inspect database entities & schema      | [`architecture/DATA_MODEL.md`](./architecture/DATA_MODEL.md) |
| Understand component architecture       | [`architecture/ARCHITECTURE.md`](./architecture/ARCHITECTURE.md) |
| Review commands and service API         | [`architecture/API.md`](./architecture/API.md) |
| Read architectural decisions            | [`DECISIONS.md`](./DECISIONS.md) |
| Examine feature acceptance tests        | [`features/`](./features/) |

## Conventions

- **User stories** follow: *As a [role], I want [goal] so that [benefit]*, with acceptance criteria checkboxes.
- **Acceptance criteria** in feature folders use Gherkin format (`GIVEN / WHEN / THEN`).
- **Amounts**: Stored as integer minor units (cents) to eliminate floating-point errors.
- **Glossary** terms are referenced in Title Case throughout (e.g., "Ready to Assign", "Working Balance").

## Specification Status

| Document | Path | Status |
| :--- | :--- | :--- |
| Product Vision | `vision/VISION.md` | ✅ Draft v1 Ready |
| User Stories | `vision/USER_STORIES.md` | ✅ Draft v1 Ready |
| Glossary | `GLOSSARY.md` | ✅ Draft v1 Ready |
| Screen Inventory | `ux/SCREENS.md` | ✅ Draft v1 Ready |
| User Flows | `ux/FLOWS.md` | ✅ Draft v1 Ready |
| Style Guide | `ux/STYLE_GUIDE.md` | ✅ Draft v1 Ready |
| System Architecture | `architecture/ARCHITECTURE.md` | ✅ Draft v1 Ready |
| Data Model | `architecture/DATA_MODEL.md` | ✅ Draft v1 Ready |
| Service Layer API | `architecture/API.md` | ✅ Draft v1 Ready |
| Technology Stack | `architecture/TECH_STACK.md` | ✅ Draft v1 Ready |
| Architecture Decisions | `DECISIONS.md` | ✅ ADR-001 to ADR-005 |
| Feature: Budget Planning | `features/budget-planning/` | ✅ Review Ready |
| Feature: Account Management | `features/account-management/` | ✅ Review Ready |
| Feature: Transaction Register | `features/transaction-register/` | ✅ Review Ready |
| Feature: File Import | `features/file-import/` | ✅ Review Ready |
| Feature: Reconciliation | `features/reconciliation/` | ✅ Review Ready |
| Feature: Reports (Reflect) | `features/reports-reflect/` | ✅ Review Ready |
