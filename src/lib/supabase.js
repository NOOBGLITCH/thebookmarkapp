import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ezikhcxhnjlehfqclthn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6aWtoY3hobmpsZWhmcWNsdGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDY2NzYsImV4cCI6MjA4NTI4MjY3Nn0.5NA-FL3fV7g25moPHLcZUDVmAdzmU2KsVD5pMvbSvrc'

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
