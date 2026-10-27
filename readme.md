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
Requires Docker and the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) (`npx supabase` works too).

```bash
npx supabase start    # starts the local stack and applies supabase/migrations
npx supabase status   # prints the local API URL and anon / service_role keys
```

Local Supabase listens on the `561xx` port range instead of the CLI default `543xx`, so it does not clash with other Supabase projects on the same machine: API `http://127.0.0.1:56121`, Studio `http://127.0.0.1:56123`. Put the URL and keys from `supabase status` into `web/.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) and `worker/.env` (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`). Never commit these files.

The keys printed by `supabase status` are the well-known Supabase demo keys. They are fine on localhost but must never be used for a stack that is reachable from the internet.
