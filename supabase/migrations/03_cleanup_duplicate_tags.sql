-- Clean up duplicate tags and orphaned tags
-- Run this in Supabase SQL Editor
-- FIXED: Uses created_at instead of MIN(id) to avoid UUID error

DO $$
DECLARE
    target_email TEXT := 'easytest@example.com';
    target_user_id UUID;
    deleted_orphans INT;
    deleted_dupes INT;
BEGIN
    -- Get user ID
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;
    
    IF target_user_id IS NULL THEN
        RAISE WARNING 'User % not found', target_email;
        RETURN;
    END IF;

    -- Step 1: Delete orphaned tags (tags with no bookmarks)
    DELETE FROM public.tags
    WHERE user_id = target_user_id
    AND id NOT IN (
        SELECT DISTINCT tag_id 
        FROM public.bookmark_tags
    );
    
    GET DIAGNOSTICS deleted_orphans = ROW_COUNT;
    RAISE NOTICE 'Deleted % orphaned tags', deleted_orphans;

    -- Step 2: Merge duplicate tags - update bookmark_tags to point to oldest tag
    WITH duplicates AS (
        SELECT 
            name, 
            (SELECT id FROM public.tags t2 
             WHERE t2.name = t1.name AND t2.user_id = target_user_id 
             ORDER BY created_at ASC LIMIT 1) as keep_id,
            ARRAY_AGG(id) as all_ids
        FROM public.tags t1
        WHERE user_id = target_user_id
        GROUP BY name
        HAVING COUNT(*) > 1
    )
    UPDATE public.bookmark_tags bt
    SET tag_id = d.keep_id
    FROM duplicates d
    WHERE bt.tag_id = ANY(d.all_ids)
    AND bt.tag_id != d.keep_id;

    -- Step 3: Delete duplicate tag entries (keep oldest)
    WITH duplicates AS (
        SELECT name, 
               (SELECT id FROM public.tags t2 
                WHERE t2.name = t1.name AND t2.user_id = target_user_id 
                ORDER BY created_at ASC LIMIT 1) as keep_id
        FROM public.tags t1
        WHERE user_id = target_user_id
        GROUP BY name
        HAVING COUNT(*) > 1
    )
    DELETE FROM public.tags t
    USING duplicates d
    WHERE t.user_id = target_user_id
    AND t.name = d.name
    AND t.id != d.keep_id;
    
    GET DIAGNOSTICS deleted_dupes = ROW_COUNT;
    RAISE NOTICE 'Deleted % duplicate tags', deleted_dupes;

    RAISE NOTICE 'Cleanup complete! Refresh your app to see changes.';
END $$;
