-- Function to delete a bookmark and clean up orphaned tags
CREATE OR REPLACE FUNCTION delete_bookmark_with_cleanup(p_bookmark_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get the user_id of the bookmark to ensure permission
    SELECT user_id INTO v_user_id FROM bookmarks WHERE id = p_bookmark_id;

    -- Check if the user owns the bookmark (or rely on RLS if not security definer, but better to check)
    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    -- Delete the bookmark. 
    -- ON DELETE CASCADE will discard rows in bookmark_tags automatically.
    DELETE FROM bookmarks WHERE id = p_bookmark_id;

    -- Delete tags that belong to this user AND have no entries in bookmark_tags
    DELETE FROM tags
    WHERE user_id = auth.uid()
      AND NOT EXISTS (
        SELECT 1 FROM bookmark_tags WHERE tag_id = tags.id
      );

END;
$$;
