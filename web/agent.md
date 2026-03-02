# Web Application Architecture

This document describes the frontend architecture for the `web` package.
Follow these principles when adding or modifying code.

---

## Feature-Sliced Design (FSD)

The project follows **Feature-Sliced Design** — a layered architecture where each
layer has a strict responsibility and can only import from layers below it.

### Layer hierarchy (top → bottom)

| Layer | Path | Responsibility |
|---|---|---|
| `app` | `app/` | Next.js App Router: routes, layouts, metadata, global providers. **No business logic.** |
| `application` | `application/` | Top-level compositions: page-level components that wire together widgets and features. |
| `widgets` | `widgets/` | Self-contained UI blocks composed from features and entities (e.g. `Header`, `VideoCard`, `TranscriptViewer`). |
| `features` | `features/` | User-facing interactions and use-cases (e.g. `search-video`, `request-transcript`, `auth`). |
| `entities` | `entities/` | Core domain models and their UI representations (e.g. `video`, `transcript`, `channel`). |
| `shared` | `shared/` | Reusable utilities, UI kit, constants, types, API clients — no business knowledge. |

### Import rules

```
app → application → widgets → features → entities → shared
```

- A layer may only import from layers **below** it (to the right in the arrow chain).
- Same-layer imports are **forbidden** (features must not import other features directly).
- Cross-cutting concerns go into `shared`.

### Slice structure

Each slice inside a layer follows a consistent internal layout:

```
features/
  search-video/
    ui/            — React components
    model/         — state, hooks, logic
    api/           — data fetching
    lib/           — pure helpers
    index.ts       — public API of the slice
```

Only re-export through `index.ts` — internal files must not be imported directly.

---

## Key conventions

- **`app/` is only for routing.** Route files (`page.tsx`, `layout.tsx`, `loading.tsx`, etc.)
  should delegate rendering to components from `application/`.
- **Colocation over scattering.** Keep related code (component + hook + types) in the
  same slice rather than in separate global folders.
- **Barrel exports.** Every slice exposes a single `index.ts`; consumers import from there.
- **Naming.** Slice folders use `kebab-case`. Components use `PascalCase`.
- **No circular dependencies.** Enforce the layer hierarchy strictly.
