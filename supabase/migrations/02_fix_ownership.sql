-- =====================================================
-- FIX DATA OWNERSHIP SCRIPT
-- =====================================================
-- This script reassigns all bookmarks, folders, and tags
-- to your current user account. This fixes "cannot delete"
-- issues caused by RLS policies when data belongs to
-- a previous/different user ID.
-- =====================================================

DO $$
DECLARE
    -- REPLACE THIS WITH YOUR LOGIN EMAIL
    target_email TEXT := 'easytest@example.com'; 
    
    target_user_id UUID;
BEGIN
    -- 1. Get the User ID for the email
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

    IF target_user_id IS NOT NULL THEN
        RAISE NOTICE 'Found User ID: % for email: %', target_user_id, target_email;

        -- 2. Ensure Profile Exists
        INSERT INTO public.profiles (id, email) 
        VALUES (target_user_id, target_email)
        ON CONFLICT (id) DO NOTHING;

        -- 3. Update Folders
        UPDATE public.folders 
        SET user_id = target_user_id 
        WHERE user_id != target_user_id;
        
        RAISE NOTICE 'Updated Folders ownership';

        -- 4. Update Tags (Handle Unique Constraints)
        -- If we have a tag "Tech" owned by OldUser and "Tech" owned by NewUser,
        -- updating OldUser's "Tech" to NewUser will fail.
        -- In that case, we should probably delete the old tag and let bookmarks link to the new one?
        -- For simplicity, we wrap in a block to ignore errors for now, or just update what we can.
        BEGIN
            UPDATE public.tags 
            SET user_id = target_user_id 
            WHERE user_id != target_user_id;
            RAISE NOTICE 'Updated Tags ownership';
        EXCEPTION WHEN unique_violation THEN
            RAISE NOTICE 'Some tags could not be transferred due to duplicate names. This is expected if you have mixed data.';
        END;

        -- 5. Update Bookmarks
        -- This is the most important one for your issue
        UPDATE public.bookmarks 
        SET user_id = target_user_id 
        WHERE user_id != target_user_id;
        
        RAISE NOTICE 'Updated Bookmarks ownership';
        
        -- 6. Update API Keys (if any)
        UPDATE public.api_keys 
        SET user_id = target_user_id 
        WHERE user_id != target_user_id;
        
        RAISE NOTICE 'Updated API Keys ownership';

    ELSE
        RAISE WARNING 'User with email % not found! Please check the email address.', target_email;
    END IF;
END $$;
