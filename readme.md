# YouTube to Text (MD)

### Project Goal
Transform videos into Markdown files optimal for LLMs and Notebooks.

### Core Features
Gather information on specific topics from trusted sources:
- **Videos** (via this service)
- **Research Reports** (planned)
- **Websites** (integrating website-to-markdown conversion)

### Content Distillation
At each stage, content is refined by:
- **Removing Ads**: Stripping out sponsored segments.
- **Removing "Noisy" Content**: Eliminating filler and off-topic discussion.

### Data Management
- Group content by topics/themes.
- Centralize all data into a single repository.

### Desired Outcomes
1. **Clean Transcripts**: High-quality, ad-free text.
2. **Key Highlights**: Summaries or highlighted core insights.
3. **Knowledge Base Ready**: Seamless export to unified storage for vector search functionality.

### Local development
Requires Docker and Node.js. The Supabase CLI is a root devDependency pinned to `2.111.0`; run it with `npx supabase`.

```bash
npm install                    # in the repo root: installs the pinned Supabase CLI
bash scripts/supabase-env.sh   # once: writes supabase/.env with this project's own keys
npx supabase start             # starts the stack, applies supabase/migrations, loads supabase/seed.sql
npx supabase status -o env     # prints API_URL, ANON_KEY, SERVICE_ROLE_KEY, PUBLISHABLE_KEY, SECRET_KEY
```

Copy the values from `npx supabase status -o env` into `web/.env.local` (`NEXT_PUBLIC_SUPABASE_URL` = `API_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` = `SERVICE_ROLE_KEY`) and `worker/.env` (`SUPABASE_URL` = `API_URL`, `SUPABASE_SERVICE_ROLE_KEY` = `SERVICE_ROLE_KEY`, plus `OPENAI_API_KEY`). Never commit these files or `supabase/.env`.

#### Own keys, no demo keys
The stack does not use the well-known Supabase CLI demo keys. `scripts/supabase-env.sh` generates a random JWT secret and random `sb_publishable_...` / `sb_secret_...` keys into the gitignored `supabase/.env` (template: `supabase/.env.example`). It never overwrites an existing file. `supabase/config.toml` reads the values via `env(...)`, and the CLI derives the anon and service_role JWTs from the secret.

- The JWT secret variable is called `JWT_SECRET` on purpose. The CLI does not fail on an unresolved `env(...)`: it uses the literal text as the value. Without `supabase/.env` the literal `env(JWT_SECRET)` is shorter than the CLI minimum of 16 characters, so `npx supabase start` refuses to run instead of signing tokens with a public string. Keep the variable name at 10 characters or less.
- The demo anon / service_role JWTs are rejected (401). The local API gateway does not validate unknown `apikey` values, so the demo `sb_publishable_...` / `sb_secret_...` keys, like a request with no key at all, only get the `anon` role. RLS applies to them as it does to any anonymous request.

Key rotation: `npx supabase stop` (keeps the data), delete `supabase/.env`, run `bash scripts/supabase-env.sh`, then `npx supabase start`. Rotation invalidates all existing sessions and the keys in `web/.env.local` and `worker/.env`: copy the new values there and restart web and worker.

#### Seed data
`supabase/seed.sql` loads fake channels and transcripts when the database is created (first `npx supabase start` on an empty volume) and on `npx supabase db reset`. It does not run again on later starts. For the home (production) stack, create the database without it:

```bash
SUPABASE_DB_SEED_ENABLED=false npx supabase start    # first start on an empty volume
npx supabase db reset --local --no-seed              # only if you deliberately wipe the database
```

#### Next to other Supabase stacks
Other Supabase CLI projects can run on the same machine.

- `project_id = "youtube-to-text"` in `supabase/config.toml` gives this stack its own containers, volumes and Docker network.
- Ports use the `561xx` range instead of the CLI default `543xx`: API `http://127.0.0.1:56121`, DB `56122`, Studio `http://127.0.0.1:56123`. They do not clash with stacks on `543xx` or `550xx`.
- Only run `npx supabase ...` from this repository, so commands affect this project only. Never run `supabase stop --all`, `docker system prune`, or remove other projects' containers or volumes.

#### Port exposure
The CLI publishes its ports on `0.0.0.0` and has no option to bind them to `127.0.0.1`. On a WSL2 host with NAT networking they are not reachable from the LAN. If Tailscale runs inside WSL, they are reachable from the tailnet. Only the API port is made public, through Tailscale Funnel (#22). Studio and Postgres must stay private. Do not change the global Docker daemon config to restrict binding: it would affect every other stack on the machine.
