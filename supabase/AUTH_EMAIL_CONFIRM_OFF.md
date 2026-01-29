# Turn off email verification (confirm email)

So users can sign in right after signup without confirming their email.

## Steps

1. Open your project: **[Supabase Dashboard](https://supabase.com/dashboard)** → select **flowmark** (or your project).
2. Go to **Authentication** → **Providers**.
3. Click **Email**.
4. Find **"Confirm email"** and **turn it OFF** (toggle off).
5. Save.

After this, new signups can sign in immediately without clicking a confirmation link.

---

## If you still get "Failed to fetch" on sign up

- **Check env**: In the app root, `.env` or `.env.local` must have:
  - `VITE_SUPABASE_URL=https://ezikhcxhnjlehfqclthn.supabase.co` (or your project URL)
  - `VITE_SUPABASE_ANON_KEY=<your anon key>`
  - Get the anon key: Dashboard → **Settings** → **API** → **Project API keys** → **anon public**.
- **Restart dev server**: After changing `.env`, run `npm run dev` again.
- **CORS**: In Dashboard → **Authentication** → **URL Configuration**, add your app URL (e.g. `http://localhost:5173`) to **Site URL** and **Redirect URLs** if you use redirects.
