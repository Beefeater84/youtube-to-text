---
video_id: "dQw4w9WgXcQ"
title: "How I Built a SaaS in 30 Days With No Budget"
channel: "Nate B. Jones"
duration: 1245
language: "en"
sections:
  - title: "The Challenge"
    timestamp: 0
  - title: "Finding the Right Idea"
    timestamp: 95
  - title: "Building the MVP"
    timestamp: 280
  - title: "Launch Strategy"
    timestamp: 520
  - title: "First Paying Customer"
    timestamp: 780
  - title: "Lessons Learned"
    timestamp: 1020
---

<!-- t:0 -->
## The Challenge

I gave myself exactly thirty days and zero dollars to build a software product that someone would actually pay for. Not a side project. Not a toy. A real business that solves a real problem and generates real revenue.

Why the constraint? Because I've watched too many founders spend months planning, raise money they don't need, and build features nobody asked for. I wanted to prove — to myself and to you — that the fastest path to a working product is radical simplicity.

The rules were straightforward: no paid tools beyond what I already had, no freelancers, no ads. Just me, my laptop, and whatever free tiers the internet would give me.

<!-- t:95 -->
## Finding the Right Idea

The biggest trap developers fall into is building something technically interesting rather than something people need. I spent the first three days doing nothing but talking to people. Not coding. Not designing. Talking.

I posted in five different communities asking one question: "What repetitive task do you wish software handled for you?" The responses were fascinating. People didn't want another project management tool. They wanted very specific, boring automations.

One theme kept emerging: small business owners were spending hours each week manually copying data between their invoicing tool and their spreadsheet. Not because no integration existed, but because every integration they tried was either too complex or too expensive for their scale.

That was it. That was the product: a dead-simple, affordable sync between two specific tools. Nothing more.

<!-- t:280 -->
## Building the MVP

I gave myself exactly two weeks to build. The technology choices were deliberately boring: a simple web app with a form, a background job that runs every hour, and a dashboard showing sync status.

The entire backend was three API endpoints. The frontend was a single page. Authentication was handled by a third-party provider because building auth from scratch is how side projects die.

The key insight was deciding what *not* to build. No custom scheduling interface. No webhook configuration. No multi-tenant architecture. One sync direction, one frequency, one pricing tier. Every feature request got the same answer: "After launch."

By day fourteen, I had a working prototype that could sync invoices from Tool A to Spreadsheet B every hour. It wasn't pretty, but it worked.

<!-- t:520 -->
## Launch Strategy

With no budget for ads and no existing audience, I needed creative distribution. My strategy had three parts.

First, I went back to the same communities where I'd found the problem. I didn't pitch the product. I wrote a detailed post about the problem itself, shared the manual workarounds I'd discovered, and mentioned at the end that I'd built a tool to automate it.

Second, I recorded a three-minute demo video showing the before and after. No fancy editing. Just screen recording with narration. I posted it everywhere the target audience might see it.

Third, I offered the first twenty users a lifetime deal at half price in exchange for feedback. This wasn't about revenue. It was about getting real users who would tell me what was broken.

<!-- t:780 -->
## First Paying Customer

Day twenty-two. I still remember refreshing my Stripe dashboard and seeing that first charge come through. Fourteen dollars. From a bookkeeper in Ohio who'd found my post on a small business forum.

She sent me an email that same day: "This saves me about forty minutes every Monday. Worth every penny." That single email taught me more about product-market fit than any book I've read.

By day thirty, I had eleven paying customers and twenty-three on the free trial. Monthly recurring revenue was just over a hundred and fifty dollars. Not life-changing money, but proof that the model works.

The most surprising part? Seven of those eleven customers found me through word of mouth. They told a colleague or a friend who had the same problem. That's when I knew the product had legs.

<!-- t:1020 -->
## Lessons Learned

Thirty days later, here's what I know that I didn't before.

The constraint wasn't a handicap — it was a superpower. Without money, you can't waste money on things that don't matter. Without time, you can't build features nobody needs. The limitations forced every decision to be intentional.

Talk to users before, during, and after building. The three days I spent not coding were the most productive days of the entire month. Every hour of conversation saved me ten hours of building the wrong thing.

Launch before you're ready. My product on day twenty-two was embarrassing compared to what I wanted it to be. But it was good enough to solve one problem for one person, and that's all you need to start learning.

Finally, boring technology is your friend. I didn't use a single framework I hadn't used before. I didn't try any new deployment strategies. I used the most boring, reliable stack I knew, and it let me focus entirely on the problem instead of the tools.

The product still runs today. It's not going to make me rich, but it pays for itself and serves a small group of people who genuinely rely on it. And that, frankly, feels better than any technical achievement.
