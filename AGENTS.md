<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# PM DDVC — Planeación Maestra · Agent Rules

## Project Purpose

**PM DDVC** (Planeación Maestra DDVC) is a desktop inventory-planning tool for DDVC (dental supply distribution). It runs as a **Next.js app embedded in Electron** and produces Excel outputs for purchasing decisions. The core workflow: apply filters → set inventory parameters → execute Plan DDVC or Inventario query → export results to Excel → write audit log.

## Tech Stack (non-negotiable)

| Layer | Technology | Version |
|---|---|---|
| UI Framework | Next.js (App Router) | 16.x |
| React | React | 19.x |
| Styling | Tailwind CSS | v4 (CSS-first, no `tailwind.config.ts`) |
| ORM | Prisma ORM | 7.x |
| Database | SQLite | via `@prisma/adapter-better-sqlite3` + `better-sqlite3` |
| Desktop Shell | Electron | see `pm-electron/` |
| Language | TypeScript | 5.x |

> **Never** propose PostgreSQL, MySQL, or any cloud database. The app runs offline on Windows as an `.exe`.

## Architecture

```
pm-ddvc/
├── pm-next/          ← Next.js app (this workspace) — ALL UI and business logic here
│   ├── app/          ← App Router pages and layouts
│   ├── components/   ← Reusable UI components
│   ├── lib/          ← Prisma client, utilities, logger
│   ├── prisma/       ← schema.prisma, migrations
│   └── .agents/      ← Agent skills (see Skills section)
└── pm-electron/      ← Electron shell — DO NOT put business logic here
    └── main.js       ← Loads Next.js dev server (dev) or renderer/ (prod)
```

## Installed Skills — Read Before Implementing

Skills live in `.agents/skills/`. **Load the relevant SKILL.md via `read_file` before writing any code in that domain.**

| Task | Skill to load |
|---|---|
| UI components, pages, layouts | `.agents/skills/frontend-design/SKILL.md` |
| Tailwind CSS tokens, design system | `.agents/skills/tailwind-design-system/SKILL.md` |
| Prisma queries (CRUD, filters, joins) | `.agents/skills/prisma-client-api/SKILL.md` |
| Prisma + SQLite setup, schema init | `.agents/skills/prisma-database-setup/SKILL.md` |
| React/Next.js performance patterns | `.agents/skills/vercel-react-best-practices/SKILL.md` |
| UI/UX quality, accessibility, design decisions | `.agents/skills/ui-ux-pro-max/SKILL.md` |
| UI code review, accessibility audit | `.agents/skills/web-design-guidelines/SKILL.md` |

## Domain Model — Key Tables

### `dim_product`
| Column | Notes |
|---|---|
| `GrupoProducto` | Brand (Marca). Use for `DISTINCT` brand filter. |
| `primaryvendorid` | Vendor ID. Use for `DISTINCT` supplier filter. |
| `iemflag_importacion` | `boolean` — `false` = national, `true` = import supplier |
| `Productlifecyclestateid` | Lifecycle state. Value `2` = obsolete product |

### Monthly sales table (ventas mensuales)
> Schema TBD. Join with `dim_product` on product key. Ask the user for exact column names before writing join queries.

## Business Rules (implement exactly — no interpretation)

### Filter Mutual Exclusivity
- **Marca**, **Proveedor**, and **Días de operación** are **mutually exclusive**. Selecting one must clear and disable the other two.
- **Origen** is also mutually exclusive with all three above: selecting Marca/Proveedor/Día deactivates Origen; selecting Origen clears the other three.

### Filter Behavior
- **Marca** — multi-select with search + "Seleccionar todo". Source: `DISTINCT GrupoProducto` from `dim_product`.
- **Proveedor** — multi-select with search + "Seleccionar todo". Source: `DISTINCT primaryvendorid` from `dim_product`.
- **Días de operación** — single radio: Lunes | Martes | Miércoles | Jueves | Viernes.
- **Origen** — radio, default unselected:
  - "Proveedor nacional" → auto-selects all suppliers where `iemflag_importacion = false`
  - "Proveedor importación" → auto-selects all suppliers where `iemflag_importacion = true`

### Inventory Parameters
- Fields: **Emergencia**, **Mínimo**, **Máximo** (numeric spinners, integer ≥ 1)
- Validation: `Emergencia < Mínimo < Máximo`, all > 0
- Show inline error messages on violation — never silently allow invalid state to proceed.

### Obsolete Products
- Checkbox "Incluir productos obsoletos" — **checked by default**
- When unchecked, exclude rows where `Productlifecyclestateid = 2`

### Action Buttons
- **Plan DDVC** — executes planning calculation, then opens Save-to-Excel dialog
- **Inventario** — queries inventory, then opens Save-to-Excel dialog
- Both dialogs must let the user choose the file path.

### Logging
- On every action (Plan DDVC / Inventario), write a JSON log entry containing: `usuario`, `fecha` (ISO), `accion`, `filtro` (active filter type), selection values, `origen`, `parametros` `{emergencia, minimo, maximo}`.
- Log file path: **one file per day**, stored in a path not easily accessible to users (e.g., `%APPDATA%/pm-ddvc/logs/YYYY-MM-DD.log`).
- Also auto-save the generated Excel to a parallel `exports/` folder in the same base path.

## Coding Conventions

- **No `any` types.** Use proper TypeScript interfaces.
- **Server Components by default.** Add `"use client"` only when browser APIs or interactivity require it.
- **Prisma Client singleton** — instantiate once in `lib/prisma.ts`, never in component files.
- **Native SQLite runtime** — `better-sqlite3` requires install scripts enabled on Windows; if `ignore-scripts=true`, the `.node` binding will be missing and local auth/SQLite access will fail.
- **Tailwind v4 CSS-first** — define all tokens in `@theme {}` inside `globals.css`. Do not create `tailwind.config.ts`.
- **No inline styles.** All styling via Tailwind utility classes.
- **Form validation** — validate on blur and on submit. Never disable the submit button silently without feedback.
- **Error boundaries** — wrap data-fetching server components.
- **Direct imports** — never import from barrel `index.ts` files to preserve tree-shaking.
- **Electron IPC** — any Node.js-only operation (file writes, app paths) must go through `ipcMain`/`ipcRenderer` in `pm-electron/`. Do not use Node APIs directly in Next.js code.

## Do NOT

- Do not add new npm dependencies without checking if the functionality already exists in the current stack.
- Do not use `tailwind.config.ts` — v4 is CSS-first.
- Do not put business logic in `pm-electron/main.js`.
- Do not use `localStorage` for state that must survive Electron reloads — use the SQLite DB instead.
- Do not generate or guess database URLs — the SQLite file path must come from environment config.
- Do not extend authentication beyond the current local login flow unless explicitly requested.
