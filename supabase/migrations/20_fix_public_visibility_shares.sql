-- =====================================================
-- FLOWMARK MCP – Migration 20: Strict Visibility Sharing Rules
-- =====================================================
-- Enforces that private folders, tags, and bookmarks CANNOT be shared.
-- Automatically revokes any share tokens if a resource is made private.
-- =====================================================

-- 1. Redefine create_folder_share to block private shares
CREATE OR REPLACE FUNCTION create_folder_share(
    resource_id UUID,
    expires_at TIMESTAMPTZ DEFAULT NULL,
    permission_level TEXT DEFAULT 'view'
)
RETURNS TABLE (share_token TEXT, share_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    new_token TEXT;
    new_id UUID;
    v_visibility TEXT;
    v_is_public BOOLEAN;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'permission denied: not authenticated';
    END IF;
    IF permission_level NOT IN ('view', 'copy') THEN
        RAISE EXCEPTION 'permission_level must be view or copy';
    END IF;
    
    SELECT visibility, is_public INTO v_visibility, v_is_public
    FROM folders WHERE id = resource_id AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'permission denied: folder not found or not owned by you';
    END IF;
    
    IF v_visibility = 'private' AND v_is_public = false THEN
        RAISE EXCEPTION 'Cannot share a private folder. Please make it public first.';
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

-- 2. Redefine create_bookmark_share to block private shares
CREATE OR REPLACE FUNCTION create_bookmark_share(
    resource_id UUID,
    expires_at TIMESTAMPTZ DEFAULT NULL,
    permission_level TEXT DEFAULT 'view'
)
RETURNS TABLE (share_token TEXT, share_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    new_token TEXT;
    new_id UUID;
    v_visibility TEXT;
    v_is_public BOOLEAN;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'permission denied: not authenticated';
    END IF;
    IF permission_level NOT IN ('view', 'copy') THEN
        RAISE EXCEPTION 'permission_level must be view or copy';
    END IF;

    SELECT visibility, is_public INTO v_visibility, v_is_public
    FROM bookmarks WHERE id = resource_id AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'permission denied: bookmark not found or not owned by you';
    END IF;
    
    IF v_visibility = 'private' AND v_is_public = false THEN
        RAISE EXCEPTION 'Cannot share a private bookmark. Please make it public first.';
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

-- 3. Redefine create_tag_share to block private shares
CREATE OR REPLACE FUNCTION create_tag_share(
    resource_id UUID,
    expires_at TIMESTAMPTZ DEFAULT NULL,
    permission_level TEXT DEFAULT 'view'
)
RETURNS TABLE (share_token TEXT, share_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    new_token TEXT;
    new_id UUID;
    v_visibility TEXT;
    v_is_public BOOLEAN;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'permission denied: not authenticated';
    END IF;
    IF permission_level NOT IN ('view', 'copy') THEN
        RAISE EXCEPTION 'permission_level must be view or copy';
    END IF;

    SELECT visibility, is_public INTO v_visibility, v_is_public
    FROM tags WHERE id = resource_id AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'permission denied: tag not found or not owned by you';
    END IF;
    
    IF v_visibility = 'private' AND v_is_public = false THEN
        RAISE EXCEPTION 'Cannot share a private tag. Please make it public first.';
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

-- 4. Triggers to auto-revoke share tokens when a resource is made private
CREATE OR REPLACE FUNCTION revoke_shares_on_private()
RETURNS TRIGGER AS $$
BEGIN
    -- If visibility is changed to private or is_public changed to false
    IF (NEW.visibility = 'private' AND OLD.visibility != 'private') OR
       (NEW.is_public = false AND OLD.is_public = true) THEN
        
        IF TG_TABLE_NAME = 'folders' THEN
            DELETE FROM folder_shares WHERE resource_id = NEW.id;
        ELSIF TG_TABLE_NAME = 'bookmarks' THEN
            DELETE FROM bookmark_shares WHERE resource_id = NEW.id;
        ELSIF TG_TABLE_NAME = 'tags' THEN
            DELETE FROM tag_shares WHERE resource_id = NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_folder_made_private ON folders;
CREATE TRIGGER on_folder_made_private
    AFTER UPDATE ON folders
    FOR EACH ROW
    EXECUTE FUNCTION revoke_shares_on_private();

DROP TRIGGER IF EXISTS on_bookmark_made_private ON bookmarks;
CREATE TRIGGER on_bookmark_made_private
    AFTER UPDATE ON bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION revoke_shares_on_private();

DROP TRIGGER IF EXISTS on_tag_made_private ON tags;
CREATE TRIGGER on_tag_made_private
    AFTER UPDATE ON tags
    FOR EACH ROW
    EXECUTE FUNCTION revoke_shares_on_private();
