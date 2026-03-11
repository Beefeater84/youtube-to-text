-- Seed data for local development
-- 10 channels, tags, and sample transcripts

-- Fixed UUIDs for stable references
do $$
declare
  -- Channels
  ch_nate        uuid := 'a1b2c3d4-0001-4000-8000-000000000001';
  ch_3b1b        uuid := 'a1b2c3d4-0001-4000-8000-000000000002';
  ch_fireship    uuid := 'a1b2c3d4-0001-4000-8000-000000000003';
  ch_lex         uuid := 'a1b2c3d4-0001-4000-8000-000000000004';
  ch_veritasium  uuid := 'a1b2c3d4-0001-4000-8000-000000000005';
  ch_yc          uuid := 'a1b2c3d4-0001-4000-8000-000000000006';
  ch_futur       uuid := 'a1b2c3d4-0001-4000-8000-000000000007';
  ch_traversy    uuid := 'a1b2c3d4-0001-4000-8000-000000000008';
  ch_computerph  uuid := 'a1b2c3d4-0001-4000-8000-000000000009';
  ch_2minpapers  uuid := 'a1b2c3d4-0001-4000-8000-000000000010';

  -- Tags
  tag_tech       uuid := 'b2c3d4e5-0001-4000-8000-000000000001';
  tag_science    uuid := 'b2c3d4e5-0001-4000-8000-000000000002';
  tag_math       uuid := 'b2c3d4e5-0001-4000-8000-000000000003';
  tag_startups   uuid := 'b2c3d4e5-0001-4000-8000-000000000004';
  tag_webdev     uuid := 'b2c3d4e5-0001-4000-8000-000000000005';
  tag_ai         uuid := 'b2c3d4e5-0001-4000-8000-000000000006';
  tag_design     uuid := 'b2c3d4e5-0001-4000-8000-000000000007';
  tag_education  uuid := 'b2c3d4e5-0001-4000-8000-000000000008';
  tag_podcast    uuid := 'b2c3d4e5-0001-4000-8000-000000000009';
  tag_cs         uuid := 'b2c3d4e5-0001-4000-8000-000000000010';
begin

  -------------------------------------------------------
  -- Channels
  -------------------------------------------------------
  insert into public.channels (id, youtube_id, title, description, thumbnail_url, slug)
  values
    (ch_nate,
     'UCnBJ7Qr4N-j5kMOPXNqYcw',
     'Nate B. Jones',
     'Software engineer turned indie maker. Weekly deep-dives on building products, scaling startups, and the tech behind everyday tools.',
     'https://yt3.googleusercontent.com/natebjones_mock_avatar',
     'nate-b-jones'),

    (ch_3b1b,
     'UCYO_jab_esuFRV4b17AJtAw',
     '3Blue1Brown',
     'Animated math explanations. Essence of linear algebra, calculus, neural networks, and more — presented with a unique visual style.',
     'https://yt3.googleusercontent.com/ytc/AIdro_kSfNSMIGFL2RGNpQVzbiVJ42Wp1bCi30KbSdYV2A',
     '3blue1brown'),

    (ch_fireship,
     'UCsBjURrPoezykLs9EqgamOA',
     'Fireship',
     'High-intensity code tutorials and tech news. Learn mass quantities of useful information in mass-deficient amounts of time.',
     'https://yt3.googleusercontent.com/ytc/AIdro_nC5yJCnTRBkHxLSU0YyXJJv0Fu_PaGEYGDKBfq2w',
     'fireship'),

    (ch_lex,
     'UCSHZKyawb7yssEoB6t_72SA',
     'Lex Fridman',
     'Conversations about the nature of intelligence, consciousness, love, and power. Host of the Lex Fridman Podcast.',
     'https://yt3.googleusercontent.com/ytc/AIdro_mR0JdM0mDPjhOILxNPQOKfQ2Mfwdd6wJAf5MXoGQ',
     'lex-fridman'),

    (ch_veritasium,
     'UCHnyfMqiRRG1u-2MsSQLbXA',
     'Veritasium',
     'An element of truth — videos about science, education, and anything else that sparks curiosity.',
     'https://yt3.googleusercontent.com/ytc/AIdro_mNRcSb-oVJ8CuFY4LXBq_a0jrpc_XK_FGjYXeJ',
     'veritasium'),

    (ch_yc,
     'UCcefcZRL2oaA_uBNeo5UOWg',
     'Y Combinator',
     'Videos about startups, technology, and the future from the startup accelerator behind Airbnb, Dropbox, Stripe, and thousands more.',
     'https://yt3.googleusercontent.com/ytc/AIdro_lZnJBpFP8P-HXMtqJH_CXaKlNsw2qP5eK5wW7d',
     'y-combinator'),

    (ch_futur,
     'UC-b3c7kxa5vU-bnmaROgvog',
     'The Futur',
     'An online education platform teaching the business of design to creative professionals. Run by Chris Do.',
     'https://yt3.googleusercontent.com/ytc/AIdro_mdZ_j5sKP8EMPwBpGP6TCXe2XTiKF0Q4_yvH82',
     'the-futur'),

    (ch_traversy,
     'UC29ju8bIPH5as8OGnQzwJyA',
     'Traversy Media',
     'Practical project-based web development tutorials. Covering HTML, CSS, JavaScript, React, Node.js, Python, and more.',
     'https://yt3.googleusercontent.com/ytc/AIdro_nxXaxS6WJsN6k90BFz3lVCy1JWSkEuXPu0e6Vu',
     'traversy-media'),

    (ch_computerph,
     'UC9-y-6csu5WGm29I7JiwpnA',
     'Computerphile',
     'Videos all about computers and computer stuff. Sister channel of Numberphile.',
     'https://yt3.googleusercontent.com/ytc/AIdro_nC7jfCJHUvIkYBH9Xyb9yXvSNjX1O7g_v3f_xV',
     'computerphile'),

    (ch_2minpapers,
     'UCbfYPyITQ-7l4upoX8nvctg',
     'Two Minute Papers',
     'Explaining cutting-edge AI research papers in an approachable way. What a time to be alive!',
     'https://yt3.googleusercontent.com/ytc/AIdro_nkLxDJz2x8oFPxYH9GBZWWJR-cG7LAXWNBe_kd',
     'two-minute-papers')

  on conflict (youtube_id) do nothing;

  -------------------------------------------------------
  -- Tags
  -------------------------------------------------------
  insert into public.tags (id, name, slug)
  values
    (tag_tech,      'Technology',        'technology'),
    (tag_science,   'Science',           'science'),
    (tag_math,      'Mathematics',       'mathematics'),
    (tag_startups,  'Startups',          'startups'),
    (tag_webdev,    'Web Development',   'web-development'),
    (tag_ai,        'AI & ML',           'ai-ml'),
    (tag_design,    'Design',            'design'),
    (tag_education, 'Education',         'education'),
    (tag_podcast,   'Podcast',           'podcast'),
    (tag_cs,        'Computer Science',  'computer-science')
  on conflict (slug) do nothing;

  -------------------------------------------------------
  -- Channel ↔ Tag associations
  -------------------------------------------------------
  insert into public.channel_tags (channel_id, tag_id)
  values
    -- Nate B. Jones: tech, startups, webdev
    (ch_nate,       tag_tech),
    (ch_nate,       tag_startups),
    (ch_nate,       tag_webdev),

    -- 3Blue1Brown: math, education, science
    (ch_3b1b,       tag_math),
    (ch_3b1b,       tag_education),
    (ch_3b1b,       tag_science),

    -- Fireship: tech, webdev
    (ch_fireship,   tag_tech),
    (ch_fireship,   tag_webdev),

    -- Lex Fridman: podcast, ai, science, tech
    (ch_lex,        tag_podcast),
    (ch_lex,        tag_ai),
    (ch_lex,        tag_science),
    (ch_lex,        tag_tech),

    -- Veritasium: science, education
    (ch_veritasium, tag_science),
    (ch_veritasium, tag_education),

    -- Y Combinator: startups, tech
    (ch_yc,         tag_startups),
    (ch_yc,         tag_tech),

    -- The Futur: design, education, startups
    (ch_futur,      tag_design),
    (ch_futur,      tag_education),
    (ch_futur,      tag_startups),

    -- Traversy Media: webdev, tech, education
    (ch_traversy,   tag_webdev),
    (ch_traversy,   tag_tech),
    (ch_traversy,   tag_education),

    -- Computerphile: cs, tech, education
    (ch_computerph, tag_cs),
    (ch_computerph, tag_tech),
    (ch_computerph, tag_education),

    -- Two Minute Papers: ai, science, education
    (ch_2minpapers, tag_ai),
    (ch_2minpapers, tag_science),
    (ch_2minpapers, tag_education)

  on conflict (channel_id, tag_id) do nothing;

  -------------------------------------------------------
  -- Transcripts (only for Nate B. Jones for now)
  -- Three transcripts have sample markdown files in web/public/sample-transcripts/
  -------------------------------------------------------
  insert into public.transcripts
    (channel_id, youtube_video_id, title, description, thumbnail_url, slug, language, duration_seconds, markdown_url, status, published_at)
  values
    (ch_nate, 'dQw4w9WgXcQ', 'How I Built a SaaS in 30 Days With No Budget',
     'A step-by-step walkthrough of launching a micro-SaaS from idea to first paying customer in one month.',
     'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
     'how-i-built-a-saas-in-30-days', 'en', 1245,
     '/sample-transcripts/how-i-built-a-saas-in-30-days.md',
     'done', '2026-01-15T10:00:00Z'),

    (ch_nate, 'Kp7eSUU9oy8', 'Why Most Developers Fail at Marketing',
     'Technical founders often skip marketing entirely. Here is what actually works when you have zero audience.',
     'https://i.ytimg.com/vi/Kp7eSUU9oy8/hqdefault.jpg',
     'why-most-developers-fail-at-marketing', 'en', 934,
     null,
     'done', '2026-01-22T10:00:00Z'),

    (ch_nate, 'L_jWHffIx5E', 'The Database Nobody Talks About',
     'SQLite is secretly powering more applications than Postgres and MySQL combined. Let me show you why.',
     'https://i.ytimg.com/vi/L_jWHffIx5E/hqdefault.jpg',
     'the-database-nobody-talks-about', 'en', 1580,
     '/sample-transcripts/the-database-nobody-talks-about.md',
     'done', '2026-02-03T10:00:00Z'),

    (ch_nate, 'ZmKbFa5gkGY', 'I Replaced My Entire Backend With Edge Functions',
     'Moving from a traditional Node.js server to Supabase Edge Functions. What went right, what broke, and the surprising cost difference.',
     'https://i.ytimg.com/vi/ZmKbFa5gkGY/hqdefault.jpg',
     'replaced-backend-with-edge-functions', 'en', 1120,
     null,
     'done', '2026-02-10T10:00:00Z'),

    (ch_nate, 'TnGl01FkMMo', 'Pricing Your Product: The Math Behind $9 vs $29',
     'A deep dive into pricing psychology, unit economics, and why most indie hackers undercharge.',
     'https://i.ytimg.com/vi/TnGl01FkMMo/hqdefault.jpg',
     'pricing-your-product-math', 'en', 1410,
     null,
     'done', '2026-02-17T10:00:00Z'),

    (ch_nate, 'VYOjWnS4cMY', 'The Tech Stack That Prints Money',
     'After building twelve products I have settled on one stack. Here is exactly what it is and why.',
     'https://i.ytimg.com/vi/VYOjWnS4cMY/hqdefault.jpg',
     'tech-stack-that-prints-money', 'en', 1690,
     '/sample-transcripts/tech-stack-that-prints-money.md',
     'done', '2026-02-24T10:00:00Z')

  on conflict (youtube_video_id, language) do nothing;

end $$;
