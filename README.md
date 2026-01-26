# FlowMark - Smart Bookmark Manager

FlowMark is a modern, privacy-first bookmark manager that helps you organize your web links with intelligent tagging and metadata extraction.

## 🚀 Features

- **Smart Metadata Extraction**: Automatically fetches titles, descriptions, and high-quality tags from any URL.
- **Privacy-First**: No data is sent to external AI APIs. All processing happens via standard web protocols.
- **Auto-Tagging**: Uses rule-based logic and domain mapping to generate 5-7 relevant tags per bookmark.
- **Live Screenshots**: Automatic screenshot generation for every bookmark using WordPress mshots.
- **Real-Time Sync**: Instant updates across devices without page reloads.
- **Import/Export**: Easily migrate your bookmarks from Chrome, Firefox, or Edge.
- **Public Sharing**: Share curated collections of bookmarks via public links.
- **Folder Organization**: Nested folders for deep organization.
- **Responsive Design**: Beautiful UI that works on desktop and mobile.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, TailwindCSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Icons**: Heroicons
- **Metadata**: Custom extraction engine (No AI dependencies)

## ⚡ Performance

- **Fast Extraction**: Parallel proxy racing fetches metadata in 3-8 seconds.
- **Optimized Saving**: Batch operations allow saving bookmarks with multiple tags in <1 second.
- **Reliable**: Multiple CORS fallbacks ensure metadata is always extracted.

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/flowmark.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## 🔒 Privacy & Security

FlowMark is designed to be privacy-respecting. Unlike other smart bookmark managers that send your data to LLMs (Large Language Models), FlowMark uses deterministic rule-based systems to extract value from your bookmarks. Your data stays between you and your Supabase database.

## 📝 License

MIT License - feel free to use this for your own projects!
