-- =====================================================
-- FLOWMARK MCP – Migration 2: Sharing RPCs
-- =====================================================
-- Token creation, get_shared_folder/tag, revoke RPCs.
-- Public access only via SECURITY DEFINER; no anon direct SELECT.
-- =====================================================

-- Enable pgcrypto for gen_random_bytes (if not already)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create bookmark share (public link). Returns token.
CREATE OR REPLACE FUNCTION create_bookmark_share(
    resource_id UUID,
    expires_at TIMESTAMPTZ DEFAULT NULL,
    permission_level TEXT DEFAULT 'view'
)
RETURNS TABLE (token TEXT, share_id UUID)
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

    token := new_token;
    share_id := new_id;
    RETURN NEXT;
END;
$$;

-- 2. Create folder share (public link). Returns token.
CREATE OR REPLACE FUNCTION create_folder_share(
    resource_id UUID,
    expires_at TIMESTAMPTZ DEFAULT NULL,
    permission_level TEXT DEFAULT 'view'
)
RETURNS TABLE (token TEXT, share_id UUID)
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

    token := new_token;
    share_id := new_id;
    RETURN NEXT;
END;
$$;

-- 3. Create tag share (public link). Returns token.
CREATE OR REPLACE FUNCTION create_tag_share(
    resource_id UUID,
    expires_at TIMESTAMPTZ DEFAULT NULL,
    permission_level TEXT DEFAULT 'view'
)
RETURNS TABLE (token TEXT, share_id UUID)
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

    token := new_token;
    share_id := new_id;
    RETURN NEXT;
END;
$$;

-- 4. Get shared folder by token (read-only, safe fields). Returns JSONB.
CREATE OR REPLACE FUNCTION get_shared_folder(token_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
    folder_id_val UUID;
    folder_name_val TEXT;
BEGIN
    SELECT f.id, f.name INTO folder_id_val, folder_name_val
    FROM folder_shares s
    JOIN folders f ON s.resource_id = f.id
    WHERE s.token = token_input
      AND (s.expires_at IS NULL OR s.expires_at > NOW());

    IF folder_id_val IS NULL THEN
        RAISE EXCEPTION 'invalid token or expired';
    END IF;

    SELECT jsonb_build_object(
        'folder', jsonb_build_object('id', folder_id_val, 'name', folder_name_val),
        'bookmarks', COALESCE(
            (SELECT jsonb_agg(jsonb_build_object(
                'id', b.id, 'url', b.url, 'title', b.title, 'description', b.description, 'created_at', b.created_at
            ) ORDER BY b.created_at DESC)
            FROM bookmarks b
            WHERE b.folder_id IN (
                SELECT id FROM folders 
                WHERE id = folder_id_val OR parent_id = folder_id_val
            )),
            '[]'::jsonb
        )
    ) INTO result;
    RETURN result;
END;
$$;

-- 5. Get shared tag by token (read-only, safe fields). Returns JSONB.
CREATE OR REPLACE FUNCTION get_shared_tag(token_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
    tag_id_val UUID;
    tag_name_val TEXT;
BEGIN
    SELECT t.id, t.name INTO tag_id_val, tag_name_val
    FROM tag_shares s
    JOIN tags t ON s.resource_id = t.id
    WHERE s.token = token_input
      AND (s.expires_at IS NULL OR s.expires_at > NOW());

    IF tag_id_val IS NULL THEN
        RAISE EXCEPTION 'invalid token or expired';
    END IF;

    SELECT jsonb_build_object(
        'tag', jsonb_build_object('id', tag_id_val, 'name', tag_name_val),
        'bookmarks', COALESCE(
            (SELECT jsonb_agg(jsonb_build_object(
                'id', b.id, 'url', b.url, 'title', b.title, 'description', b.description, 'created_at', b.created_at
            ) ORDER BY b.created_at DESC)
            FROM bookmarks b
            JOIN bookmark_tags bt ON bt.bookmark_id = b.id AND bt.tag_id = tag_id_val),
            '[]'::jsonb
        )
    ) INTO result;
    RETURN result;
END;
$$;

-- 6. Revoke share by token (owner only)
CREATE OR REPLACE FUNCTION revoke_bookmark_share(share_token TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'permission denied: not authenticated';
    END IF;
    DELETE FROM bookmark_shares WHERE token = share_token AND shared_by = auth.uid();
    IF NOT FOUND THEN
        RAISE EXCEPTION 'share not found or permission denied';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION revoke_folder_share(share_token TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'permission denied: not authenticated';
    END IF;
    DELETE FROM folder_shares WHERE token = share_token AND shared_by = auth.uid();
    IF NOT FOUND THEN
        RAISE EXCEPTION 'share not found or permission denied';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION revoke_tag_share(share_token TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'permission denied: not authenticated';
    END IF;
    DELETE FROM tag_shares WHERE token = share_token AND shared_by = auth.uid();
    IF NOT FOUND THEN
        RAISE EXCEPTION 'share not found or permission denied';
    END IF;
END;
$$;
