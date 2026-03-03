---
video_id: "L_jWHffIx5E"
title: "The Database Nobody Talks About"
channel: "Nate B. Jones"
duration: 1580
language: "en"
sections:
  - title: "The Most Popular Database You've Never Considered"
    timestamp: 0
  - title: "Why SQLite Gets Dismissed"
    timestamp: 120
  - title: "Where SQLite Actually Shines"
    timestamp: 340
  - title: "The Performance Question"
    timestamp: 590
  - title: "Real-World Architecture Patterns"
    timestamp: 870
  - title: "When NOT to Use SQLite"
    timestamp: 1150
  - title: "The Future of Embedded Databases"
    timestamp: 1380
---

<!-- t:0 -->
## The Most Popular Database You've Never Considered

Here's a fact that surprises almost every developer I talk to: SQLite is the most widely deployed database engine in the world. It's not even close. It runs on every smartphone, every web browser, most television sets, most automotive multimedia systems, and countless other applications.

Yet when a developer starts a new web project, SQLite is almost never on the shortlist. It's Postgres. It's MySQL. Maybe MongoDB if they're feeling adventurous. SQLite doesn't even enter the conversation.

Today I want to change that. Not because SQLite is always the right choice — it isn't — but because it's the right choice far more often than people realize, and dismissing it reflexively costs teams real time and money.

<!-- t:120 -->
## Why SQLite Gets Dismissed

The objections are always the same, and they're not wrong — they're just incomplete.

"It doesn't support concurrent writes." Correct. SQLite uses a file-level lock. If two processes try to write at the same time, one has to wait. For a busy web application serving thousands of concurrent users who all need to write data simultaneously, this is a genuine limitation.

"It doesn't run as a server." Also correct. There's no TCP connection, no client-server protocol, no way to put it on a separate machine and connect over the network. It's an embedded database — it lives inside your application process.

"It's not serious." This one is just wrong, but it's the most common sentiment I encounter. Developers associate SQLite with prototypes and tutorials, not production systems. The mental model is: SQLite is for learning, Postgres is for real work.

This framing misses the fundamental insight about SQLite's design philosophy. It wasn't built to be a lightweight version of a real database. It was built to be a replacement for direct file I/O, and it happens to give you SQL for free.

<!-- t:340 -->
## Where SQLite Actually Shines

Once you stop comparing SQLite to server databases and start comparing it to flat files, its strengths become obvious.

**Single-user applications.** Desktop apps, mobile apps, CLI tools, local-first software. If your application runs on the user's device and serves one user at a time, SQLite gives you atomic transactions, complex queries, and zero operational overhead. No database server to configure. No connection strings. No network latency.

**Read-heavy web applications.** Content sites, documentation platforms, blogs, analytics dashboards — anything where reads vastly outnumber writes. SQLite handles concurrent reads beautifully. It's only writes that serialize. If your write volume is modest (and for many applications it is), SQLite can serve web traffic without breaking a sweat.

**Edge computing.** This is where things get genuinely exciting. Platforms like Cloudflare and Fly.io are running SQLite databases at the edge, close to users, with replication handled at the infrastructure level. Your database literally follows your users around the globe.

**Embedded analytics.** If you're processing data in a pipeline — ingesting logs, transforming CSVs, aggregating metrics — SQLite gives you a queryable format without the ceremony of spinning up a database server.

<!-- t:590 -->
## The Performance Question

Let's talk numbers, because this is where assumptions get demolished.

For simple reads by primary key, SQLite is faster than any client-server database. Not marginally faster — significantly faster. Why? Because there's no network round trip. No TCP handshake. No protocol overhead. The data goes directly from the file into your process memory.

I benchmarked a simple key-value lookup: read a row by integer primary key from a table with one million rows. SQLite completed it in under fifty microseconds. The same query against a local Postgres instance took about two hundred microseconds. Against a remote Postgres instance, we're looking at one to five milliseconds depending on network conditions.

For writes, the picture is different. A single write transaction in SQLite is actually fast — comparable to Postgres. The problem is throughput: because writes are serialized, you can only do one at a time. Postgres can handle hundreds of concurrent write transactions. SQLite cannot.

But here's the nuance most people miss: how many concurrent write transactions does your application actually need? If you're building a content management system that gets fifty writes per minute, SQLite handles that trivially. If you're building a real-time trading platform, obviously not.

<!-- t:870 -->
## Real-World Architecture Patterns

Let me show you three patterns that work in production today.

**Pattern one: SQLite per tenant.** Instead of one big database with a tenant_id column, give each customer their own SQLite file. Backups become file copies. Migrations run per-file. You can move a customer to a different server by moving a file. Turso and Cloudflare D1 both use this pattern at scale.

**Pattern two: SQLite as cache.** Keep your primary database in Postgres, but replicate frequently-read data into a local SQLite file on each web server. Reads hit local SQLite (microseconds). Writes go to Postgres and propagate to the replicas. This gives you the operational familiarity of Postgres with the read performance of embedded storage.

**Pattern three: Litestream replication.** Litestream is an open-source tool that continuously streams SQLite changes to S3 or any S3-compatible storage. It gives you point-in-time recovery, disaster recovery, and read replicas — all the things people assume SQLite can't do. The architecture is dead simple: one primary writer, replicas restored from S3 wherever you need them.

<!-- t:1150 -->
## When NOT to Use SQLite

I'm not here to tell you SQLite is always the answer. Here are the cases where a server database genuinely makes more sense.

**High write concurrency.** If your application needs hundreds or thousands of simultaneous write transactions, you need a database designed for that. SQLite's write serialization will become your bottleneck.

**Multi-process writes.** If multiple independent applications or services need to write to the same data store, a server database with proper connection handling is the right tool.

**Very large datasets.** SQLite can technically handle databases up to 281 terabytes, but in practice, performance degrades on datasets larger than a few hundred gigabytes. Server databases have more sophisticated caching and query planning for large-scale data.

**Team familiarity.** If your entire team knows Postgres and nobody knows SQLite's quirks (like its type affinity system or its approach to ALTER TABLE), the productivity cost of switching may not be worth it.

<!-- t:1380 -->
## The Future of Embedded Databases

The trend is unmistakable. The industry is moving toward edge computing, local-first software, and reducing operational complexity. All of these trends favor embedded databases.

Cloudflare D1, Turso, LiteFS, Litestream, Electric SQL — there's an entire ecosystem emerging around the idea that your database should live closer to your code, not further away. The server model isn't disappearing, but it's no longer the only model.

My prediction: within five years, the default recommendation for a new web application won't be "spin up a Postgres instance." It'll be "start with an embedded database and add a server database when you actually need one." The burden of proof will shift from "why should I use SQLite?" to "why do I need a server?"

Until then, I'd encourage you to try it on your next project. Not as a toy. Not as a prototype. As the primary data store. You might be surprised how far it takes you.
