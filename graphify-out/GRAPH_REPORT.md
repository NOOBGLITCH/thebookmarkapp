# Graph Report - thebookmarkapp  (2026-05-28)

## Corpus Check
- 72 files · ~47,476 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 388 nodes · 508 edges · 26 communities (25 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4ae28841`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 25|Community 25]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 27 edges
2. `Telegram Content Formatter Bot 🤖` - 16 edges
3. `✅ Bot Finalized & Optimized` - 13 edges
4. `Deployment Guide - Serverless Telegram Bot` - 12 edges
5. `extractMetadata()` - 10 edges
6. `generate_tags()` - 10 edges
7. `webhook()` - 10 edges
8. `supabase` - 9 edges
9. `useBookmarks()` - 9 edges
10. `get_headers()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Login()` --calls--> `useAuth()`  [EXTRACTED]
  src/pages/Login.jsx → src/context/AuthContext.jsx
- `Dashboard()` --calls--> `useAuth()`  [EXTRACTED]
  src/pages/Dashboard.jsx → src/context/AuthContext.jsx
- `Signup()` --calls--> `useAuth()`  [EXTRACTED]
  src/pages/Signup.jsx → src/context/AuthContext.jsx
- `Settings()` --calls--> `useAuth()`  [EXTRACTED]
  src/pages/Settings.jsx → src/context/AuthContext.jsx
- `Landing()` --calls--> `useAuth()`  [EXTRACTED]
  src/pages/Landing.jsx → src/context/AuthContext.jsx

## Communities (26 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (24): AddBookmarkModal(), buildFolderTree(), getFlattenedFolderOptions(), buildFolderTree(), FolderManager(), ProtectedRoute(), RedirectIfAuthenticated(), SearchBar() (+16 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (34): Bot Not Responding, code:bash (ngrok http 8000), code:bash (vercel logs --follow), code:bash (curl https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo), code:bash (git add .), code:bash (vercel --prod), code:bash (npm install -g netlify-cli), code:toml ([build]) (+26 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (30): format_error_message(), format_media_only_message(), format_response(), get_current_ist_time(), Response formatting utilities Optimized for Telegram Bot API HTML format, Format bot response with HTML     Telegram Bot API supports HTML formatting, Format error message using simple Markdown, Format message for media without caption (+22 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (31): Configuration module for serverless webhook Environment variables are provided d, Validate that all required configuration is present, validate_config(), format_media_only_message(), get_media_type(), process_bookmark_sync(), Telegram Instant Content Formatter Bot - Serverless Webhook Handler FastAPI-base, Health check endpoint (+23 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (32): 1. Get a Bot Token, 2. Deploy (Choose One), 3. Set Environment Variables, 4. Register Webhook, 5. Start Using!, 🙏 Acknowledgments, code:bash (npm install -g vercel), code:block2 (BOT_TOKEN=your_bot_token_here) (+24 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (26): 1. **Code Performance** ⚡, 2. **Dependencies Cleaned** 📦, 3. **Files Removed** 🗑️, 4. **Documentation Streamlined** 📝, After:, Before:, ✅ Bot Finalized & Optimized, code:block1 (mindvault/) (+18 more)

### Community 6 - "Community 6"
Cohesion: 0.12
Nodes (24): _detect_category(), _extract_scored_keywords(), _extract_url_path_keywords(), generate_tags(), _get_domain_tags(), _get_media_tag(), _normalize_tag(), Advanced tag generation with intelligent keyword extraction Uses NLP-inspired te (+16 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (17): create_bookmark_share(resource_id, expires_at?, permission_level?), create_folder_share(resource_id, expires_at?, permission_level?), create_tag_share(resource_id, expires_at?, permission_level?), export_bookmarks(format TEXT, scope TEXT, scope_id UUID?), FlowMark Supabase MCP – API Reference, get_shared_bookmark(token_input TEXT), get_shared_folder(token_input TEXT), get_shared_tag(token_input TEXT) (+9 more)

### Community 8 - "Community 8"
Cohesion: 0.26
Nodes (13): DOMAIN_TAG_MAP, extractDomain(), extractDomainTags(), extractKeywordsFromText(), extractMetadata(), extractPathKeywords(), fetchURLContent(), fetchYouTubeMetadata() (+5 more)

### Community 9 - "Community 9"
Cohesion: 0.14
Nodes (13): 1. List projects and push (CLI), 2. Supabase MCP in Cursor, 3. New project: create then push, code:block1 (sbp_6a8d0e6c005d8fe8dca70a77fe3a37334bb83c78), code:bash (npm install -g supabase), code:bash (export SUPABASE_ACCESS_TOKEN="sbp_6a8d0e6c005d8fe8dca70a77fe), code:bash (cd "/home/edith/Downloads/images/the bookmark app"), code:bash (cd "/home/edith/Downloads/images/the bookmark app") (+5 more)

### Community 10 - "Community 10"
Cohesion: 0.17
Nodes (11): 1. Create a new Supabase project, 2. Get project URL and anon key, 3. Run migrations in order (SQL Editor), 4. (Optional) Use Supabase CLI to push, 5. Frontend env and run, 6. Quick check, code:bash (supabase link --project-ref YOUR_PROJECT_REF), code:bash (supabase db push) (+3 more)

### Community 11 - "Community 11"
Cohesion: 0.17
Nodes (11): code:bash (git clone https://github.com/NOOBGLITCH/thebookmarkapp.git), code:bash (npm install), code:env (VITE_SUPABASE_URL=https://your-project.supabase.co), code:bash (npm run dev), 🚀 Deployment, 🚀 Features, 📦 Getting Started, Installation (+3 more)

### Community 12 - "Community 12"
Cohesion: 0.18
Nodes (10): CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables (+2 more)

### Community 13 - "Community 13"
Cohesion: 0.18
Nodes (10): code:bash (cp .env.example .env), code:env (API_ID=964098), code:bash (python3 -m venv venv), code:bash (docker-compose up -d), Get Bot Running in 3 Steps, Quick Start Guide, Step 1: Get Credentials, Step 2: Configure (+2 more)

### Community 14 - "Community 14"
Cohesion: 0.22
Nodes (8): Auth (Supabase Auth, not in SQL folder), Category summary, Full directory: `supabase/migrations/`, How SQL links to frontend and backend, RPCs → Frontend usage, Run order (for new project or full reset), Supabase SQL folder – full directory and categories, Tables → Frontend/backend usage

### Community 15 - "Community 15"
Cohesion: 0.38
Nodes (6): get_webhook_info(), main(), Script to set webhook URL for Telegram bot Run this after deploying to Vercel, Set webhook URL for Telegram bot          Args:         bot_token: Telegram bot, Get current webhook info, set_webhook()

### Community 16 - "Community 16"
Cohesion: 0.4
Nodes (4): code:bash (# From the project root), Graphify Output, How to generate the graph, Updating the graph

### Community 17 - "Community 17"
Cohesion: 0.5
Nodes (3): Directory: `supabase/migrations/`, Run order (new project), Supabase migrations – full directory and run order

### Community 18 - "Community 18"
Cohesion: 0.5
Nodes (3): If you still get "Failed to fetch" on sign up, Steps, Turn off email verification (confirm email)

### Community 25 - "Community 25"
Cohesion: 0.2
Nodes (10): code:bash (npm install -g vercel), code:bash (cd /path/to/your/project), code:bash (vercel env add BOT_TOKEN), code:bash (cd scripts), Manual Deployment Steps, Step 1: Install Vercel CLI, Step 2: Deploy to Vercel, Step 3: Set Environment Variables (+2 more)

## Knowledge Gaps
- **183 isolated node(s):** `Json`, `Database`, `DatabaseWithoutInternals`, `DefaultSchema`, `Tables` (+178 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Deployment Guide - Serverless Telegram Bot` connect `Community 1` to `Community 25`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `Json`, `Database`, `DatabaseWithoutInternals` to the rest of the system?**
  _183 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._