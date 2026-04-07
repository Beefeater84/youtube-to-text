---
name: feature-slicing-architect
description: Use when designing or modifying frontend architecture for React or Next.js projects to enforce Feature-Sliced Design structure and import rules
---

# Feature-Slicing Architect

## Overview

This skill guides the agent to architect frontend codebases using **Feature-Sliced Design (FSD)**.  
The core principle is **business-first modularity**: organize code by features and domains, not by technical type, while strictly controlling allowed import directions.

## When to Use

- You are **starting a new frontend** project in React or Next.js.
- You are **restructuring an existing frontend** that feels messy, tightly coupled, or hard to scale.
- You are adding a **non-trivial feature** and unsure where its files should live.
- You notice **circular dependencies**, unclear boundaries, or many “god components”.
- You need a **consistent structure** for a team working on the same app.

Do **NOT** use this skill:

- For tiny throwaway prototypes or one-off scripts with no long-term maintenance.
- When you are working on **pure backend** services without UI.

## Core Pattern

### Layers (Top → Bottom)

Standard FSD layers for frontend:

- `app/` – App initialization, providers, global styles, routing shell.
- `pages/` (or `pages/` + `app/` routes in Next.js) – Route-level screens only.
- `widgets/` – Complex, reusable UI blocks composed from features and entities.
- `features/` – Units of user value (e.g. `auth/login`, `cart/add-item`).
- `entities/` – Business-domain models (e.g. `user`, `product`, `order`).
- `shared/` – Reusable, project-agnostic UI kit, libs, config, API clients.

### Slices and Segments

Inside each layer:

- **Slice** – Business/domain area (e.g. `user`, `auth`, `product`, `cart`).
- **Segments** inside a slice:
  - `ui/` – Presentational components.
  - `model/` – State, stores, domain logic.
  - `api/` – API clients and data fetching specific to this slice.
  - `lib/` – Helpers specific to this slice.
  - `config/` – Configuration for this slice if needed.

### Import Rule (Critical)

- A layer may **only import from layers strictly below** it:
  - `app` → can import from `pages`, `widgets`, `features`, `entities`, `shared`.
  - `pages` → can import from `widgets`, `features`, `entities`, `shared`.
  - `widgets` → can import from `features`, `entities`, `shared`.
  - `features` → can import from `entities`, `shared`.
  - `entities` → can import from `shared`.
  - `shared` → imports only inside `shared`.

Violations indicate architecture problems:

- **Sideways imports** within the same layer between unrelated slices.
- **Upward imports** from lower layer to higher layer.

When you hit a violation, first consider **extracting shared logic** into a lower layer (often `shared` or a core `entity`).

## Quick Reference

- New domain concept that will be reused across features → **`entities/<name>/`**.
- Purely visual, generic components (buttons, layout, theming) → **`shared/ui/`**.
- Reusable business interaction (e.g. auth login, cart add-to-cart) → **`features/<domain>/<action>/`**.
- Composite block used across multiple pages (header, sidebar, cart preview) → **`widgets/<name>/`**.
- Concrete page for a route → **`pages/<route>/`** (Next.js route file) plus any slices it uses.
- App-level providers, routing, global error boundaries → **`app/`**.

## Implementation Guidance for Next.js (App Router)

When working in Next.js App Router:

- Place global providers, theming, and layout shells under `app/`.
- Keep route segments (`app/(routes)/...`) **thin**: they should compose widgets, features, and entities instead of holding logic.
- Avoid importing features from pages in other routes; extract shared pieces into widgets or entities.
- For server components, you can still follow FSD:
  - Keep data-fetching per slice in `api/`.
  - Keep UI composition per slice in `ui/`.

## Workflow for the Agent

When asked to add or change frontend code:

1. **Identify the layer** based on responsibility (route, widget, feature, entity, or shared).
2. **Choose or create a slice** based on business domain (`user`, `auth`, `product`, `search`, etc.).
3. **Pick the correct segment** inside the slice (`ui`, `model`, `api`, `lib`, `config`).
4. **Check imports**:
   - Ensure all imports go **downwards** in the layer hierarchy.
   - If you need something from a “higher” layer, rethink structure and move shared logic down.
5. **Expose Public API**:
   - For each slice, create a small public surface (e.g. via an `index.ts`) that re-exports intended pieces.
   - Import only through this public API in higher layers instead of deep relative paths.

## Common Mistakes and Fixes

- **Mistake:** Putting most logic directly into `pages/` or `app/`.
  - **Fix:** Move business logic into `features/` or `entities/`, and keep pages as thin composition.

- **Mistake:** Direct imports like `features/cart/add-to-cart/ui/Button` from another feature.
  - **Fix:** Export needed UI through the feature’s public API and import from that, or extract generic parts into `shared/ui`.

- **Mistake:** Cross-importing between unrelated entities or features to “just reuse a small piece”.
  - **Fix:** Extract the truly generic part into `shared/` or a more fundamental `entity`, then depend on that.

- **Mistake:** Ignoring FSD for “quick hacks” that later become permanent.
  - **Fix:** If using this skill, always place new code according to layers and slices, even for small changes.

## How This Skill Interacts with This Project

- This project uses **Next.js + React + TypeScript** on the web side.
- When adding any new UI or feature in the `web` app, the agent should:
  - Design the folder and file placement according to FSD layers.
  - Explain in Russian which layer and slice are used and why.
  - Keep code comments (if any) in English.

