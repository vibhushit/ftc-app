-- ═══════════════════════════════════════════════════════════════════════════════
-- FTC — Seed Data (Demo Project)
-- Covers all 20 featured UI creators + 1 consumer + services + sample data
-- Run via: npx supabase db query --linked --file supabase/seed.sql
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Disable the CONCURRENTLY trigger (can't run inside a transaction) ────────
ALTER TABLE public.creator_profiles DISABLE TRIGGER trg_refresh_creator_stats;

-- ─── 1. AUTH USERS (triggers handle_new_user → auto-creates public.users rows) ─
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_super_admin,
  confirmation_token, recovery_token, email_change, email_change_token_new
) VALUES
  -- Consumer
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000001',
   'authenticated','authenticated','rhea@demo.ftc','',NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Rhea Kapoor"}',
   NOW(),NOW(),FALSE,'','','',''),
  -- Creators
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0001-000000000001',
   'authenticated','authenticated','ananya@demo.ftc','',NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Ananya Desai"}',
   NOW(),NOW(),FALSE,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0001-000000000002',
   'authenticated','authenticated','kabir@demo.ftc','',NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Kabir Sethi"}',
   NOW(),NOW(),FALSE,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0001-000000000003',
   'authenticated','authenticated','meher@demo.ftc','',NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Meher Krishnan"}',
   NOW(),NOW(),FALSE,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0001-000000000004',
   'authenticated','authenticated','aarav@demo.ftc','',NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Aarav Mehta"}',
   NOW(),NOW(),FALSE,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0001-000000000005',
   'authenticated','authenticated','ishita@demo.ftc','',NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Ishita Banerjee"}',
   NOW(),NOW(),FALSE,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0001-000000000006',
   'authenticated','authenticated','vikram@demo.ftc','',NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Vikram Iyer"}',
   NOW(),NOW(),FALSE,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0001-000000000007',
   'authenticated','authenticated','priya@demo.ftc','',NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Priya Joshi"}',
   NOW(),NOW(),FALSE,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0001-000000000008',
   'authenticated','authenticated','rohan@demo.ftc','',NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Rohan Kapoor"}',
   NOW(),NOW(),FALSE,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0001-000000000009',
   'authenticated','authenticated','saniya@demo.ftc','',NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Saniya Rao"}',
   NOW(),NOW(),FALSE,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0001-000000000010',
   'authenticated','authenticated','arjun@demo.ftc','',NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Arjun Nair"}',
   NOW(),NOW(),FALSE,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0001-000000000011',
   'authenticated','authenticated','nikita@demo.ftc','',NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Nikita Shah"}',
   NOW(),NOW(),FALSE,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0001-000000000012',
   'authenticated','authenticated','yash@demo.ftc','',NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Yash Pillai"}',
   NOW(),NOW(),FALSE,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0001-000000000013',
   'authenticated','authenticated','devika@demo.ftc','',NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Devika Raj"}',
   NOW(),NOW(),FALSE,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0001-000000000014',
   'authenticated','authenticated','akshay@demo.ftc','',NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Akshay Bhatt"}',
   NOW(),NOW(),FALSE,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0001-000000000015',
   'authenticated','authenticated','riya@demo.ftc','',NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Riya Malhotra"}',
   NOW(),NOW(),FALSE,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0001-000000000016',
   'authenticated','authenticated','harsh@demo.ftc','',NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Harsh Gupta"}',
   NOW(),NOW(),FALSE,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0001-000000000017',
   'authenticated','authenticated','tara@demo.ftc','',NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Tara Sharma"}',
   NOW(),NOW(),FALSE,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0001-000000000018',
   'authenticated','authenticated','zain@demo.ftc','',NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Zain Ali"}',
   NOW(),NOW(),FALSE,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0001-000000000019',
   'authenticated','authenticated','pooja@demo.ftc','',NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Pooja Hegde"}',
   NOW(),NOW(),FALSE,'','','',''),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0001-000000000020',
   'authenticated','authenticated','siddharth@demo.ftc','',NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Siddharth Menon"}',
   NOW(),NOW(),FALSE,'','','','')
ON CONFLICT (id) DO NOTHING;

-- ─── 2. UPDATE public.users (trigger already created rows, enrich them) ────────
UPDATE public.users SET city='Delhi', locality='Hauz Khas', role='consumer', trust_score=72, is_verified=TRUE
  WHERE id='00000000-0000-0000-0000-000000000001';

UPDATE public.users SET role='creator', is_verified=TRUE WHERE id IN (
  '00000000-0000-0000-0001-000000000001','00000000-0000-0000-0001-000000000002',
  '00000000-0000-0000-0001-000000000003','00000000-0000-0000-0001-000000000004',
  '00000000-0000-0000-0001-000000000005','00000000-0000-0000-0001-000000000006',
  '00000000-0000-0000-0001-000000000007','00000000-0000-0000-0001-000000000008',
  '00000000-0000-0000-0001-000000000009','00000000-0000-0000-0001-000000000010',
  '00000000-0000-0000-0001-000000000011','00000000-0000-0000-0001-000000000012',
  '00000000-0000-0000-0001-000000000013','00000000-0000-0000-0001-000000000014',
  '00000000-0000-0000-0001-000000000015','00000000-0000-0000-0001-000000000016',
  '00000000-0000-0000-0001-000000000017','00000000-0000-0000-0001-000000000018',
  '00000000-0000-0000-0001-000000000019','00000000-0000-0000-0001-000000000020'
);

-- ─── 3. CREATOR PROFILES ──────────────────────────────────────────────────────
INSERT INTO public.creator_profiles
  (id, handle, tagline, bio, discipline, sub_skills, years_exp, starting_at,
   city, area, tier, verification, is_pro, trust_score, avg_rating, review_count,
   completed_jobs, repeat_rate, is_published, available_today, travel_mode,
   languages, gender, response_time, next_slot)
VALUES
  ('00000000-0000-0000-0001-000000000001','@ananyashoots',
   'Cinematic weddings, honest portraits.',
   'I specialize in wedding and portrait photography with a cinematic touch. Every frame is an authentic moment captured — no poses, no pretense.',
   'Photography', ARRAY['Wedding','Pre-wedding','Editorial'],
   3, 22400, 'Mumbai', 'Bandra', 'Platinum', 'vetted', TRUE, 93, 4.60, 40, 35,
   20, TRUE, FALSE, 'both', ARRAY['English','Hindi','Marathi'], 'female', '~15 min', 'Today 6pm'),

  ('00000000-0000-0000-0001-000000000002','@kabirframes',
   'Brand films that move you before they sell you.',
   'Videographer turned filmmaker. 6 years making brand films, wedding cinemas, and music videos. Every brief gets a fresh treatment.',
   'Videography', ARRAY['Wedding film','Brand film','Music video'],
   6, 12000, 'Delhi', 'Hauz Khas', 'Rising', 'phone', FALSE, 64, 4.97, 53, 52,
   25, TRUE, TRUE, 'travel', ARRAY['English','Hindi','Punjabi'], 'male', '~2 hrs', 'Tomorrow 9am'),

  ('00000000-0000-0000-0001-000000000003','@meherdesigns',
   'Fintech & SaaS interfaces that ship.',
   'UI/UX designer with 9 years in fintech and SaaS. I design systems, not one-offs. Clean, accessible, dev-ready.',
   'UI/UX', ARRAY['Mobile app','Design system','Product'],
   9, 14400, 'Bangalore', 'Indiranagar', 'Silver', 'id', FALSE, 77, 4.94, 66, 69,
   30, TRUE, FALSE, 'studio', ARRAY['English','Tamil'], 'female', '~3 hrs', 'Apr 28'),

  ('00000000-0000-0000-0001-000000000004','@aaravinkstudio',
   'Fine-line portraiture, by appointment.',
   'Tattoo artist specializing in fine line and botanical work. Studio in Koramangala. 12 years, 2000+ tattoos, zero regrets.',
   'Tattoo', ARRAY['Fine line','Blackwork','Botanical'],
   12, 9000, 'Bangalore', 'Koramangala', 'Gold', 'vetted', TRUE, 85, 4.91, 79, 86,
   35, TRUE, TRUE, 'studio', ARRAY['English','Hindi','Kannada'], 'male', '~45 min', 'Apr 30'),

  ('00000000-0000-0000-0001-000000000005','@ishita.writes',
   'Brand voice in English and Hindi.',
   'Copywriter and content strategist. I write for D2C brands, fintech, and lifestyle — bilingual EN/HI. 5 years, 80+ clients.',
   'Writing', ARRAY['Copywriting','Long-form','Bilingual'],
   5, 11200, 'Kolkata', 'Park Street', 'Platinum', 'vetted', FALSE, 98, 4.88, 92, 103,
   40, TRUE, TRUE, 'studio', ARRAY['English','Hindi','Bengali'], 'female', '~15 min', 'May 2'),

  ('00000000-0000-0000-0001-000000000006','@vikramanalog',
   'Tape-first mixing for indie artists.',
   'Music producer and mixing engineer. Analog workflow, digital delivery. Specializes in indie, folk, and electronic. 8 years in the game.',
   'Music', ARRAY['Production','Mixing','Mastering'],
   8, 8000, 'Mumbai', 'Andheri', 'Rising', 'phone', FALSE, 62, 4.85, 105, 120,
   45, TRUE, FALSE, 'studio', ARRAY['English','Hindi','Tamil'], 'male', '~8 hrs', 'May 5'),

  ('00000000-0000-0000-0001-000000000007','@priya.illus',
   'Editorial illustration with printmaker sensibility.',
   'Illustrator working in editorial, publishing, and brand contexts. Riso-influenced aesthetic. 11 years, published in 12 magazines.',
   'Illustration', ARRAY['Editorial','Risograph'],
   11, 6000, 'Pune', 'Kothrud', 'Silver', 'id', TRUE, 75, 4.82, 118, 137,
   50, TRUE, TRUE, 'studio', ARRAY['English','Hindi','Marathi'], 'female', '~3 hrs', 'Today 6pm'),

  ('00000000-0000-0000-0001-000000000008','@rohankapoor.grafik',
   'Identity systems for hospitality + DTC.',
   'Brand identity designer. I build visual systems for restaurants, hotels, and direct-to-consumer brands. 4 years, 60+ identities delivered.',
   'Graphic Design', ARRAY['Brand identity','Packaging'],
   4, 10800, 'Delhi', 'Saket', 'Gold', 'vetted', FALSE, 83, 4.79, 131, 154,
   55, TRUE, TRUE, 'studio', ARRAY['English','Hindi'], 'male', '~45 min', 'Tomorrow 9am'),

  ('00000000-0000-0000-0001-000000000009','@saniyashoots',
   'Clean light, clean product, clean edit.',
   'Product and fashion photographer. 7 years of studio work for e-commerce, beauty, and apparel brands. Based in Juhu.',
   'Photography', ARRAY['Product','Fashion','Editorial'],
   7, 22400, 'Mumbai', 'Juhu', 'Platinum', 'vetted', FALSE, 96, 4.76, 144, 171,
   60, TRUE, FALSE, 'both', ARRAY['English','Hindi'], 'female', '~15 min', 'Apr 28'),

  ('00000000-0000-0000-0001-000000000010','@arjun.edits',
   'Post for music videos and reels.',
   'Video editor and colorist. 10 years cutting music videos, reels, and short films. Based in Kochi, works remote.',
   'Editing', ARRAY['Video','Reel','Color grading'],
   10, 4000, 'Kochi', 'Panampilly Nagar', 'Rising', 'phone', FALSE, 67, 4.73, 157, 188,
   65, TRUE, TRUE, 'studio', ARRAY['English','Malayalam','Hindi'], 'male', '~8 hrs', 'Apr 30'),

  ('00000000-0000-0000-0001-000000000011','@nikitadesigns',
   'Packaging for FMCG + wellness brands.',
   'Graphic designer specializing in packaging and print. 3 years of FMCG and wellness brand work from Ahmedabad.',
   'Graphic Design', ARRAY['Social media','Print','Packaging'],
   3, 7200, 'Ahmedabad', 'Navrangpura', 'Silver', 'id', FALSE, 73, 4.70, 170, 205,
   70, TRUE, TRUE, 'studio', ARRAY['English','Hindi','Gujarati'], 'female', '~3 hrs', 'May 2'),

  ('00000000-0000-0000-0001-000000000012','@yashframe',
   'Indie music video specialist.',
   'Videographer and director. 6 years making music videos for independent artists. Signature style: raw, documentary, cinematic.',
   'Videography', ARRAY['Music video','Documentary'],
   6, 27000, 'Bangalore', 'HSR Layout', 'Gold', 'vetted', FALSE, 88, 4.67, 183, 222,
   75, TRUE, FALSE, 'both', ARRAY['English','Tamil','Hindi'], 'male', '~45 min', 'May 5'),

  ('00000000-0000-0000-0001-000000000013','@devikadance',
   'Bharatanatyam + choreography for weddings.',
   'Dancer, choreographer, and dance teacher. Classical training in Bharatanatyam. 9 years choreographing wedding sangeets.',
   'Dance', ARRAY['Wedding','Classical'],
   9, 22400, 'Chennai', 'T. Nagar', 'Platinum', 'vetted', TRUE, 94, 4.64, 196, 239,
   20, TRUE, TRUE, 'travel', ARRAY['Tamil','English','Hindi'], 'female', '~15 min', 'Today 6pm'),

  ('00000000-0000-0000-0001-000000000014','@akshayink',
   'Realism in Goa, walk-ins weekends.',
   'Tattoo artist in Goa. 12 years of realism and blackwork. Walk-ins welcome on weekends. DMs open for custom work.',
   'Tattoo', ARRAY['Realism','Blackwork'],
   12, 4000, 'Goa', 'Assagao', 'Rising', 'phone', FALSE, 65, 4.61, 209, 256,
   25, TRUE, FALSE, 'studio', ARRAY['English','Hindi','Konkani'], 'non-binary', '~8 hrs', 'Tomorrow 9am'),

  ('00000000-0000-0000-0001-000000000015','@riyawrites',
   'D2C copy and ad scripts.',
   'Copywriter for D2C brands. 5 years of performance marketing copy — Meta ads, landing pages, email sequences, scripts.',
   'Writing', ARRAY['Copywriting','Script'],
   5, 4800, 'Delhi', 'Defence Colony', 'Silver', 'id', FALSE, 71, 4.98, 222, 273,
   30, TRUE, TRUE, 'studio', ARRAY['English','Hindi'], 'female', '~3 hrs', 'Apr 28'),

  ('00000000-0000-0000-0001-000000000016','@harshpixel',
   'Landing pages that actually convert.',
   'UI/UX designer focused on conversion. 8 years of landing page and SaaS product design. Backed by real A/B test data.',
   'UI/UX', ARRAY['Web','Landing page','Product'],
   8, 21600, 'Pune', 'Koregaon Park', 'Gold', 'vetted', TRUE, 86, 4.95, 235, 290,
   35, TRUE, TRUE, 'studio', ARRAY['English','Hindi','Marathi'], 'male', '~45 min', 'Apr 30'),

  ('00000000-0000-0000-0001-000000000017','@tarasphoto',
   'Maternity & newborn, 8 years in.',
   'Portrait photographer specializing in maternity, newborn, and family sessions. Studio in Chandigarh. 8 years, 300+ families.',
   'Photography', ARRAY['Maternity','Portrait','Family'],
   11, 22400, 'Chandigarh', 'Sector 17', 'Platinum', 'vetted', FALSE, 99, 4.92, 248, 307,
   40, TRUE, FALSE, 'studio', ARRAY['English','Hindi','Punjabi'], 'female', '~15 min', 'May 2'),

  ('00000000-0000-0000-0001-000000000018','@zainsounds',
   'Film scoring + song production.',
   'Music producer and composer. 4 years of film scoring and song production. Analog gear, modern workflow. Mumbai-based.',
   'Music', ARRAY['Production','Scoring'],
   4, 8000, 'Mumbai', 'Worli', 'Rising', 'phone', FALSE, 63, 4.89, 41, 324,
   45, TRUE, TRUE, 'studio', ARRAY['English','Hindi','Urdu'], 'male', '~8 hrs', 'May 5'),

  ('00000000-0000-0000-0001-000000000019','@pooja.illus',
   'Children''s books + digital editorial.',
   'Illustrator for children''s publishing and digital editorial. 7 years, 15+ books illustrated for Indian and international publishers.',
   'Illustration', ARRAY['Children''s','Digital'],
   7, 6000, 'Hyderabad', 'Jubilee Hills', 'Silver', 'id', TRUE, 76, 4.86, 54, 341,
   50, TRUE, TRUE, 'studio', ARRAY['English','Telugu','Hindi'], 'female', '~3 hrs', 'Today 6pm'),

  ('00000000-0000-0000-0001-000000000020','@sidframes',
   'Wedding cinema with documentary soul.',
   'Wedding filmmaker based in Jaipur. 10 years of wedding cinema with a documentary approach. Films that feel like memories.',
   'Videography', ARRAY['Wedding film','Reel'],
   10, 27000, 'Jaipur', 'C-Scheme', 'Gold', 'vetted', FALSE, 84, 4.83, 67, 358,
   55, TRUE, FALSE, 'travel', ARRAY['English','Hindi','Rajasthani'], 'male', '~45 min', 'Tomorrow 9am')
ON CONFLICT (id) DO NOTHING;

-- ─── 4. SERVICES ──────────────────────────────────────────────────────────────
INSERT INTO public.services (creator_id, name, description, price, duration, inclusions, revisions, delivery_days, sort_order) VALUES
  -- Ananya — Photography
  ('00000000-0000-0000-0001-000000000001','Starter','Portrait or engagement session',22400,'2 hrs',ARRAY['40 edited photos','Online gallery','Print-ready files'],1,7,0),
  ('00000000-0000-0000-0001-000000000001','Standard','Full-day wedding coverage',56000,'8 hrs',ARRAY['400+ edited photos','2 shooters','Drone shots','Online gallery'],2,14,1),
  ('00000000-0000-0000-0001-000000000001','Premium','Destination wedding package',150000,'2 days',ARRAY['Unlimited photos','Cinematic highlight reel','Album design','Drone coverage'],3,21,2),
  -- Kabir — Videography
  ('00000000-0000-0000-0001-000000000002','Starter','Reels & shorts package',12000,'4 hrs',ARRAY['2 edited reels','Colour grade','Music sync'],1,5,0),
  ('00000000-0000-0000-0001-000000000002','Standard','Brand or wedding film',35000,'1 day',ARRAY['3–5 min film','Behind-the-scenes','3 social cuts'],2,10,1),
  ('00000000-0000-0000-0001-000000000002','Premium','Full wedding cinema',80000,'2 days',ARRAY['Feature film','Teaser','Drone','Raw footage','4K delivery'],3,21,2),
  -- Meher — UI/UX
  ('00000000-0000-0000-0001-000000000003','Starter','Landing page design',14400,'1 week',ARRAY['Hi-fi mockup','Mobile responsive','Figma handoff'],1,7,0),
  ('00000000-0000-0000-0001-000000000003','Standard','Mobile app design',40000,'3 weeks',ARRAY['User flows','Wireframes','Hi-fi screens','Interactive prototype'],2,21,1),
  ('00000000-0000-0000-0001-000000000003','Premium','Design system',90000,'6 weeks',ARRAY['Full design system','Component library','Documentation','Dev handoff'],3,42,2),
  -- Aarav — Tattoo
  ('00000000-0000-0000-0001-000000000004','Starter','Small fine-line piece',9000,'2 hrs',ARRAY['Custom design consult','Stencil','Free touch-up'],1,1,0),
  ('00000000-0000-0000-0001-000000000004','Standard','Medium custom piece',18000,'4 hrs',ARRAY['Custom design consult','Stencil','Free touch-up','Aftercare kit'],1,1,1),
  ('00000000-0000-0000-0001-000000000004','Premium','Large custom / sleeve session',40000,'Full day',ARRAY['Custom design','Multiple sittings','Aftercare kit','Numbing cream'],2,7,2),
  -- Ishita — Writing
  ('00000000-0000-0000-0001-000000000005','Starter','Brand copy pack',11200,'1 week',ARRAY['Homepage copy','About page','Tagline set','2 revision rounds'],2,7,0),
  ('00000000-0000-0000-0001-000000000005','Standard','Content strategy + copy',28000,'2 weeks',ARRAY['Content calendar','5 long-form pieces','Social captions','SEO brief'],2,14,1),
  ('00000000-0000-0000-0001-000000000005','Premium','Full brand voice guide + copy',60000,'4 weeks',ARRAY['Tone of voice doc','Website copy','Email sequences','Ad scripts','Bilingual EN/HI'],3,28,2),
  -- Vikram — Music
  ('00000000-0000-0000-0001-000000000006','Starter','Mixing & mastering',8000,'3 days',ARRAY['Stereo mix','Master for streaming','2 revision rounds'],2,3,0),
  ('00000000-0000-0000-0001-000000000006','Standard','Song production',22000,'1 week',ARRAY['Full production','Mixing','Mastering','Stems delivery'],2,7,1),
  ('00000000-0000-0000-0001-000000000006','Premium','EP production (3 tracks)',55000,'3 weeks',ARRAY['3 full productions','Mixing','Mastering','Stems','Commercial license'],3,21,2),
  -- Priya — Illustration
  ('00000000-0000-0000-0001-000000000007','Starter','Single editorial illustration',6000,'4 days',ARRAY['1 final illustration','Print-ready files','Commercial license'],1,4,0),
  ('00000000-0000-0000-0001-000000000007','Standard','Illustration series (3 pieces)',15000,'2 weeks',ARRAY['3 illustrations','Consistent style','Print + web files'],2,14,1),
  ('00000000-0000-0000-0001-000000000007','Premium','Brand illustration package',35000,'4 weeks',ARRAY['Custom illustration language','5+ scenes','Brand style guide','All formats'],3,28,2),
  -- Rohan — Graphic Design
  ('00000000-0000-0000-0001-000000000008','Starter','Logo & wordmark',10800,'1 week',ARRAY['3 concepts','Final AI/PDF/SVG files','Basic brand guide'],2,7,0),
  ('00000000-0000-0000-0001-000000000008','Standard','Full brand identity',28000,'3 weeks',ARRAY['Logo system','Typography','Colour palette','Stationery','Social kit'],2,21,1),
  ('00000000-0000-0000-0001-000000000008','Premium','Brand + packaging system',60000,'5 weeks',ARRAY['Complete identity','Packaging dielines','Label design','Brand guidelines doc'],3,35,2),
  -- Saniya — Photography
  ('00000000-0000-0000-0001-000000000009','Starter','Product photography (10 items)',22400,'4 hrs',ARRAY['10 hero shots','White background','Lifestyle cuts','High-res delivery'],1,5,0),
  ('00000000-0000-0000-0001-000000000009','Standard','E-commerce shoot (25 items)',50000,'Full day',ARRAY['25 products × 3 angles','Retouching','Lifestyle shots','Usage rights'],2,10,1),
  ('00000000-0000-0000-0001-000000000009','Premium','Fashion editorial',90000,'2 days',ARRAY['Full editorial','Concept + styling','Model coordination','Unlimited shots'],2,14,2),
  -- Arjun — Editing
  ('00000000-0000-0000-0001-000000000010','Starter','2 reels / shorts edit',4000,'2 days',ARRAY['2 reels up to 60 sec','Colour grade','Music sync','Captions'],1,2,0),
  ('00000000-0000-0000-0001-000000000010','Standard','Music video edit',12000,'4 days',ARRAY['Full edit up to 5 min','Colour grade','VFX titles','Sound design'],2,4,1),
  ('00000000-0000-0000-0001-000000000010','Premium','Documentary / short film edit',30000,'2 weeks',ARRAY['Full edit','Multi-cam sync','Colour grade','Sound mix','Subtitles'],3,14,2),
  -- Nikita — Graphic Design
  ('00000000-0000-0000-0001-000000000011','Starter','Social media template pack',7200,'4 days',ARRAY['10 Canva / Figma templates','Brand colours','Editable files'],1,4,0),
  ('00000000-0000-0000-0001-000000000011','Standard','Packaging design',18000,'1 week',ARRAY['1 SKU packaging','Dieline','Print-ready PDF','Revisions'],2,7,1),
  ('00000000-0000-0000-0001-000000000011','Premium','Full FMCG pack (3 SKUs)',45000,'3 weeks',ARRAY['3 SKUs packaging','Brand consistency','Print + digital files','Vendor-ready'],3,21,2),
  -- Yash — Videography
  ('00000000-0000-0000-0001-000000000012','Starter','Single music video',27000,'1 day',ARRAY['3–4 min edit','Colour grade','Sound mix','1 cut'],1,10,0),
  ('00000000-0000-0000-0001-000000000012','Standard','Music video + BTS',55000,'2 days',ARRAY['Full video','Behind-the-scenes','Social cuts','4K delivery'],2,14,1),
  ('00000000-0000-0000-0001-000000000012','Premium','Documentary short',110000,'1 week shoot',ARRAY['20-30 min documentary','Full crew','Colour + sound','Festival DCP'],3,30,2),
  -- Devika — Dance
  ('00000000-0000-0000-0001-000000000013','Starter','Sangeet choreography (1 song)',22400,'2 sessions',ARRAY['Choreography','1 rehearsal','Stage formation guide'],1,14,0),
  ('00000000-0000-0000-0001-000000000013','Standard','Full sangeet production',55000,'4 sessions',ARRAY['3–4 songs','Group choreography','Costume guidance','Music editing'],2,21,1),
  ('00000000-0000-0000-0001-000000000013','Premium','Complete wedding dance package',100000,'8 sessions',ARRAY['All events','Solo + group','Stage blocking','Rehearsal venue','Music'],3,30,2),
  -- Akshay — Tattoo
  ('00000000-0000-0000-0001-000000000014','Starter','Small piece (palm-size)',4000,'2 hrs',ARRAY['Custom design','Stencil','Touch-up session'],1,1,0),
  ('00000000-0000-0000-0001-000000000014','Standard','Medium piece',10000,'4 hrs',ARRAY['Custom design','Stencil','Aftercare kit','Touch-up'],1,1,1),
  ('00000000-0000-0000-0001-000000000014','Premium','Large / full placement',25000,'Full day',ARRAY['Full-day session','Custom design','Numbing cream','Aftercare kit'],2,7,2),
  -- Riya — Writing
  ('00000000-0000-0000-0001-000000000015','Starter','Ad script pack (5 scripts)',4800,'3 days',ARRAY['5 Meta / YouTube scripts','Hook + CTA','2 revision rounds'],2,3,0),
  ('00000000-0000-0000-0001-000000000015','Standard','Landing page copywriting',12000,'1 week',ARRAY['Full landing page','Headline testing set','SEO optimised'],2,7,1),
  ('00000000-0000-0000-0001-000000000015','Premium','Full D2C copy suite',30000,'3 weeks',ARRAY['Landing page','Email sequence','Ad scripts','Product descriptions','Social captions'],3,21,2),
  -- Harsh — UI/UX
  ('00000000-0000-0000-0001-000000000016','Starter','Landing page design',21600,'1 week',ARRAY['Hi-fi Figma','Mobile responsive','CRO-optimised layout'],1,7,0),
  ('00000000-0000-0000-0001-000000000016','Standard','Web app design',55000,'4 weeks',ARRAY['Full UX flow','Hi-fi screens','Interactive prototype','Dev handoff'],2,28,1),
  ('00000000-0000-0000-0001-000000000016','Premium','Product design sprint',100000,'6 weeks',ARRAY['User research','Full UX/UI','Design system','Usability testing','Handoff'],3,42,2),
  -- Tara — Photography
  ('00000000-0000-0000-0001-000000000017','Starter','Maternity session',22400,'2 hrs',ARRAY['30 edited photos','Online gallery','Print files'],1,10,0),
  ('00000000-0000-0000-0001-000000000017','Standard','Newborn session',35000,'3 hrs',ARRAY['50 edited photos','Props included','Online gallery','Print album'],2,14,1),
  ('00000000-0000-0000-0001-000000000017','Premium','Full family package',65000,'Half day',ARRAY['Maternity + newborn + family','80+ photos','Album design','Canvas print'],2,21,2),
  -- Zain — Music
  ('00000000-0000-0000-0001-000000000018','Starter','Jingle or sting composition',8000,'3 days',ARRAY['Up to 60 sec','3 variations','WAV + MP3 delivery'],2,3,0),
  ('00000000-0000-0000-0001-000000000018','Standard','Film / ad score',25000,'1 week',ARRAY['Full score up to 10 min','Stems','Sync-ready delivery'],2,7,1),
  ('00000000-0000-0000-0001-000000000018','Premium','Original song production',55000,'3 weeks',ARRAY['Full production','Vocals if needed','Mixing','Mastering','Commercial license'],3,21,2),
  -- Pooja — Illustration
  ('00000000-0000-0000-0001-000000000019','Starter','Single children''s illustration',6000,'4 days',ARRAY['1 full-colour illustration','Print-ready','Commercial license'],1,4,0),
  ('00000000-0000-0000-0001-000000000019','Standard','Picture book spread (6 pages)',22000,'3 weeks',ARRAY['6 full-colour spreads','Character consistency','Print files'],2,21,1),
  ('00000000-0000-0000-0001-000000000019','Premium','Full picture book (32 pages)',80000,'3 months',ARRAY['32 pages illustrated','Cover design','Print-ready + digital','Rights included'],3,90,2),
  -- Siddharth — Videography
  ('00000000-0000-0000-0001-000000000020','Starter','Wedding teaser',27000,'1 day',ARRAY['60–90 sec teaser','Colour grade','Music sync'],1,7,0),
  ('00000000-0000-0000-0001-000000000020','Standard','Full wedding film',65000,'2 days',ARRAY['5–7 min highlight film','Teaser','4K','Raw footage'],2,21,1),
  ('00000000-0000-0000-0001-000000000020','Premium','Destination wedding cinema',140000,'3 days',ARRAY['Feature film + teaser','Drone','Multiple cameras','Album-synced edit'],3,30,2)
ON CONFLICT DO NOTHING;

-- ─── 5. SAMPLE BOOKING ────────────────────────────────────────────────────────
INSERT INTO public.bookings
  (consumer_id, creator_id, status, session_date, session_time,
   location_type, occasion, base_price, travel_fee, platform_fee,
   total_price, advance_amount, balance_amount, advance_pct)
VALUES
  ('00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0001-000000000001',
   'confirmed', '2026-04-27', '13:00', 'studio', 'Pre-wedding',
   56000, 0, 2800, 58800, 17640, 41160, 30)
ON CONFLICT DO NOTHING;

-- ─── 6. SAMPLE CAMPAIGNS ─────────────────────────────────────────────────────
INSERT INTO public.campaigns
  (poster_id, kind, title, description, discipline, city,
   budget_min, budget_max, deadline, applicants_count, is_active)
VALUES
  ('00000000-0000-0000-0001-000000000002', 'brand',
   'Jewellery brand needs cinematic reels for Instagram',
   'Mumbai-based jewellery brand looking for a videographer to create 3 cinematic product reels. Aesthetic: soft luxury. Must have prior product reel experience.',
   'Videography', 'Mumbai', 35000, 60000, '2026-08-15', 4, TRUE),

  ('00000000-0000-0000-0001-000000000005', 'brand',
   'D2C skincare brand needs a bilingual copywriter',
   'Growing skincare startup looking for a copywriter to handle website, email, and ad copy in both English and Hindi.',
   'Writing', 'Delhi', 20000, 40000, '2026-08-01', 7, TRUE),

  ('00000000-0000-0000-0001-000000000009', 'creator',
   'Looking for brand deals — product photography',
   'Product photographer with 7 years exp and e-commerce portfolio seeking brand collab for beauty / lifestyle products.',
   'Photography', 'Mumbai', 15000, 50000, '2026-09-01', 2, TRUE)
ON CONFLICT DO NOTHING;

-- ─── 7. SAMPLE FAVORITES ─────────────────────────────────────────────────────
INSERT INTO public.favorites (consumer_id, creator_id) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000003'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000005')
ON CONFLICT DO NOTHING;

-- ─── 8. Re-enable trigger + refresh materialized view ─────────────────────────
ALTER TABLE public.creator_profiles ENABLE TRIGGER trg_refresh_creator_stats;
REFRESH MATERIALIZED VIEW public.creator_stats;
