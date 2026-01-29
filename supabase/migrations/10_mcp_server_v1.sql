-- =====================================================
-- FLOWMARK MCP SERVER SCHEMA v1.0
-- =====================================================
-- Reference: FlowMark MCP Server PRD v1.0
-- Scope: Full Database Reset & Setup
-- Features: Ownership, Permissions, Sharing (Private/Public)
-- =====================================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean Slate (DROP EVERYTHING)
-- WARNING: This deletes all data to ensure schema compliance
DROP TABLE IF EXISTS bookmark_shares CASCADE;
DROP TABLE IF EXISTS folder_shares CASCADE;
DROP TABLE IF EXISTS tag_shares CASCADE;
DROP TABLE IF EXISTS bookmark_tags CASCADE;
DROP TABLE IF EXISTS bookmarks CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS folders CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 3. Core Tables

-- PROFILES
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    preferences JSONB DEFAULT '{}'::jsonb
);

-- FOLDERS (Hierarchy supported via parent_id)
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TAGS
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
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
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BOOKMARK_TAGS
CREATE TABLE bookmark_tags (
    bookmark_id UUID REFERENCES bookmarks(id) ON DELETE CASCADE NOT NULL,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (bookmark_id, tag_id)
);

-- 4. Sharing Tables (New in v1.0)
-- "Private Sharing" is User-to-User (shared_with IS NOT NULL)
-- "Public Sharing" is Token-based (token IS NOT NULL)

-- BOOKMARK SHARES
CREATE TABLE bookmark_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID REFERENCES bookmarks(id) ON DELETE CASCADE NOT NULL,
    shared_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    shared_with UUID REFERENCES profiles(id) ON DELETE CASCADE, -- NULL if public link
    token TEXT UNIQUE, -- NULL if private user share
    permission_level TEXT CHECK (permission_level IN ('view', 'copy')) DEFAULT 'view',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_share CHECK (
        (shared_with IS NOT NULL AND token IS NULL) OR 
        (shared_with IS NULL AND token IS NOT NULL)
    )
);

-- FOLDER SHARES
CREATE TABLE folder_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID REFERENCES folders(id) ON DELETE CASCADE NOT NULL,
    shared_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    shared_with UUID REFERENCES profiles(id) ON DELETE CASCADE,
    token TEXT UNIQUE,
    permission_level TEXT CHECK (permission_level IN ('view', 'copy')) DEFAULT 'view',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_share CHECK (
        (shared_with IS NOT NULL AND token IS NULL) OR 
        (shared_with IS NULL AND token IS NOT NULL)
    )
);

-- TAG SHARES
CREATE TABLE tag_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
    shared_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    shared_with UUID REFERENCES profiles(id) ON DELETE CASCADE,
    token TEXT UNIQUE,
    permission_level TEXT CHECK (permission_level IN ('view', 'copy')) DEFAULT 'view',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_share CHECK (
        (shared_with IS NOT NULL AND token IS NULL) OR 
        (shared_with IS NULL AND token IS NOT NULL)
    )
);

-- 5. Row Level Security (RLS) policies

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmark_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmark_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_shares ENABLE ROW LEVEL SECURITY;

-- Helper to check if a resource is shared with the current user
-- Not used in policy definition to avoid recursion limits usually, but useful conceptual logic
-- We will embed the logic directly in policies.

-- === PROFILES ===
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- === FOLDERS ===
-- View: Owner OR Shared With User (Private) OR Publicly Visible (if is_public is TRUE, handled by app logic usually, but here we restrict to explicit shares)
CREATE POLICY "View folders: Owner or Shared" ON folders FOR SELECT 
USING (
    user_id = auth.uid() 
    OR 
    EXISTS (SELECT 1 FROM folder_shares WHERE resource_id = id AND shared_with = auth.uid())
);
CREATE POLICY "Manage folders: Owner only" ON folders FOR ALL 
USING (user_id = auth.uid());

-- === TAGS ===
CREATE POLICY "View tags: Owner or Shared" ON tags FOR SELECT 
USING (
    user_id = auth.uid() 
    OR 
    EXISTS (SELECT 1 FROM tag_shares WHERE resource_id = id AND shared_with = auth.uid())
);
CREATE POLICY "Manage tags: Owner only" ON tags FOR ALL 
USING (user_id = auth.uid());

-- === BOOKMARKS ===
CREATE POLICY "View bookmarks: Owner or Shared" ON bookmarks FOR SELECT 
USING (
    user_id = auth.uid() 
    OR 
    EXISTS (SELECT 1 FROM bookmark_shares WHERE resource_id = id AND shared_with = auth.uid())
);
CREATE POLICY "Manage bookmarks: Owner only" ON bookmarks FOR ALL 
USING (user_id = auth.uid());

-- === BOOKMARK_TAGS ===
-- Accessible if you can see the bookmark
CREATE POLICY "View bookmark_tags: If can see bookmark" ON bookmark_tags FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM bookmarks WHERE id = bookmark_tags.bookmark_id) 
);
CREATE POLICY "Manage bookmark_tags: Owner only" ON bookmark_tags FOR ALL 
USING (
    EXISTS (SELECT 1 FROM bookmarks WHERE id = bookmark_tags.bookmark_id AND user_id = auth.uid())
);

-- === SHARES (Managing the shares themselves) ===
-- Only the owner can create/delete shares
CREATE POLICY "Manage bookmark_shares: Owner only" ON bookmark_shares FOR ALL 
USING (shared_by = auth.uid());

CREATE POLICY "Manage folder_shares: Owner only" ON folder_shares FOR ALL 
USING (shared_by = auth.uid());

CREATE POLICY "Manage tag_shares: Owner only" ON tag_shares FOR ALL 
USING (shared_by = auth.uid());

-- View shares: The owner AND the recipient can see the share record
CREATE POLICY "View bookmark_shares" ON bookmark_shares FOR SELECT 
USING (shared_by = auth.uid() OR shared_with = auth.uid());

CREATE POLICY "View folder_shares" ON folder_shares FOR SELECT 
USING (shared_by = auth.uid() OR shared_with = auth.uid());

CREATE POLICY "View tag_shares" ON tag_shares FOR SELECT 
USING (shared_by = auth.uid() OR shared_with = auth.uid());


-- 6. RPC Functions for Public Access (Token-based)
-- RLS works for authenticated users. For public token access, we use SECURITY DEFINER functions.

-- Get Public Bookmark by Token
CREATE OR REPLACE FUNCTION get_shared_bookmark(token_input TEXT)
RETURNS TABLE (
    id UUID, url TEXT, title TEXT, description TEXT, created_at TIMESTAMPTZ, owner_email TEXT
) SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT b.id, b.url, b.title, b.description, b.created_at, p.email
    FROM bookmark_shares s
    JOIN bookmarks b ON s.resource_id = b.id
    JOIN profiles p ON b.user_id = p.id
    WHERE s.token = token_input
    AND (s.expires_at IS NULL OR s.expires_at > NOW());
END;
$$ LANGUAGE plpgsql;

-- 7. Triggers for Timestamps & New User
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON folders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookmarks_updated_at BEFORE UPDATE ON bookmarks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- v1.0 Schema Complete
