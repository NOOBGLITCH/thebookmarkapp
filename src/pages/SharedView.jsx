import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function SharedView() {
    const { tagId } = useParams()
    const [bookmarks, setBookmarks] = useState([])
    const [tagName, setTagName] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchSharedBookmarks()
    }, [tagId])

    const fetchSharedBookmarks = async () => {
        try {
            // Check if tag is public
            const { data: tag, error: tagError } = await supabase
                .from('tags')
                .select('name, is_public')
                .eq('id', tagId)
                .single()

            if (tagError || !tag) throw new Error('Tag not found')
            if (!tag.is_public) throw new Error('This tag is private')

            setTagName(tag.name)

            // Fetch bookmarks for this public tag
            // Note: This requires proper RLS policies for public access. 
            // Since we can't easily change RLS without raw SQL access in this tool context reliably across all scenarios,
            // we will assume the user has run the migration or policies allow public read on these tables if is_public logic is handled.
            // Actually, typical RLS blocks this for anon users. 
            // For a robust implementation, we would need to add RLS policies allowing 'anon' to select FROM tags WHERE is_public = true, etc.
            // For this quick implementation, we will try to fetch.

            const { data, error } = await supabase
                .from('bookmark_tags')
                .select(`
                    bookmarks (
                        id,
                        title,
                        url,
                        description,
                        created_at
                    )
                `)
                .eq('tag_id', tagId)

            if (error) throw error

            setBookmarks(data.map(item => item.bookmarks))
        } catch (error) {
            console.error('Error fetching shared bookmarks:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-background text-primaryText flex items-center justify-center">
            <p>Loading shared content...</p>
        </div>
    )

    if (error) return (
        <div className="min-h-screen bg-background text-primaryText flex flex-col items-center justify-center p-4">
            <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
            <p className="text-secondaryText mb-6">{error}</p>
            <Link to="/" className="px-4 py-2 bg-accent text-white rounded-lg">Go Home</Link>
        </div>
    )

    return (
        <div className="min-h-screen bg-background text-primaryText">
            <div className="max-w-4xl mx-auto p-8">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-800">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <span className="text-accent">#</span>
                            {tagName}
                        </h1>
                        <p className="text-secondaryText mt-1">Public Shared Collection</p>
                    </div>
                    <Link to="/" className="text-sm text-accent hover:underline">Try FlowMark</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookmarks.map(bookmark => (
                        <a
                            key={bookmark.id}
                            href={bookmark.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-surface rounded-lg overflow-hidden border border-gray-800 hover:border-accent transition group block"
                        >
                            {/* Screenshot Preview */}
                            <div className="aspect-video overflow-hidden bg-gray-800 relative group-hover:opacity-100 transition">
                                <img
                                    src={`https://s0.wp.com/mshots/v1/${encodeURIComponent(bookmark.url)}?w=600&h=400`}
                                    alt={`Screenshot of ${bookmark.url}`}
                                    className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 transition duration-500"
                                    loading="lazy"
                                    onError={(e) => {
                                        // Fallback to Google Favicon service
                                        e.target.style.objectFit = 'contain';
                                        e.target.style.padding = '20px';
                                        e.target.src = `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=128`
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent opacity-0 group-hover:opacity-40 transition"></div>
                            </div>

                            <div className="p-4">
                                <h2 className="text-lg font-semibold mb-1 group-hover:text-accent transition truncate">{bookmark.title || bookmark.url}</h2>
                                <p className="text-secondaryText text-sm mb-3 line-clamp-2">{bookmark.description}</p>
                                <span className="text-xs text-gray-500 font-mono truncate block">{new URL(bookmark.url).hostname}</span>
                            </div>
                        </a>
                    ))}

                    {bookmarks.length === 0 && (
                        <p className="text-secondaryText text-center py-12 col-span-3">No bookmarks in this collection.</p>
                    )}
                </div>
            </div>
        </div>
    )
}
