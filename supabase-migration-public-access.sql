-- Enable Public Access to Public Tags and their Bookmarks
-- Allow anyone to read tags that are public
CREATE POLICY "Anyone can view public tags" ON tags
    FOR SELECT USING (is_public = true);

-- Allow anyone to read bookmarks that belong to a public tag
-- This logic is a bit complex for simple RLS, but here's a standard approach:
-- Join bookmark_tags -> tags. If tag is public, allow access to bookmark_tag.
-- Then allow access to bookmark if it exists in a public bookmark_tag.

CREATE POLICY "Anyone can view public bookmark tags" ON bookmark_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tags 
            WHERE tags.id = bookmark_tags.tag_id 
            AND tags.is_public = true
        )
    );

CREATE POLICY "Anyone can view bookmarks in public tags" ON bookmarks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookmark_tags 
            JOIN tags ON tags.id = bookmark_tags.tag_id
            WHERE bookmark_tags.bookmark_id = bookmarks.id
            AND tags.is_public = true
        )
    );
