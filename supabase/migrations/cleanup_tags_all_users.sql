-- ============================================
-- UNIVERSAL TAG CLEANUP SCRIPT
-- ============================================
-- This script works for ALL USERS automatically
-- Removes orphaned tags and merges duplicates
-- Run this in Supabase SQL Editor anytime
-- ============================================

-- Step 1: Delete orphaned tags (tags with no bookmarks)
DELETE FROM public.tags
WHERE id NOT IN (
    SELECT DISTINCT tag_id 
    FROM public.bookmark_tags
);

-- Step 2: Merge duplicate tags (same name, same user)
-- Keep the oldest tag, update all bookmark_tags to point to it
WITH duplicates AS (
    SELECT 
        user_id,
        name,
        MIN(id::text)::uuid as keep_id,
        ARRAY_AGG(id) as all_ids
    FROM public.tags
    GROUP BY user_id, name
    HAVING COUNT(*) > 1
)
UPDATE public.bookmark_tags bt
SET tag_id = d.keep_id
FROM duplicates d
WHERE bt.tag_id = ANY(d.all_ids)
AND bt.tag_id != d.keep_id;

-- Step 3: Delete duplicate tag entries (keep oldest)
WITH duplicates AS (
    SELECT 
        user_id,
        name,
        MIN(id::text)::uuid as keep_id
    FROM public.tags
    GROUP BY user_id, name
    HAVING COUNT(*) > 1
)
DELETE FROM public.tags t
USING duplicates d
WHERE t.user_id = d.user_id
AND t.name = d.name
AND t.id != d.keep_id;

-- Done! All users' tags are now clean
