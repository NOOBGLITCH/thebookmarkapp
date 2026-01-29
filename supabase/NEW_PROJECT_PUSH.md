# Create new Supabase project and push migrations

Steps to create a new Supabase project and apply all FlowMark SQL so the frontend and backend stay in sync.

---

## 1. Create a new Supabase project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard).  
2. Click **New project**.  
3. Set **Name**, **Database password**, **Region**.  
4. Click **Create new project** and wait until it is ready.

---

## 2. Get project URL and anon key

1. In the project, open **Settings** → **API**.  
2. Copy:
   - **Project URL** (e.g. `https://xxxxx.supabase.co`)  
   - **anon public** key (under “Project API keys”).

---

## 3. Run migrations in order (SQL Editor)

1. In the dashboard, open **SQL Editor**.  
2. Run each file from `supabase/migrations/` **in this order** (copy-paste contents, then Run):

   | Order | File | Purpose |
   |-------|------|--------|
   | 1 | `10_mcp_server_v1.sql` | Core MCP schema (tables, RLS, get_shared_bookmark) |
   | 2 | `11_schema_visibility_and_depth.sql` | Visibility column, folder depth |
   | 3 | `12_sharing_rpcs.sql` | Sharing create/revoke + get_shared_folder, get_shared_tag |
   | 4 | `13_import_export_backup_rpcs.sql` | import_bookmarks, export_bookmarks, snapshot_bookmarks |

   **If you prefer the legacy full init instead of MCP-only:**

   - Run `00_init_full_database.sql` first (full reset), then run **only** `11_schema_visibility_and_depth.sql`, `12_sharing_rpcs.sql`, `13_import_export_backup_rpcs.sql` (skip `10_mcp_server_v1.sql` because `00_init` does not include share tables; for full MCP stack use the order in the table above).

   Recommended: use the **four-file order** (10 → 11 → 12 → 13) for a clean MCP setup.

---

## 4. (Optional) Use Supabase CLI to push

If you use the Supabase CLI and want to “push” migrations from this repo:

1. Install CLI: `npm install -g supabase` (or see [Supabase CLI](https://supabase.com/docs/guides/cli)).  
2. Log in: `supabase login`.  
3. In your app root (e.g. `the bookmark app`), link the project:

   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

   Get **Project ref** from **Settings** → **General** → **Reference ID**.

4. Push migrations (applies only **new** migrations that haven’t been applied yet):

   ```bash
   supabase db push
   ```

   Or run all from scratch via **SQL Editor** as in step 3 if the project is empty.

---

## 5. Frontend env and run

1. In the app root, create or edit `.env` (or `.env.local`):

   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_public_key
   ```

2. Install and run the app, e.g.:

   ```bash
   npm install
   npm run dev
   ```

3. In Supabase: **Authentication** → **Providers** – enable **Email** (and optionally OAuth).  
4. Create a user (Sign up from the app or **Authentication** → **Users** → **Add user**).

---

## 6. Quick check

- Sign up / log in.  
- Create a folder, tag, and bookmark.  
- Use “Copy public link” on a tag → open `/shared/tag/<token>` in an incognito window.  
- Settings → Import (HTML), Export (JSON/HTML/CSV), Backup download.

If all of that works, the new project is set up and migrations are linked to the frontend/backend as in [MIGRATIONS_INDEX.md](MIGRATIONS_INDEX.md).
