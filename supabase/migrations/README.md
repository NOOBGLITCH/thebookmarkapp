# Supabase migrations – full directory and run order

**Full index (categories, full names, frontend/backend links):** [../MIGRATIONS_INDEX.md](../MIGRATIONS_INDEX.md)  
**New Supabase project and push:** [../NEW_PROJECT_PUSH.md](../NEW_PROJECT_PUSH.md)

---

## Directory: `supabase/migrations/`

| Category | File | Full name |
|----------|------|-----------|
| Core schema | `00_init_full_database.sql` | Init full database (profiles, folders, tags, bookmarks, bookmark_tags, api_keys, RLS) |
| Core schema | `10_mcp_server_v1.sql` | MCP server core schema (all tables, shares, RLS, get_shared_bookmark) |
| Schema extensions | `11_schema_visibility_and_depth.sql` | Visibility column and folder max depth |
| RPCs sharing | `12_sharing_rpcs.sql` | create_*_share, get_shared_folder, get_shared_tag, revoke_*_share |
| RPCs import/export/backup | `13_import_export_backup_rpcs.sql` | import_bookmarks, export_bookmarks, snapshot_bookmarks |
| Maintenance | `cleanup_tags_all_users.sql` | Cleanup orphaned/duplicate tags |
| Maintenance | `reset_rls_policies.sql` | Reset RLS policies |

---

## Run order (new project)

In Supabase **SQL Editor**, run in this order:

1. **10_mcp_server_v1.sql**  
2. **11_schema_visibility_and_depth.sql**  
3. **12_sharing_rpcs.sql**  
4. **13_import_export_backup_rpcs.sql**  

Use **00_init_full_database.sql** only if you want the legacy init (no share tables); then run 11, 12, 13 after it (skip 10).

Maintenance scripts: run **cleanup_tags_all_users.sql** and **reset_rls_policies.sql** only when needed.

See [../MIGRATIONS_INDEX.md](../MIGRATIONS_INDEX.md) for how each file links to the frontend and backend.
