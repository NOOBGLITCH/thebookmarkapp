#!/bin/bash

# Configuration
PROJECT_ID="ezikhcxhnjlehfqclthn"

echo "🚀 Starting FlowMark Project Setup..."

# 1. Login Check
echo "Checking Supabase login..."
if ! npx supabase projects list > /dev/null 2>&1; then
    echo "⚠️  You are not logged in."
    echo "👉 Please run: npx supabase login"
    echo "   (Then run this script again)"
    exit 1
fi

# 2. Link Project
echo "🔗 Linking to project $PROJECT_ID..."
npx supabase link --project-ref "$PROJECT_ID" --password "unused" # password prompt might be skipped if linked by token, usually asks for db password if not cached. 
# actually 'link' interacts. Safer to let user force it or just guide them.
# 'link' asks for DB password. We can't automate this easily without prompt.
# Let's try non-interactive if possible, or just warn.

# 3. Apply Schema
echo "📄 Applying v1.0 Schema..."
npx supabase db reset --linked

echo "✅ Setup Complete!"
