# FlowMark Supabase MCP – API Reference

This document describes the RPC contracts, visibility semantics, and security notes for the FlowMark Supabase MCP Server.

## Run order

1. `10_mcp_server_v1.sql` – Core schema (tables, RLS, `get_shared_bookmark`)
2. `11_schema_visibility_and_depth.sql` – Visibility column, folder depth
3. `12_sharing_rpcs.sql` – Token create/revoke, `get_shared_folder`, `get_shared_tag`
4. `13_import_export_backup_rpcs.sql` – Import, export, snapshot

---

## Visibility

- **Values**: `private`, `shared`, `public` (stored on `folders`, `tags`, `bookmarks`).
- **Semantics**:
  - **private**: Only the owner can see the resource (RLS).
  - **shared**: At least one user has been granted access via `*_shares` (user-based); RLS allows owner and `shared_with`.
  - **public**: Access via token-based share link; no anon direct SELECT on tables; use `get_shared_*` RPCs only.
- **Cascade**: Folder visibility applies to bookmarks in that folder for display; access is still enforced by RLS and share tokens.
- The app may keep `is_public` in sync with `visibility === 'public'` for backward compatibility; `visibility` is the source of truth.

---

## Sharing RPCs (authenticated)

All require `auth.uid()`.

### create_bookmark_share(resource_id, expires_at?, permission_level?)

- **Parameters**: `resource_id` UUID, `expires_at` TIMESTAMPTZ (optional), `permission_level` TEXT (`'view'` \| `'copy'`, default `'view'`).
- **Returns**: TABLE `(token TEXT, share_id UUID)` – one row with the new token and share id.
- **Errors**: `permission denied: not authenticated`, `permission denied: bookmark not found or not owned by you`, `permission_level must be view or copy`.

### create_folder_share(resource_id, expires_at?, permission_level?)

- Same shape as bookmark; validates folder ownership.
- **Returns**: `(token TEXT, share_id UUID)`.

### create_tag_share(resource_id, expires_at?, permission_level?)

- Same shape; validates tag ownership.
- **Returns**: `(token TEXT, share_id UUID)`.

### revoke_bookmark_share(share_token TEXT)

- **Parameters**: `share_token` – the token string (not share id).
- **Returns**: VOID.
- **Errors**: `permission denied: not authenticated`, `share not found or permission denied`.

### revoke_folder_share(share_token TEXT), revoke_tag_share(share_token TEXT)

- Same pattern as bookmark.

---

## Public read-only RPCs (anon allowed)

Called with a valid share token; no auth required. All are `SECURITY DEFINER` and validate token + expiry.

### get_shared_bookmark(token_input TEXT)

- **Returns**: TABLE `(id UUID, url TEXT, title TEXT, description TEXT, created_at TIMESTAMPTZ, owner_email TEXT)` – one row per bookmark (single bookmark for this RPC).
- **Errors**: Invalid/expired token returns no rows; client should treat as “invalid or expired link”.

### get_shared_folder(token_input TEXT)

- **Returns**: JSONB: `{ "folder": { "id", "name" }, "bookmarks": [ { "id", "url", "title", "description", "created_at" }, ... ] }`.
- **Errors**: Raises `invalid token or expired` if token missing or expired.

### get_shared_tag(token_input TEXT)

- **Returns**: JSONB: `{ "tag": { "id", "name" }, "bookmarks": [ { "id", "url", "title", "description", "created_at" }, ... ] }`.
- **Errors**: Same as folder.

---

## Import / Export / Backup (authenticated)

### import_bookmarks(payload JSONB)

- **Payload**: `{ "bookmarks": [ { "url", "title", "description?", "folder_name?", "tag_names": [] } ], "options": { "dedupe_by_url": true } }`.
- **Returns**: JSONB `{ "inserted": N, "skipped": M }`.
- **Errors**: `permission denied: not authenticated`.
- **Behavior**: Resolves/creates folders (root only, max depth enforced by trigger), resolves/creates tags, dedupes by URL when `dedupe_by_url` is true (update existing row and tags).

### export_bookmarks(format TEXT, scope TEXT, scope_id UUID?)

- **Parameters**: `format` in `('html','json','csv')`, `scope` in `('full','folder','tag')`, `scope_id` required when scope is folder or tag.
- **Returns**: JSONB `{ "content": "<string>", "mime_type": "text/html" | "application/json" | "text/csv" }`.
- **Errors**: `permission denied: not authenticated`, `format must be html, json, or csv`, `scope must be full, folder, or tag`, `scope_id required for folder or tag scope`.

### snapshot_bookmarks()

- **Returns**: JSONB blob with `snapshot_at`, `user_id`, `folders`, `tags`, `bookmarks`, `bookmark_tags`, `bookmark_shares`, `folder_shares`, `tag_shares` (token-based shares only; no third-party credentials).
- **Errors**: `permission denied: not authenticated`.
- **Note**: Client is responsible for storing the snapshot (local or cloud); MCP does not store backup credentials.

---

## Rate limiting

Supabase does not provide rate limiting. **Rate limiting on public access** (token-based `get_shared_*` RPCs) should be implemented at the edge, e.g.:

- Supabase Edge Function in front of the RPC, or
- API gateway / CDN rules.

This is left as a follow-up; the MCP API itself does not enforce rate limits.
