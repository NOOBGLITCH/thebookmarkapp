-- Backfill missing profiles for existing auth.users
-- This handles the case where the profiles table was dropped and recreated,
-- but existing users in auth.users were not re-inserted into the new profiles table.

INSERT INTO public.profiles (id, email)
SELECT id, COALESCE(email, id::text || '@placeholder.org')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
