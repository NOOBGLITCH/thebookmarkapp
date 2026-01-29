-- =====================================================
-- FLOWMARK FULL DATABASE SETUP (v2.0)
-- =====================================================
-- Run this in your NEW Supabase project SQL Editor
-- This creates all tables and sets up permissions correctly
-- =====================================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables (Clean Slate - WARNING: DELETES DATA)
-- We do this to ensure no mismatched constraints or weird states
DROP TABLE IF EXISTS bookmark_tags CASCADE;
DROP TABLE IF EXISTS bookmarks CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS folders CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 3. Create Tables

-- PROFILES
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    preferences JSONB DEFAULT '{}'::jsonb
);

-- FOLDERS
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TAGS
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- BOOKMARKS
CREATE TABLE bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    screenshot_url TEXT,
    favicon_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BOOKMARK_TAGS (Junction Table)
CREATE TABLE bookmark_tags (
    bookmark_id UUID REFERENCES bookmarks(id) ON DELETE CASCADE NOT NULL,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (bookmark_id, tag_id)
);

-- API KEYS
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    service TEXT NOT NULL,
    encrypted_key TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, service)
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmark_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies (Allow full access to own data)

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Common Policy Helper (We just repeat the logic for clarity)
-- Validates that the rows belong to the authenticated user

-- Folders
CREATE POLICY "Users can all on own folders" ON folders FOR ALL USING (auth.uid() = user_id);

-- Tags
CREATE POLICY "Users can all on own tags" ON tags FOR ALL USING (auth.uid() = user_id);

-- Bookmarks
CREATE POLICY "Users can all on own bookmarks" ON bookmarks FOR ALL USING (auth.uid() = user_id);

-- Bookmark Tags
-- We allow access if the bookmark belongs to the user
CREATE POLICY "Users can all on own bookmark_tags" ON bookmark_tags FOR ALL 
USING (
    EXISTS (SELECT 1 FROM bookmarks WHERE bookmarks.id = bookmark_tags.bookmark_id AND bookmarks.user_id = auth.uid())
);

-- API Keys
CREATE POLICY "Users can all on own api_keys" ON api_keys FOR ALL USING (auth.uid() = user_id);

-- 6. Setup Auto-Profile Creation Trigger
-- Automatically creates a public.profile entry when a user signs up via Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Done!
