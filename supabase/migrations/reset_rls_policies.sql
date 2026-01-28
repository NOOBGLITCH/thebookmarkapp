-- =====================================================
-- RESET RLS POLICIES SCRIPT
-- =====================================================
-- Run this if you are having permission issues (e.g. cannot delete)
-- It will DROP all existing policies and RE-CREATE them correctly
-- =====================================================

-- 1. Enable RLS on all tables (just in case)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmark_tags ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

DROP POLICY IF EXISTS "Users can view own folders" ON folders;
DROP POLICY IF EXISTS "Users can insert own folders" ON folders;
DROP POLICY IF EXISTS "Users can update own folders" ON folders;
DROP POLICY IF EXISTS "Users can delete own folders" ON folders;

DROP POLICY IF EXISTS "Users can view own tags" ON tags;
DROP POLICY IF EXISTS "Users can insert own tags" ON tags;
DROP POLICY IF EXISTS "Users can update own tags" ON tags;
DROP POLICY IF EXISTS "Users can delete own tags" ON tags;

DROP POLICY IF EXISTS "Users can view own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can insert own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can update own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON bookmarks;

DROP POLICY IF EXISTS "Users can view own bookmark tags" ON bookmark_tags;
DROP POLICY IF EXISTS "Users can insert own bookmark tags" ON bookmark_tags;
DROP POLICY IF EXISTS "Users can delete own bookmark tags" ON bookmark_tags;

-- 3. Re-create Policies (giving full access to own data)

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Folders
CREATE POLICY "Users can view own folders" ON folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own folders" ON folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own folders" ON folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own folders" ON folders FOR DELETE USING (auth.uid() = user_id);

-- Tags
CREATE POLICY "Users can view own tags" ON tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tags" ON tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tags" ON tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tags" ON tags FOR DELETE USING (auth.uid() = user_id);

-- Bookmarks
CREATE POLICY "Users can view own bookmarks" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bookmarks" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookmarks" ON bookmarks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookmarks" ON bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Bookmark Tags (Permissions based on ownership of the bookmark)
CREATE POLICY "Users can view own bookmark tags" ON bookmark_tags FOR SELECT
    USING (EXISTS (SELECT 1 FROM bookmarks WHERE bookmarks.id = bookmark_tags.bookmark_id AND bookmarks.user_id = auth.uid()));

CREATE POLICY "Users can insert own bookmark tags" ON bookmark_tags FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM bookmarks WHERE bookmarks.id = bookmark_tags.bookmark_id AND bookmarks.user_id = auth.uid()));

CREATE POLICY "Users can delete own bookmark tags" ON bookmark_tags FOR DELETE
    USING (EXISTS (SELECT 1 FROM bookmarks WHERE bookmarks.id = bookmark_tags.bookmark_id AND bookmarks.user_id = auth.uid()));

-- Done! Permissions are reset.
