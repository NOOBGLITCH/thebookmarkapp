import { useAuth } from '../context/AuthContext'
import { useBookmarks } from '../context/BookmarkContext'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import SearchBar from '../components/SearchBar'

export default function BookmarksView() {
    const { user } = useAuth()
    const { openEditModal, openAddModal, refreshTrigger } = useBookmarks()
    const [bookmarks, setBookmarks] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        if (user) {
            fetchBookmarks()
        }
    }, [user, refreshTrigger])

    const fetchBookmarks = async () => {
        try {
            const { data, error } = await supabase
                .from('bookmarks')
                .select(`
          *,
          bookmark_tags(
            tags(name)
          )
        `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error

            // Transform data to include tags array
            const bookmarksWithTags = data.map(bookmark => ({
                ...bookmark,
                tags: bookmark.bookmark_tags?.map(bt => bt.tags.name) || []
            }))

            setBookmarks(bookmarksWithTags)
        } catch (error) {
            console.error('Error fetching bookmarks:', error)
        } finally {
            setLoading(false)
        }
    }

    const deleteBookmark = async (id) => {
        if (!confirm('Are you sure you want to delete this bookmark?')) return

        try {
            // Manual cascading delete: remove related entries in bookmark_tags first
            const { error: tagError } = await supabase
                .from('bookmark_tags')
                .delete()
                .eq('bookmark_id', id)

            if (tagError) {
                console.error('Error deleting related tags:', tagError)
                // Continue trying to delete bookmark even if tag delete fails/returns empty
            }

            // Now delete the bookmark
            const { error } = await supabase
                .from('bookmarks')
                .delete()
                .eq('id', id)

            if (error) throw error

            // Update local state immediately
            setBookmarks(prev => prev.filter((b) => b.id !== id))
        } catch (error) {
            console.error('Error deleting bookmark:', error)
            alert(`Failed to delete bookmark: ${error.message}`)
        }
    }

    const highlightText = (text, query) => {
        if (!query || !text) return text

        const parts = text.split(new RegExp(`(${query})`, 'gi'))
        return parts.map((part, index) =>
            part.toLowerCase() === query.toLowerCase() ?
                <mark key={index} className="bg-yellow-400 text-black">{part}</mark> :
                part
        )
    }

    const filteredBookmarks = bookmarks.filter(bookmark => {
        if (!searchQuery) return true

        const query = searchQuery.toLowerCase()
        return (
            bookmark.title?.toLowerCase().includes(query) ||
            bookmark.url?.toLowerCase().includes(query) ||
            bookmark.description?.toLowerCase().includes(query) ||
            bookmark.tags?.some(tag => tag.toLowerCase().includes(query))
        )
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-accent text-xl">Loading bookmarks...</div>
            </div>
        )
    }

    return (
        <div>
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            <div className="px-8 pb-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-primaryText">All Bookmarks</h1>
                            <p className="text-secondaryText mt-1">
                                {filteredBookmarks.length} bookmark{filteredBookmarks.length !== 1 ? 's' : ''}
                                {searchQuery && ` (filtered from ${bookmarks.length})`}
                            </p>
                        </div>
                    </div>

                    {filteredBookmarks.length === 0 ? (
                        <div className="text-center py-16">
                            <svg className="w-24 h-24 mx-auto text-secondaryText mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                            <h3 className="text-xl font-semibold text-primaryText mb-2">
                                {searchQuery ? 'No bookmarks found' : 'No bookmarks yet'}
                            </h3>
                            <p className="text-secondaryText mb-6">
                                {searchQuery ? 'Try a different search term' : 'Start building your collection by adding your first bookmark'}
                            </p>
                            {!searchQuery && (
                                <button
                                    onClick={openAddModal}
                                    className="px-6 py-3 bg-accent hover:bg-accent/90 text-white font-semibold rounded-lg transition"
                                >
                                    Add Your First Bookmark
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredBookmarks.map(bookmark => (
                                <div
                                    key={bookmark.id}
                                    className="bg-surface rounded-lg overflow-hidden border border-gray-800 hover:border-accent transition group"
                                >
                                    {/* Screenshot Preview */}
                                    <div className="aspect-video overflow-hidden bg-gray-800 relative group-hover:opacity-100 transition">
                                        <img
                                            src={`https://s0.wp.com/mshots/v1/${encodeURIComponent(bookmark.url)}?w=600&h=400`}
                                            alt={`Screenshot of ${bookmark.url}`}
                                            className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 transition duration-500"
                                            loading="lazy"
                                            onError={(e) => {
                                                // Fallback to Google Favicon service which is very reliable for icons
                                                e.target.style.objectFit = 'contain';
                                                e.target.style.padding = '20px';
                                                e.target.src = `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=128`
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent opacity-0 group-hover:opacity-40 transition"></div>
                                    </div>

                                    <div className="p-4 relative">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-semibold text-primaryText text-lg line-clamp-1 group-hover:text-accent transition">
                                                <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                    {highlightText(bookmark.title || bookmark.url, searchQuery)}
                                                </a>
                                            </h3>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEditModal(bookmark)}
                                                    className="text-secondaryText hover:text-primaryText"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => deleteBookmark(bookmark.id)}
                                                    className="text-secondaryText hover:text-red-500"
                                                    title="Delete"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-secondaryText line-clamp-2 mb-3 h-10">
                                            {highlightText(bookmark.description || 'No description', searchQuery)}
                                        </p>
                                        {bookmark.tags && bookmark.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {bookmark.tags.map((tag, idx) => (
                                                    <span
                                                        key={idx}
                                                        onClick={() => setSearchQuery(tag)}
                                                        className={`px-2 py-1 text-xs rounded-full cursor-pointer transition ${searchQuery.toLowerCase() === tag.toLowerCase()
                                                            ? 'bg-yellow-400 text-black'
                                                            : 'bg-accent/20 text-accent hover:bg-accent/30'
                                                            }`}
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between mt-4 text-xs text-secondaryText">
                                            <span>{new Date(bookmark.created_at).toLocaleDateString()}</span>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openEditModal(bookmark)}
                                                    className="hover:text-accent transition"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => deleteBookmark(bookmark.id)}
                                                    className="hover:text-red-500 transition"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
