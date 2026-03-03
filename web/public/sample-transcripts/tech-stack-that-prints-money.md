---
video_id: "VYOjWnS4cMY"
title: "The Tech Stack That Prints Money"
channel: "Nate B. Jones"
duration: 1690
language: "en"
sections:
  - title: "Twelve Products Later"
    timestamp: 0
  - title: "The Framework"
    timestamp: 130
  - title: "The Database Layer"
    timestamp: 380
  - title: "Authentication and Payments"
    timestamp: 620
  - title: "Hosting and Deployment"
    timestamp: 910
  - title: "The Frontend"
    timestamp: 1140
  - title: "What I'd Change"
    timestamp: 1420
---

<!-- t:0 -->
## Twelve Products Later

After launching twelve different products over the past four years — some successful, most not — I've finally converged on a single technology stack. Not because it's the most innovative or the most performant, but because it lets me ship the fastest while making the fewest mistakes.

Every time I used to start a new project, I'd spend the first week evaluating frameworks, comparing hosting providers, and second-guessing database choices. That's a week I could have spent talking to users or building the thing.

The stack I'm about to share isn't trendy. Some of it is borderline boring. But boring is exactly the point. Boring means predictable. Predictable means I spend my time on the product, not on fighting the tools.

<!-- t:130 -->
## The Framework

Next.js. Full stop. I've tried Remix, SvelteKit, Nuxt, Astro, and even raw Express with React. They're all fine tools. But Next.js wins for me on one axis that matters more than any benchmark: ecosystem density.

When something breaks at two in the morning and I need an answer, Next.js has the largest surface area of blog posts, Stack Overflow answers, GitHub issues, and tutorial videos. I can almost always find someone who's hit the same problem.

The App Router was a rough transition. I won't pretend it wasn't. Server components broke half my mental models and most of my existing patterns. But once I rewired my thinking, the benefits became clear: smaller client bundles, simpler data fetching, and a genuinely better model for SEO-focused applications.

For my use case — which is predominantly content-heavy applications with some interactive features — the App Router is the right abstraction. If I were building a real-time collaborative editor, I'd probably reach for something else. But I'm not. I'm building products that display data, accept input, and process it.

<!-- t:380 -->
## The Database Layer

Supabase with Postgres. This is the choice that saves me the most time, and it's not close.

Before Supabase, my database workflow looked like this: provision an RDS instance, set up connection pooling with PgBouncer, write a migration framework or adopt an existing one, build an admin interface for debugging, implement row-level security manually, and configure backups.

With Supabase, all of that comes out of the box. I get a managed Postgres instance with connection pooling, a migration system, a built-in admin interface (Supabase Studio), row-level security policies, automatic backups, and — the part people overlook — a really good JavaScript client library that handles typing, filtering, and real-time subscriptions.

I'm not going to pretend Supabase is perfect. The local development experience has rough edges. The pricing model can surprise you if your database grows faster than expected. And if you need something exotic — graph queries, time-series optimization, vector search at scale — you'll outgrow it.

But for the first version of any product, Supabase gives me a database, an API, and an admin panel in under five minutes. That's not a small thing when you're racing to validate an idea.

<!-- t:620 -->
## Authentication and Payments

Supabase Auth for identity. Stripe for payments. This combination handles ninety-five percent of what a typical SaaS needs.

Supabase Auth gives me email/password, magic links, and OAuth providers (Google, GitHub) with essentially zero configuration. It integrates with row-level security policies, which means I can enforce access control at the database level rather than in application code. One less thing to get wrong.

For payments, I've tried Paddle, LemonSqueezy, and Stripe. I keep coming back to Stripe because of one thing: reliability. Stripe's webhook system is battle-tested. When a payment event fires, it fires. When a subscription renews, the webhook arrives. I've never had to build reconciliation logic to handle missed events — which I have had to do with other providers.

The integration pattern is always the same: user signs up via Supabase Auth, creates a Stripe customer on first purchase, and I store the Stripe customer ID in my users table. Webhook handlers update subscription status in the database. Row-level security policies check subscription status before granting access to premium features.

It's not glamorous, but it works every single time.

<!-- t:910 -->
## Hosting and Deployment

Vercel for the web application. A tiny VPS for background jobs.

I know Vercel gets criticism for pricing and vendor lock-in. Both concerns are valid. But for my use case — deploying Next.js applications — nobody does it better. Preview deployments for every pull request, automatic HTTPS, global CDN, and a deployment pipeline that takes about forty seconds from push to production.

The background job server is the one piece I self-host. Not because I want to manage infrastructure, but because long-running processes don't fit the serverless model well. A five-dollar-per-month VPS running a simple Node.js process with BullMQ handles all my async work: sending emails, processing uploads, generating reports, and syncing third-party data.

I deploy the background worker with a simple Docker Compose setup and a GitHub Action that SSHs into the server and pulls the latest image. It's not Kubernetes. It's not elegant. But it has been running without intervention for eight months.

The mental model is clean: Vercel handles everything that's request-response (web pages, API routes), and the VPS handles everything that's fire-and-forget (jobs, cron tasks, long computations).

<!-- t:1140 -->
## The Frontend

React with Tailwind CSS. I've tried to leave this combination twice, and both times I came back within a month.

The argument for other frameworks is always about developer experience or performance. Svelte is more intuitive. Vue has better reactivity. Solid is faster. I don't disagree with any of these claims. But developer experience for me includes the ability to hire contractors who can contribute on day one, find component libraries that work without modification, and debug issues using the largest pool of community knowledge available.

Tailwind CSS is polarizing, and I understand why. Writing utility classes feels wrong until it doesn't. The moment it clicked for me was when I realized I hadn't opened a CSS file in three weeks. Every style was colocated with the component it affected. Refactoring a component meant moving one file, not hunting for orphaned class names across a stylesheet.

For component libraries, I use Headless UI for accessible primitives (modals, menus, tabs) and build everything else from scratch with Tailwind. I've tried Shadcn, Radix, and Chakra. They're all good, but I've found that starting with unstyled primitives and adding Tailwind classes gives me the most control with the least abstraction.

<!-- t:1420 -->
## What I'd Change

No stack is final, and I'm not precious about any of these choices. Here's what I'm watching and what might change in the next year.

**Drizzle ORM.** I currently write raw SQL for complex queries and use the Supabase client for simple CRUD. Drizzle sits in an interesting middle ground: type-safe queries without the weight of Prisma. I've experimented with it on a side project, and the developer experience is impressive. It might replace my raw SQL layer.

**Turso for edge data.** For applications where latency matters — and most user-facing applications, honestly — having the database at the edge rather than in a single region is compelling. Turso's model of replicated SQLite databases is something I want to explore for my next read-heavy project.

**Cloudflare Workers.** The cold start times are essentially zero, the global distribution is built-in, and the pricing is generous. If Cloudflare's Next.js support matures to the point where I can deploy without compromises, I'd seriously consider migrating from Vercel.

But here's the thing: none of these changes are urgent. The current stack works. It ships products. It makes money. And at the end of the day, the best technology stack is the one that lets you focus on the problem you're actually trying to solve.
