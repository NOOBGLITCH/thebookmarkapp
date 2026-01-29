# Supabase access token and MCP – list project, push

Use your Supabase **access token** to list projects and push migrations (CLI or MCP).

---

## Your access token

Use this token only in a secure place (env var or Cursor MCP config). Do not commit it to git.

```
sbp_6a8d0e6c005d8fe8dca70a77fe3a37334bb83c78
```

---

## 1. List projects and push (CLI)

Install Supabase CLI if needed (one of):

```bash
npm install -g supabase
# or use npx (no install): npx supabase ...
```

**List projects** (uses token):

```bash
export SUPABASE_ACCESS_TOKEN="sbp_6a8d0e6c005d8fe8dca70a77fe3a37334bb83c78"
supabase projects list
```

**Link and push** (replace `YOUR_PROJECT_REF` with the ref from the list or from Dashboard → Settings → General → Reference ID):

```bash
cd "/home/edith/Downloads/images/the bookmark app"
export SUPABASE_ACCESS_TOKEN="sbp_6a8d0e6c005d8fe8dca70a77fe3a37334bb83c78"
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Or use the script (same token in env):

```bash
cd "/home/edith/Downloads/images/the bookmark app"
export SUPABASE_ACCESS_TOKEN="sbp_6a8d0e6c005d8fe8dca70a77fe3a37334bb83c78"
chmod +x supabase/push-with-token.sh
./supabase/push-with-token.sh                    # list only
./supabase/push-with-token.sh YOUR_PROJECT_REF   # link + push
```

---

## 2. Supabase MCP in Cursor

The **Supabase MCP** server in Cursor needs authentication. To use it (e.g. list project, push via MCP):

1. Open **Cursor Settings** → **MCP** (or **Features** → **MCP**).
2. Find the **Supabase** (user-supabase) server.
3. Add your **access token** in the server config (the field name may be `accessToken`, `token`, or similar – check the Supabase MCP docs).
4. Restart or enable the server so it can list projects and run actions.

After that, you can ask Cursor to “list Supabase projects” or “push migrations” and it can use the MCP tools with your token.

---

## 3. New project: create then push

1. **Create project**: [Supabase Dashboard](https://supabase.com/dashboard) → **New project**.
2. **Get project ref**: In the project → **Settings** → **General** → **Reference ID**.
3. **Push** (from app root, with token set):

   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   ```

4. **Frontend env**: In project **Settings** → **API**, copy **Project URL** and **anon public** key into `.env`:

   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_public_key
   ```

---

## Security

- Do **not** commit the access token or `.env` to git.
- Add `.env` to `.gitignore` (usually already there for Vite).
- Rotate the token in [Supabase Account → Access Tokens](https://supabase.com/dashboard/account/tokens) if it is ever exposed.
