-- =====================================================
-- FLOWMARK MCP – Migration 3: Import, Export, Backup RPCs
-- =====================================================
-- import_bookmarks(payload), export_bookmarks(format, scope, scope_id), snapshot_bookmarks()
-- =====================================================

-- 1. Import bookmarks from parsed payload
-- Payload: { "bookmarks": [ { "url", "title", "description?", "folder_name?", "tag_names": [] } ], "options": { "dedupe_by_url": true } }
CREATE OR REPLACE FUNCTION import_bookmarks(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    uid UUID;
    opts JSONB;
    dedupe BOOLEAN;
    items JSONB;
    item JSONB;
    b_url TEXT;
    b_title TEXT;
    b_desc TEXT;
    b_folder TEXT;
    b_tags TEXT[];
    folder_id_val UUID;
    tag_ids UUID[];
    tag_name TEXT;
    b_id UUID;
    inserted INT := 0;
    skipped INT := 0;
    i INT;
BEGIN
    uid := auth.uid();
    IF uid IS NULL THEN
        RAISE EXCEPTION 'permission denied: not authenticated';
    END IF;

    opts := COALESCE(payload->'options', '{}'::jsonb);
    dedupe := COALESCE((opts->>'dedupe_by_url')::boolean, true);
    items := payload->'bookmarks';
    IF items IS NULL OR jsonb_array_length(items) = 0 THEN
        RETURN jsonb_build_object('inserted', 0, 'skipped', 0);
    END IF;

    FOR i IN 0..jsonb_array_length(items)-1 LOOP
        item := items->i;
        b_url := item->>'url';
        b_title := COALESCE(NULLIF(trim(item->>'title'), ''), b_url);
        b_desc := item->>'description';
        b_folder := item->>'folder_name';
        b_tags := ARRAY(SELECT jsonb_array_elements_text(COALESCE(item->'tag_names', '[]'::jsonb)));

        IF b_url IS NULL OR length(trim(b_url)) = 0 THEN
            skipped := skipped + 1;
            CONTINUE;
        END IF;

        -- Resolve folder (create if missing, root only for simplicity - max depth enforced by trigger)
        folder_id_val := NULL;
        IF b_folder IS NOT NULL AND length(trim(b_folder)) > 0 THEN
            SELECT id INTO folder_id_val FROM folders WHERE user_id = uid AND name = trim(b_folder) AND parent_id IS NULL LIMIT 1;
            IF folder_id_val IS NULL THEN
                INSERT INTO folders (user_id, name, parent_id) VALUES (uid, trim(b_folder), NULL) RETURNING id INTO folder_id_val;
            END IF;
        END IF;

        -- Dedupe: skip or update by URL
        IF dedupe THEN
            SELECT id INTO b_id FROM bookmarks WHERE user_id = uid AND url = b_url LIMIT 1;
            IF b_id IS NOT NULL THEN
                UPDATE bookmarks SET title = b_title, description = b_desc, folder_id = folder_id_val, updated_at = NOW() WHERE id = b_id;
                -- Sync tags for existing bookmark (merge mode: don't delete existing)
                FOREACH tag_name IN ARRAY b_tags LOOP
                    IF tag_name IS NOT NULL AND length(trim(tag_name)) > 0 THEN
                        INSERT INTO tags (user_id, name) VALUES (uid, trim(tag_name)) ON CONFLICT (user_id, name) DO NOTHING;
                        INSERT INTO bookmark_tags (bookmark_id, tag_id)
                        SELECT b_id, id FROM tags WHERE user_id = uid AND name = trim(tag_name) LIMIT 1
                        ON CONFLICT DO NOTHING;
                    END IF;
                END LOOP;
                skipped := skipped + 1;
                CONTINUE;
            END IF;
        END IF;

        -- Insert new bookmark
        INSERT INTO bookmarks (user_id, folder_id, url, title, description)
        VALUES (uid, folder_id_val, b_url, b_title, b_desc)
        RETURNING id INTO b_id;
        inserted := inserted + 1;

        -- Resolve and link tags
        FOREACH tag_name IN ARRAY b_tags LOOP
            IF tag_name IS NOT NULL AND length(trim(tag_name)) > 0 THEN
                INSERT INTO tags (user_id, name) VALUES (uid, trim(tag_name)) ON CONFLICT (user_id, name) DO NOTHING;
                INSERT INTO bookmark_tags (bookmark_id, tag_id)
                SELECT b_id, id FROM tags WHERE user_id = uid AND name = trim(tag_name) LIMIT 1
                ON CONFLICT DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;

    RETURN jsonb_build_object('inserted', inserted, 'skipped', skipped);
END;
$$;

-- 2. Export bookmarks: format in ('html','json','csv'), scope in ('full','folder','tag'), scope_id optional
-- Returns JSONB: { "content": "<string>", "mime_type": "text/html" | "application/json" | "text/csv" }
CREATE OR REPLACE FUNCTION export_bookmarks(
    format TEXT DEFAULT 'json',
    scope TEXT DEFAULT 'full',
    scope_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    uid UUID;
    out_content TEXT := '';
    mime TEXT;
    bk RECORD;
BEGIN
    uid := auth.uid();
    IF uid IS NULL THEN
        RAISE EXCEPTION 'permission denied: not authenticated';
    END IF;
    IF format NOT IN ('html', 'json', 'csv') THEN
        RAISE EXCEPTION 'format must be html, json, or csv';
    END IF;
    IF scope NOT IN ('full', 'folder', 'tag') THEN
        RAISE EXCEPTION 'scope must be full, folder, or tag';
    END IF;
    IF (scope IN ('folder', 'tag') AND scope_id IS NULL) THEN
        RAISE EXCEPTION 'scope_id required for folder or tag scope';
    END IF;

    IF format = 'json' THEN
        mime := 'application/json';
        IF scope = 'full' THEN
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', b.id, 'url', b.url, 'title', b.title, 'description', b.description,
                    'folder_id', b.folder_id, 'folder_name', f.name,
                    'tags', (SELECT jsonb_agg(t.name) FROM bookmark_tags bt JOIN tags t ON t.id = bt.tag_id WHERE bt.bookmark_id = b.id),
                    'created_at', b.created_at
                )
            ) INTO out_content
            FROM bookmarks b
            LEFT JOIN folders f ON f.id = b.folder_id AND f.user_id = uid
            WHERE b.user_id = uid;
        ELSIF scope = 'folder' THEN
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', b.id, 'url', b.url, 'title', b.title, 'description', b.description,
                    'tags', (SELECT jsonb_agg(t.name) FROM bookmark_tags bt JOIN tags t ON t.id = bt.tag_id WHERE bt.bookmark_id = b.id),
                    'created_at', b.created_at
                )
            ) INTO out_content
            FROM bookmarks b
            WHERE b.user_id = uid AND b.folder_id IN (SELECT id FROM folders WHERE id = scope_id OR parent_id = scope_id);
        ELSE
            -- scope = tag
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', b.id, 'url', b.url, 'title', b.title, 'description', b.description,
                    'created_at', b.created_at
                )
            ) INTO out_content
            FROM bookmarks b
            JOIN bookmark_tags bt ON bt.bookmark_id = b.id AND bt.tag_id = scope_id
            WHERE b.user_id = uid;
        END IF;
        out_content := COALESCE(out_content::text, '[]');
    ELSIF format = 'csv' THEN
        mime := 'text/csv';
        out_content := 'url,title,description,created_at' || E'\n';
        IF scope = 'full' THEN
            FOR bk IN SELECT b.url, b.title, b.description, b.created_at FROM bookmarks b WHERE b.user_id = uid
            LOOP
                out_content := out_content || '"' || replace(replace(COALESCE(bk.url,''), '"', '""'), E'\n', ' ') || '","' || replace(replace(COALESCE(bk.title,''), '"', '""'), E'\n', ' ') || '","' || replace(replace(COALESCE(bk.description,''), '"', '""'), E'\n', ' ') || '","' || bk.created_at || '"' || E'\n';
            END LOOP;
        ELSIF scope = 'folder' THEN
            FOR bk IN SELECT b.url, b.title, b.description, b.created_at FROM bookmarks b WHERE b.user_id = uid AND b.folder_id IN (SELECT id FROM folders WHERE id = scope_id OR parent_id = scope_id)
            LOOP
                out_content := out_content || '"' || replace(replace(COALESCE(bk.url,''), '"', '""'), E'\n', ' ') || '","' || replace(replace(COALESCE(bk.title,''), '"', '""'), E'\n', ' ') || '","' || replace(replace(COALESCE(bk.description,''), '"', '""'), E'\n', ' ') || '","' || bk.created_at || '"' || E'\n';
            END LOOP;
        ELSE
            FOR bk IN SELECT b.url, b.title, b.description, b.created_at FROM bookmarks b JOIN bookmark_tags bt ON bt.bookmark_id = b.id AND bt.tag_id = scope_id WHERE b.user_id = uid
            LOOP
                out_content := out_content || '"' || replace(replace(COALESCE(bk.url,''), '"', '""'), E'\n', ' ') || '","' || replace(replace(COALESCE(bk.title,''), '"', '""'), E'\n', ' ') || '","' || replace(replace(COALESCE(bk.description,''), '"', '""'), E'\n', ' ') || '","' || bk.created_at || '"' || E'\n';
            END LOOP;
        END IF;
    ELSE
        -- HTML (Netscape-style)
        mime := 'text/html';
        out_content := '<!DOCTYPE NETSCAPE-Bookmark-file-1><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><title>FlowMark Export</title><h1>Bookmarks</h1><dl><p><dt></dt><dd><dl><p>';
        IF scope = 'full' THEN
            FOR bk IN SELECT b.url, b.title, b.description FROM bookmarks b WHERE b.user_id = uid ORDER BY b.created_at DESC
            LOOP
                out_content := out_content || '<dt><a href="' || replace(bk.url, '&', '&amp;') || '">' || replace(replace(COALESCE(bk.title, bk.url), '&', '&amp;'), '<', '&lt;') || '</a></dt><dd>' || replace(replace(COALESCE(bk.description, ''), '&', '&amp;'), '<', '&lt;') || '</dd>';
            END LOOP;
        ELSIF scope = 'folder' THEN
            FOR bk IN SELECT b.url, b.title, b.description FROM bookmarks b WHERE b.user_id = uid AND b.folder_id IN (SELECT id FROM folders WHERE id = scope_id OR parent_id = scope_id) ORDER BY b.created_at DESC
            LOOP
                out_content := out_content || '<dt><a href="' || replace(bk.url, '&', '&amp;') || '">' || replace(replace(COALESCE(bk.title, bk.url), '&', '&amp;'), '<', '&lt;') || '</a></dt><dd>' || replace(replace(COALESCE(bk.description, ''), '&', '&amp;'), '<', '&lt;') || '</dd>';
            END LOOP;
        ELSE
            FOR bk IN SELECT b.url, b.title, b.description FROM bookmarks b JOIN bookmark_tags bt ON bt.bookmark_id = b.id AND bt.tag_id = scope_id WHERE b.user_id = uid ORDER BY b.created_at DESC
            LOOP
                out_content := out_content || '<dt><a href="' || replace(bk.url, '&', '&amp;') || '">' || replace(replace(COALESCE(bk.title, bk.url), '&', '&amp;'), '<', '&lt;') || '</a></dt><dd>' || replace(replace(COALESCE(bk.description, ''), '&', '&amp;'), '<', '&lt;') || '</dd>';
            END LOOP;
        END IF;
        out_content := out_content || '</p></dl></dd></p></dl>';
    END IF;

    RETURN jsonb_build_object('content', out_content, 'mime_type', mime);
END;
$$;

-- 3. Snapshot for backup (client stores; MCP does not store third-party credentials)
CREATE OR REPLACE FUNCTION snapshot_bookmarks()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    uid UUID;
    result JSONB;
BEGIN
    uid := auth.uid();
    IF uid IS NULL THEN
        RAISE EXCEPTION 'permission denied: not authenticated';
    END IF;

    SELECT jsonb_build_object(
        'snapshot_at', NOW(),
        'user_id', uid,
        'folders', (SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'parent_id', parent_id, 'created_at', created_at)), '[]') FROM folders WHERE user_id = uid),
        'tags', (SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'created_at', created_at)), '[]') FROM tags WHERE user_id = uid),
        'bookmarks', (SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'url', url, 'title', title, 'description', description, 'folder_id', folder_id, 'created_at', created_at)), '[]') FROM bookmarks WHERE user_id = uid),
        'bookmark_tags', (SELECT COALESCE(jsonb_agg(jsonb_build_object('bookmark_id', bt.bookmark_id, 'tag_id', bt.tag_id)), '[]') FROM bookmark_tags bt JOIN bookmarks b ON b.id = bt.bookmark_id WHERE b.user_id = uid),
        'bookmark_shares', (SELECT COALESCE(jsonb_agg(jsonb_build_object('resource_id', resource_id, 'token', token, 'expires_at', expires_at, 'permission_level', permission_level)), '[]') FROM bookmark_shares WHERE shared_by = uid AND token IS NOT NULL),
        'folder_shares', (SELECT COALESCE(jsonb_agg(jsonb_build_object('resource_id', resource_id, 'token', token, 'expires_at', expires_at, 'permission_level', permission_level)), '[]') FROM folder_shares WHERE shared_by = uid AND token IS NOT NULL),
        'tag_shares', (SELECT COALESCE(jsonb_agg(jsonb_build_object('resource_id', resource_id, 'token', token, 'expires_at', expires_at, 'permission_level', permission_level)), '[]') FROM tag_shares WHERE shared_by = uid AND token IS NOT NULL)
    ) INTO result;
    RETURN result;
END;
$$;
