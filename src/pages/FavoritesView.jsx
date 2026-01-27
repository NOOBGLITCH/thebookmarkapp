import { useAuth } from '../context/AuthContext'
import { useBookmarks } from '../context/BookmarkContext'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import SearchBar from '../components/SearchBar'

export default function FavoritesView() {
    const { user } = useAuth()
    const { openEditModal, openAddModal, refreshTrigger } = useBookmarks()
    const [bookmarks, setBookmarks] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [favorites, setFavorites] = useState(() => {
        const saved = localStorage.getItem('bookmarkFavorites')
        return saved ? JSON.parse(saved) : []
    })

    useEffect(() => {
        if (user) {
            fetchBookmarks()
        }
    }, [user, refreshTrigger])

    // Listen for favorites changes from other tabs
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'bookmarkFavorites') {
                setFavorites(e.newValue ? JSON.parse(e.newValue) : [])
            }
        }
        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [])

    const fetchBookmarks = async () => {
        try {
            // Only fetch if we have favorites
            if (favorites.length === 0) {
                setLoading(false)
                return
            }

            const { data, error } = await supabase
                .from('bookmarks')
                .select(`
          id,
          url,
          title,
          description,
          created_at,
          bookmark_tags(
            tags(name)
          )
        `)
                .eq('user_id', user.id)
                .in('id', favorites)
                .order('created_at', { ascending: false })

            if (error) throw error

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
            await supabase.from('bookmark_tags').delete().eq('bookmark_id', id)
            await supabase.from('bookmarks').delete().eq('id', id).eq('user_id', user.id)
            setBookmarks(prev => prev.filter((b) => b.id !== id))
            window.dispatchEvent(new CustomEvent('refreshTags'))
        } catch (error) {
            console.error('Error deleting bookmark:', error)
        }
    }

    const toggleFavorite = (bookmarkId) => {
        const newFavorites = favorites.includes(bookmarkId)
            ? favorites.filter(id => id !== bookmarkId)
            : [...favorites, bookmarkId]
        setFavorites(newFavorites)
        localStorage.setItem('bookmarkFavorites', JSON.stringify(newFavorites))
        // Dispatch event for sidebar to update count
        window.dispatchEvent(new CustomEvent('favoritesChanged'))
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

    const favoriteBookmarks = bookmarks.filter(b => favorites.includes(b.id))

    const filteredBookmarks = favoriteBookmarks.filter(bookmark => {
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
                <div className="text-accent text-xl">Loading favorites...</div>
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
                            <h1 className="text-3xl font-bold text-primaryText">Favorite Bookmarks</h1>
                            <p className="text-secondaryText mt-1">
                                {filteredBookmarks.length} favorite{filteredBookmarks.length !== 1 ? 's' : ''}
                                {searchQuery && ` (filtered from ${favoriteBookmarks.length})`}
                            </p>
                        </div>
                    </div>

                    {filteredBookmarks.length === 0 ? (
                        <div className="text-center py-16">
                            <svg className="w-24 h-24 mx-auto text-secondaryText mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <h3 className="text-xl font-semibold text-primaryText mb-2">
                                {searchQuery ? 'No favorites found' : 'No favorites yet'}
                            </h3>
                            <p className="text-secondaryText mb-6">
                                {searchQuery ? 'Try a different search term' : 'Click the heart icon on bookmarks to add them to favorites'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredBookmarks.map(bookmark => (
                                <div
                                    key={bookmark.id}
                                    className="bg-surface rounded-lg overflow-hidden border border-gray-800 hover:border-accent transition group relative"
                                >
                                    {/* Favorite Heart Icon */}
                                    <button
                                        onClick={() => toggleFavorite(bookmark.id)}
                                        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-surface/80 hover:bg-surface transition-all"
                                        title="Remove from favorites"
                                    >
                                        <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 24 24">
                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                        </svg>
                                    </button>

                                    {/* Screenshot Preview */}
                                    <div className="aspect-video overflow-hidden bg-gray-800 relative group-hover:opacity-100 transition">
                                        <img
                                            src={`https://s0.wp.com/mshots/v1/${encodeURIComponent(bookmark.url)}?w=600&h=400`}
                                            alt={`Screenshot of ${bookmark.url}`}
                                            className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 transition duration-500"
                                            loading="lazy"
                                            onError={(e) => {
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
                                                        className="px-2 py-1 text-xs rounded-full bg-accent/20 text-accent"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between mt-4 text-xs text-secondaryText">
                                            <span>{new Date(bookmark.created_at).toLocaleDateString()}</span>
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
