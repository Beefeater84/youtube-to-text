-- Seed data for local development
-- Channel: @NateBJones (fictional tech/entrepreneurship creator)

-- Fixed UUIDs for stable references
do $$
declare
  ch_id uuid := 'a1b2c3d4-0001-4000-8000-000000000001';
begin

  -------------------------------------------------------
  -- Channel
  -------------------------------------------------------
  insert into public.channels (id, youtube_id, title, description, thumbnail_url, slug)
  values (
    ch_id,
    'UCnBJ7Qr4N-j5kMOPXNqYcw',
    'Nate B. Jones',
    'Software engineer turned indie maker. Weekly deep-dives on building products, scaling startups, and the tech behind everyday tools.',
    'https://yt3.googleusercontent.com/natebjones_mock_avatar',
    'nate-b-jones'
  )
  on conflict (youtube_id) do nothing;

  -------------------------------------------------------
  -- Transcripts (status = 'done', no markdown files yet)
  -------------------------------------------------------
  insert into public.transcripts
    (channel_id, youtube_video_id, title, description, thumbnail_url, slug, language, duration_seconds, status, published_at)
  values
    (ch_id, 'dQw4w9WgXcQ', 'How I Built a SaaS in 30 Days With No Budget',
     'A step-by-step walkthrough of launching a micro-SaaS from idea to first paying customer in one month.',
     'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
     'how-i-built-a-saas-in-30-days', 'en', 1245, 'done', '2026-01-15T10:00:00Z'),

    (ch_id, 'Kp7eSUU9oy8', 'Why Most Developers Fail at Marketing',
     'Technical founders often skip marketing entirely. Here is what actually works when you have zero audience.',
     'https://i.ytimg.com/vi/Kp7eSUU9oy8/hqdefault.jpg',
     'why-most-developers-fail-at-marketing', 'en', 934, 'done', '2026-01-22T10:00:00Z'),

    (ch_id, 'L_jWHffIx5E', 'The Database Nobody Talks About',
     'SQLite is secretly powering more applications than Postgres and MySQL combined. Let me show you why.',
     'https://i.ytimg.com/vi/L_jWHffIx5E/hqdefault.jpg',
     'the-database-nobody-talks-about', 'en', 1580, 'done', '2026-02-03T10:00:00Z'),

    (ch_id, 'ZmKbFa5gkGY', 'I Replaced My Entire Backend With Edge Functions',
     'Moving from a traditional Node.js server to Supabase Edge Functions. What went right, what broke, and the surprising cost difference.',
     'https://i.ytimg.com/vi/ZmKbFa5gkGY/hqdefault.jpg',
     'replaced-backend-with-edge-functions', 'en', 1120, 'done', '2026-02-10T10:00:00Z'),

    (ch_id, 'TnGl01FkMMo', 'Pricing Your Product: The Math Behind $9 vs $29',
     'A deep dive into pricing psychology, unit economics, and why most indie hackers undercharge.',
     'https://i.ytimg.com/vi/TnGl01FkMMo/hqdefault.jpg',
     'pricing-your-product-math', 'en', 1410, 'done', '2026-02-17T10:00:00Z'),

    (ch_id, 'VYOjWnS4cMY', 'The Tech Stack That Prints Money',
     'After building twelve products I have settled on one stack. Here is exactly what it is and why.',
     'https://i.ytimg.com/vi/VYOjWnS4cMY/hqdefault.jpg',
     'tech-stack-that-prints-money', 'en', 1690, 'done', '2026-02-24T10:00:00Z')

  on conflict (youtube_video_id) do nothing;

end $$;
