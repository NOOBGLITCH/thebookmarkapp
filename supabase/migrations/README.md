# Supabase SQL Migrations

This directory contains SQL migration scripts for the FlowMark bookmark application.

## Migration Files

### 01_complete_database_sync.sql ⭐ **RECOMMENDED**
**Purpose**: All-in-one database fix and sync script
- Fixes bookmark ownership for `easytest@example.com`
- Removes orphaned tags (tags with 0 bookmarks)
- Merges duplicate tags
- Cleans up duplicate bookmark_tags entries

**When to run**: 
- After initial setup
- When you see duplicate or orphaned tags
- When delete functionality isn't working

### 02_fix_ownership.sql
**Purpose**: Fix bookmark ownership only
- Reassigns all bookmarks to `easytest@example.com`

**When to run**: Only if you need to fix ownership issues

### 03_cleanup_duplicate_tags.sql
**Purpose**: Clean up tags only
- Removes orphaned and duplicate tags

**When to run**: Only if you need to clean up tags

## How to Use

1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)
2. Copy the contents of `01_complete_database_sync.sql`
3. Paste and run in the SQL Editor
4. Refresh your application

## Schema Files

- `supabase-schema-complete.sql` - Complete database schema (run once during setup)
- `supabase-migration-*.sql` - Additional migration files
