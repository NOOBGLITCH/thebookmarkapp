-- ============================================
-- COMPREHENSIVE DATABASE SYNC & CLEANUP SCRIPT
-- ============================================
-- This script fixes ALL database issues:
-- 1. Bookmark ownership
-- 2. Duplicate tags
-- 3. Orphaned tags (tags with no bookmarks)
-- 4. Ensures proper relationships
--
-- Run this in Supabase SQL Editor
-- ============================================

DO $$
DECLARE
    target_email TEXT := 'easytest@example.com';
    target_user_id UUID;
    fixed_ownership INT;
    deleted_orphans INT;
    deleted_dupes INT;
BEGIN
    -- ============================================
    -- STEP 1: Get user ID
    -- ============================================
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;
    
    IF target_user_id IS NULL THEN
        RAISE WARNING 'User % not found', target_email;
        RETURN;
    END IF;

    RAISE NOTICE '👤 Found user: % (ID: %)', target_email, target_user_id;

    -- ============================================
    -- STEP 2: Fix bookmark ownership
    -- ============================================
    UPDATE public.bookmarks
    SET user_id = target_user_id
    WHERE user_id != target_user_id OR user_id IS NULL;
    
    GET DIAGNOSTICS fixed_ownership = ROW_COUNT;
    RAISE NOTICE '✅ Fixed ownership for % bookmarks', fixed_ownership;

    -- ============================================
    -- STEP 3: Delete orphaned tags
    -- (tags with no associated bookmarks)
    -- ============================================
    DELETE FROM public.tags
    WHERE user_id = target_user_id
    AND id NOT IN (
        SELECT DISTINCT tag_id 
        FROM public.bookmark_tags
    );
    
    GET DIAGNOSTICS deleted_orphans = ROW_COUNT;
    RAISE NOTICE '🗑️ Deleted % orphaned tags', deleted_orphans;

    -- ============================================
    -- STEP 4: Merge duplicate tags
    -- (keep oldest tag, update bookmark_tags)
    -- ============================================
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

    -- ============================================
    -- STEP 5: Delete duplicate tag entries
    -- (keep oldest)
    -- ============================================
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
    RAISE NOTICE '🔄 Merged % duplicate tags', deleted_dupes;

    -- ============================================
    -- FINAL SUMMARY
    -- ============================================
    RAISE NOTICE '================================';
    RAISE NOTICE '✅ CLEANUP COMPLETE!';
    RAISE NOTICE '================================';
    RAISE NOTICE 'Fixed ownership: % bookmarks', fixed_ownership;
    RAISE NOTICE 'Removed orphaned tags: %', deleted_orphans;
    RAISE NOTICE 'Merged duplicate tags: %', deleted_dupes;
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Refresh your app to see changes!';
    RAISE NOTICE '================================';
END $$;

-- ============================================
-- VERIFICATION QUERIES
-- (Run these separately to check results)
-- ============================================

-- Check tag counts
-- SELECT 
--     t.name,
--     COUNT(bt.bookmark_id) as bookmark_count
-- FROM tags t
-- LEFT JOIN bookmark_tags bt ON t.id = bt.tag_id
-- WHERE t.user_id = (SELECT id FROM auth.users WHERE email = 'easytest@example.com')
-- GROUP BY t.id, t.name
-- ORDER BY bookmark_count DESC, t.name;

-- Check for duplicates
-- SELECT name, COUNT(*) as count
-- FROM tags
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'easytest@example.com')
-- GROUP BY name
-- HAVING COUNT(*) > 1;
