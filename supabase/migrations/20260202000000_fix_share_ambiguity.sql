-- Fix ambiguity by renaming output parameter 'token' to 'share_token'

-- 1. Create bookmark share (public link)
DROP FUNCTION IF EXISTS create_bookmark_share(UUID, TIMESTAMPTZ, TEXT);

CREATE OR REPLACE FUNCTION create_bookmark_share(
    resource_id UUID,
    expires_at TIMESTAMPTZ DEFAULT NULL,
    permission_level TEXT DEFAULT 'view'
)
RETURNS TABLE (share_token TEXT, share_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_token TEXT;
    new_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'permission denied: not authenticated';
    END IF;
    IF permission_level NOT IN ('view', 'copy') THEN
        RAISE EXCEPTION 'permission_level must be view or copy';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM bookmarks WHERE id = resource_id AND user_id = auth.uid()) THEN
        RAISE EXCEPTION 'permission denied: bookmark not found or not owned by you';
    END IF;

    new_token := encode(gen_random_bytes(32), 'hex');
    INSERT INTO bookmark_shares (resource_id, shared_by, shared_with, token, permission_level, expires_at)
    VALUES (resource_id, auth.uid(), NULL, new_token, permission_level, expires_at)
    RETURNING id, token INTO new_id, new_token;

    share_token := new_token;
    share_id := new_id;
    RETURN NEXT;
END;
$$;

-- 2. Create folder share (public link)
DROP FUNCTION IF EXISTS create_folder_share(UUID, TIMESTAMPTZ, TEXT);

CREATE OR REPLACE FUNCTION create_folder_share(
    resource_id UUID,
    expires_at TIMESTAMPTZ DEFAULT NULL,
    permission_level TEXT DEFAULT 'view'
)
RETURNS TABLE (share_token TEXT, share_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_token TEXT;
    new_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'permission denied: not authenticated';
    END IF;
    IF permission_level NOT IN ('view', 'copy') THEN
        RAISE EXCEPTION 'permission_level must be view or copy';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM folders WHERE id = resource_id AND user_id = auth.uid()) THEN
        RAISE EXCEPTION 'permission denied: folder not found or not owned by you';
    END IF;

    new_token := encode(gen_random_bytes(32), 'hex');
    INSERT INTO folder_shares (resource_id, shared_by, shared_with, token, permission_level, expires_at)
    VALUES (resource_id, auth.uid(), NULL, new_token, permission_level, expires_at)
    RETURNING id, token INTO new_id, new_token;

    share_token := new_token;
    share_id := new_id;
    RETURN NEXT;
END;
$$;

-- 3. Create tag share (public link)
DROP FUNCTION IF EXISTS create_tag_share(UUID, TIMESTAMPTZ, TEXT);

CREATE OR REPLACE FUNCTION create_tag_share(
    resource_id UUID,
    expires_at TIMESTAMPTZ DEFAULT NULL,
    permission_level TEXT DEFAULT 'view'
)
RETURNS TABLE (share_token TEXT, share_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_token TEXT;
    new_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'permission denied: not authenticated';
    END IF;
    IF permission_level NOT IN ('view', 'copy') THEN
        RAISE EXCEPTION 'permission_level must be view or copy';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM tags WHERE id = resource_id AND user_id = auth.uid()) THEN
        RAISE EXCEPTION 'permission denied: tag not found or not owned by you';
    END IF;

    new_token := encode(gen_random_bytes(32), 'hex');
    INSERT INTO tag_shares (resource_id, shared_by, shared_with, token, permission_level, expires_at)
    VALUES (resource_id, auth.uid(), NULL, new_token, permission_level, expires_at)
    RETURNING id, token INTO new_id, new_token;

    share_token := new_token;
    share_id := new_id;
    RETURN NEXT;
END;
$$;
