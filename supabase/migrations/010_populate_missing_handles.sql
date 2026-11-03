-- ─── 010_populate_missing_handles.sql ─────────────────────────────────────────
-- Auto-assign unique handles (e.g. name-based slug or handle_1, handle_2...)
-- to any existing profiles that are missing a handle or have invalid formats.

DO $$
DECLARE
    r RECORD;
    new_h TEXT;
    counter INT := 1;
BEGIN
    -- 1. Populate handles for creator_profiles that have empty/missing/invalid handles
    FOR r IN 
        SELECT cp.id, u.name 
        FROM public.creator_profiles cp
        LEFT JOIN public.users u ON u.id = cp.id
        WHERE cp.handle IS NULL 
           OR TRIM(cp.handle) = '' 
           OR cp.handle !~ '^[a-z0-9._]+$'
        ORDER BY cp.created_at ASC
    LOOP
        -- Try generating from user name first
        IF r.name IS NOT NULL AND TRIM(r.name) <> '' THEN
            new_h := LOWER(REGEXP_REPLACE(TRIM(r.name), '[^a-zA-Z0-9]+', '_', 'g'));
            new_h := TRIM(BOTH '_' FROM new_h);
        ELSE
            new_h := 'handle_' || counter;
        END IF;

        -- Ensure minimum length of 3 characters
        IF LENGTH(new_h) < 3 THEN
            new_h := 'handle_' || counter;
        END IF;

        -- Ensure uniqueness across all existing handles
        WHILE EXISTS (SELECT 1 FROM public.creator_profiles WHERE handle = new_h AND id <> r.id) LOOP
            new_h := 'handle_' || counter;
            counter := counter + 1;
        END LOOP;

        UPDATE public.creator_profiles 
        SET handle = new_h 
        WHERE id = r.id;

        RAISE NOTICE 'Assigned handle "%" to creator % (name: %)', new_h, r.id, r.name;
        counter := counter + 1;
    END LOOP;

    -- 2. If any users have role 'creator' but no creator_profiles row, create one
    FOR r IN 
        SELECT u.id, u.name, u.city 
        FROM public.users u
        LEFT JOIN public.creator_profiles cp ON cp.id = u.id
        WHERE u.role IN ('creator', 'both') 
          AND cp.id IS NULL
        ORDER BY u.created_at ASC
    LOOP
        IF r.name IS NOT NULL AND TRIM(r.name) <> '' THEN
            new_h := LOWER(REGEXP_REPLACE(TRIM(r.name), '[^a-zA-Z0-9]+', '_', 'g'));
            new_h := TRIM(BOTH '_' FROM new_h);
        ELSE
            new_h := 'handle_' || counter;
        END IF;

        IF LENGTH(new_h) < 3 THEN
            new_h := 'handle_' || counter;
        END IF;

        WHILE EXISTS (SELECT 1 FROM public.creator_profiles WHERE handle = new_h) LOOP
            new_h := 'handle_' || counter;
            counter := counter + 1;
        END LOOP;

        INSERT INTO public.creator_profiles (id, handle, discipline, city, is_published)
        VALUES (r.id, new_h, 'Photography', COALESCE(r.city, 'Delhi'), TRUE);

        RAISE NOTICE 'Created missing creator_profiles row for user % with handle "%"', r.id, new_h;
        counter := counter + 1;
    END LOOP;
END $$;

