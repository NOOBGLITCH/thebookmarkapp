-- =====================================================
-- FLOWMARK MCP – Migration 1: Visibility + Folder Depth
-- =====================================================
-- Run after 10_mcp_server_v1.sql
-- Adds visibility column (private/shared/public), backfills from is_public,
-- enforces folder hierarchy max 2 levels. Keeps is_public for app compatibility.
-- =====================================================

-- 1. Add visibility column to folders, tags, bookmarks
ALTER TABLE folders
    ADD COLUMN IF NOT EXISTS visibility TEXT
        CHECK (visibility IN ('private', 'shared', 'public')) DEFAULT 'private';

ALTER TABLE tags
    ADD COLUMN IF NOT EXISTS visibility TEXT
        CHECK (visibility IN ('private', 'shared', 'public')) DEFAULT 'private';

ALTER TABLE bookmarks
    ADD COLUMN IF NOT EXISTS visibility TEXT
        CHECK (visibility IN ('private', 'shared', 'public')) DEFAULT 'private';

-- 2. Backfill visibility from is_public (true -> 'public', false -> 'private')
UPDATE folders SET visibility = CASE WHEN is_public THEN 'public' ELSE 'private' END;
UPDATE tags SET visibility = CASE WHEN is_public THEN 'public' ELSE 'private' END;
UPDATE bookmarks SET visibility = CASE WHEN is_public THEN 'public' ELSE 'private' END;

-- 3. Set default for new rows
ALTER TABLE folders ALTER COLUMN visibility SET DEFAULT 'private';
ALTER TABLE tags ALTER COLUMN visibility SET DEFAULT 'private';
ALTER TABLE bookmarks ALTER COLUMN visibility SET DEFAULT 'private';

-- 4. Folder hierarchy: max 2 levels (root = depth 0, children = depth 1 only)
-- A folder may have parent_id NULL (root) or parent_id pointing to a root folder.
CREATE OR REPLACE FUNCTION check_folder_depth()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Parent must exist and be root (parent_id IS NULL)
    IF EXISTS (SELECT 1 FROM folders WHERE id = NEW.parent_id AND parent_id IS NOT NULL) THEN
        RAISE EXCEPTION 'Folder hierarchy limited to 2 levels: only root folders can have children';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_folder_depth ON folders;
CREATE TRIGGER enforce_folder_depth
    BEFORE INSERT OR UPDATE ON folders
    FOR EACH ROW
    EXECUTE FUNCTION check_folder_depth();
