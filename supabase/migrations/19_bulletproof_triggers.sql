-- =====================================================
-- FLOWMARK MCP – Migration 19: Bulletproof Triggers & Performance Indexes
-- =====================================================
-- Refines folder depth limits to prevent grandchild hierarchy loops,
-- automates tag cleanup using AFTER DELETE trigger on bookmarks,
-- and adds performance indexes to speed up tag filtering and folder rendering.
-- =====================================================

-- 1. Refined Folder Depth Limit Trigger
-- Ensures only root folders can have subfolders, and subfolders cannot be turned into parent folders.
CREATE OR REPLACE FUNCTION check_folder_depth()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Parent must exist and be a root folder (i.e. parent's parent_id must be NULL)
    IF EXISTS (
        SELECT 1 FROM folders 
        WHERE id = NEW.parent_id 
          AND parent_id IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Folder hierarchy limited to 2 levels: only root folders can have subfolders';
    END IF;

    -- The folder being moved/updated must not have subfolders (otherwise they would become 3rd-level grandchildren)
    IF TG_OP = 'UPDATE' AND EXISTS (
        SELECT 1 FROM folders 
        WHERE parent_id = OLD.id
    ) THEN
        RAISE EXCEPTION 'Folder hierarchy limited to 2 levels: cannot nest folders that already contain subfolders';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_folder_depth ON folders;
CREATE TRIGGER enforce_folder_depth
    BEFORE INSERT OR UPDATE ON folders
    FOR EACH ROW
    EXECUTE FUNCTION check_folder_depth();


-- 2. Automatic Orphaned Tag Cleanup Trigger
-- Automatically prunes tags that belong to the user and are no longer linked to any bookmark.
CREATE OR REPLACE FUNCTION cleanup_orphaned_tags_after_bookmark_delete()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM tags
    WHERE user_id = OLD.user_id
      AND NOT EXISTS (
        SELECT 1 FROM bookmark_tags WHERE tag_id = tags.id
      );
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_cleanup_orphaned_tags ON bookmarks;
CREATE TRIGGER trigger_cleanup_orphaned_tags
    AFTER DELETE ON bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_orphaned_tags_after_bookmark_delete();


-- 3. Production Database Performance Indexes
-- Substantially speeds up folder hierarchy queries, tag relations, and de-duplication checks.
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_folder ON bookmarks(user_id, folder_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_url ON bookmarks(user_id, url);
CREATE INDEX IF NOT EXISTS idx_folders_user_parent ON folders(user_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_bookmark_tags_tag_id ON bookmark_tags(tag_id);
