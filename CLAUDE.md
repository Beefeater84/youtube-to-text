## Task tracking

All tasks (epics, features, bugs) live in GitHub, not in files in this repo.

- **Repository:** Beefeater84/youtube-to-text
- **Project board:** Beefeater84's project number 5
- **Tasks:** GitHub Issues of this repository. The issue number is the task id and is used in every artifact (branch, plan, commits, PR).
- **Epics:** issues with sub-issues. A feature is a sub-issue of its epic.

Board fields: Status (Backlog, Ready, In progress, In review, Done), Priority (P0, P1, P2), Size (XS, S, M, L, XL).

Use the `gh` CLI to read and update tasks, for example `gh issue view <n>` and `gh project item-list 5 --owner Beefeater84`.

## Branching

- Permanent branch `staging`. Feature branches are created from `staging` in `origin` and merged back into it.
- Never branch from or target `main` or `master`. They hold released code only.
- Branch name: `<type>/<issue-number>-<short-description>`, where type is one of `feat`, `fix`, `docs`, `refactor`, `chore`.
