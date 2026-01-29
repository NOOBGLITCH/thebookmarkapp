# Supabase SQL folder – full directory and categories

Full list of SQL files, categorized, with run order and how they link to the frontend and backend.

---

## Full directory: `supabase/migrations/`

| Category | File name | Full descriptive name |
|----------|-----------|------------------------|
| **Core schema** | `00_init_full_database.sql` | Init full database (profiles, folders, tags, bookmarks, bookmark_tags, api_keys, RLS, triggers) |
| **Core schema** | `10_mcp_server_v1.sql` | MCP server core schema (profiles, folders, tags, bookmarks, bookmark_tags, bookmark_shares, folder_shares, tag_shares, RLS, get_shared_bookmark) |
| **Schema extensions** | `11_schema_visibility_and_depth.sql` | Schema visibility and folder depth (visibility column, folder max 2 levels) |
| **RPCs – sharing** | `12_sharing_rpcs.sql` | Sharing RPCs (create_bookmark_share, create_folder_share, create_tag_share, get_shared_folder, get_shared_tag, revoke_*_share) |
| **RPCs – import/export/backup** | `13_import_export_backup_rpcs.sql` | Import export backup RPCs (import_bookmarks, export_bookmarks, snapshot_bookmarks) |
| **Maintenance** | `cleanup_tags_all_users.sql` | Cleanup tags for all users (orphaned/duplicate tags) |
| **Maintenance** | `reset_rls_policies.sql` | Reset RLS policies |
| — | `README.md` | Migrations readme (run order, usage) |

---

## Run order (for new project or full reset)

Run in this order in the Supabase SQL Editor:

1. `00_init_full_database.sql` — **or** skip and use step 2 only for MCP-only setup  
2. `10_mcp_server_v1.sql`  
3. `11_schema_visibility_and_depth.sql`  
4. `12_sharing_rpcs.sql`  
5. `13_import_export_backup_rpcs.sql`  

Maintenance (only when needed):

- `cleanup_tags_all_users.sql`  
- `reset_rls_policies.sql`  

---

## How SQL links to frontend and backend

### Tables → Frontend/backend usage

| Table | Defined in SQL file(s) | Frontend / backend usage |
|-------|------------------------|---------------------------|
| **profiles** | `00_init_full_database.sql`, `10_mcp_server_v1.sql` | Auth: profile created by trigger; Settings: read email |
| **folders** | `00_init_full_database.sql`, `10_mcp_server_v1.sql`, `11_schema_visibility_and_depth.sql` | FolderManager: list, create, update visibility; AddBookmarkModal: list folders; Settings: list for export scope |
| **tags** | Same as folders | TagSidebar: list, create, update visibility, delete; AddBookmarkModal: resolve/create tags; Settings: list for export scope |
| **bookmarks** | Same | BookmarksView, FavoritesView: list, delete; AddBookmarkModal: insert, update |
| **bookmark_tags** | Same | AddBookmarkModal: link bookmarks to tags; BookmarksView, FavoritesView: delete junction on delete bookmark |
| **bookmark_shares** | `10_mcp_server_v1.sql` | BookmarksView: create_bookmark_share RPC; SharedView: get_shared_bookmark RPC |
| **folder_shares** | `10_mcp_server_v1.sql` | FolderManager: create_folder_share RPC; SharedView: get_shared_folder RPC |
| **tag_shares** | `10_mcp_server_v1.sql` | TagSidebar: create_tag_share RPC; SharedView: get_shared_tag RPC |

### RPCs → Frontend usage

| RPC | Defined in SQL file | Frontend usage |
|-----|---------------------|----------------|
| **get_shared_bookmark** | `10_mcp_server_v1.sql` | SharedView (route `/shared/bookmark/:token`) |
| **get_shared_folder** | `12_sharing_rpcs.sql` | SharedView (route `/shared/folder/:token`) |
| **get_shared_tag** | `12_sharing_rpcs.sql` | SharedView (route `/shared/tag/:token`) |
| **create_bookmark_share** | `12_sharing_rpcs.sql` | BookmarksView – “Copy public link” on bookmark card |
| **create_folder_share** | `12_sharing_rpcs.sql` | FolderManager – “Copy public link” in folder menu |
| **create_tag_share** | `12_sharing_rpcs.sql` | TagSidebar – “Copy public link” in tag menu |
| **revoke_bookmark_share**, **revoke_folder_share**, **revoke_tag_share** | `12_sharing_rpcs.sql` | Callable from Settings or share-management UI |
| **import_bookmarks** | `13_import_export_backup_rpcs.sql` | Settings – Import (HTML/JSON) |
| **export_bookmarks** | `13_import_export_backup_rpcs.sql` | Settings – Export (format + scope) |
| **snapshot_bookmarks** | `13_import_export_backup_rpcs.sql` | Settings – Backup download |

### Auth (Supabase Auth, not in SQL folder)

| Feature | Frontend / backend |
|---------|--------------------|
| **auth.getSession**, **onAuthStateChange** | AuthContext – session, login, signup, signOut |
| **auth.signInWithPassword**, **signUp**, **signOut** | Login, Signup, Settings |

---

## Category summary

- **Core schema**: `00_init_full_database.sql`, `10_mcp_server_v1.sql` – tables, RLS, one shared RPC.  
- **Schema extensions**: `11_schema_visibility_and_depth.sql` – visibility column, folder depth.  
- **RPCs – sharing**: `12_sharing_rpcs.sql` – create/revoke shares, get_shared_folder, get_shared_tag.  
- **RPCs – import/export/backup**: `13_import_export_backup_rpcs.sql` – import_bookmarks, export_bookmarks, snapshot_bookmarks.  
- **Maintenance**: `cleanup_tags_all_users.sql`, `reset_rls_policies.sql` – run only when needed.

For RPC contracts and visibility rules, see [MCP_API.md](MCP_API.md).  
For pushing to a new Supabase project, see [NEW_PROJECT_PUSH.md](NEW_PROJECT_PUSH.md).
