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
    const [selectedTag, setSelectedTag] = useState(null)
    const [selectedBookmarks, setSelectedBookmarks] = useState([])
    const [favorites, setFavorites] = useState(() => {
        const saved = localStorage.getItem('bookmarkFavorites')
        return saved ? JSON.parse(saved) : []
    })

    useEffect(() => {
        if (user) {
            fetchBookmarks()
        }
    }, [user, refreshTrigger])

    // Listen for tag filter events from sidebar
    useEffect(() => {
        const handleTagFilter = (event) => {
            setSelectedTag(event.detail)
        }
        window.addEventListener('filterByTag', handleTagFilter)
        return () => window.removeEventListener('filterByTag', handleTagFilter)
    }, [])

    // Save favorites to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('bookmarkFavorites', JSON.stringify(favorites))
    }, [favorites])

    const toggleFavorite = (bookmarkId) => {
        // Optimistic update
        setFavorites(prev => {
            const newFavorites = prev.includes(bookmarkId)
                ? prev.filter(id => id !== bookmarkId)
                : [...prev, bookmarkId]

            // Sync with localStorage immediately
            localStorage.setItem('bookmarkFavorites', JSON.stringify(newFavorites))

            // Dispatch event for sidebar immediately
            window.dispatchEvent(new CustomEvent('favoritesChanged', { detail: newFavorites }))

            return newFavorites
        })
    }

    const fetchBookmarks = async () => {
        try {
            const { data, error } = await supabase
                .from('bookmarks')
                .select(`
          id,
          url,
          title,
          description,
          created_at,
          folder_id,
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

        console.log('🗑️ Starting delete for bookmark ID:', id)
        console.log('👤 Current user:', user?.id)

        try {
            // OPTIMISTIC UPDATE: Remove from UI immediately
            setBookmarks(prev => prev.filter(b => b.id !== id))

            // Remove from favorites if it was favorited
            const saved = localStorage.getItem('bookmarkFavorites')
            if (saved) {
                const favorites = JSON.parse(saved)
                if (favorites.includes(id)) {
                    const newFavorites = favorites.filter(fid => fid !== id)
                    localStorage.setItem('bookmarkFavorites', JSON.stringify(newFavorites))
                    window.dispatchEvent(new CustomEvent('favoritesChanged', { detail: newFavorites }))
                }
            }

            // Trigger tag refresh immediately
            window.dispatchEvent(new CustomEvent('refreshTags'))

            // Manual cascading delete: remove related entries in bookmark_tags first
            const { error: tagError } = await supabase
                .from('bookmark_tags')
                .delete()
                .eq('bookmark_id', id)

            if (tagError) {
                console.error('⚠️ Error deleting related tags:', tagError)
            }

            // Now delete the bookmark
            const { error } = await supabase
                .from('bookmarks')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id)

            if (error) throw error

        } catch (error) {
            console.error('❌ Error deleting bookmark:', error)
            alert(`Failed to delete bookmark: ${error.message}`)
            // Revert on error (optional, but good practice)
            fetchBookmarks()
        }
    }

    const handleBulkDelete = async () => {
        if (selectedBookmarks.length === 0) return

        if (!confirm(`Delete ${selectedBookmarks.length} bookmark(s)?`)) return

        try {
            for (const id of selectedBookmarks) {
                // Delete bookmark_tags first
                await supabase.from('bookmark_tags').delete().eq('bookmark_id', id)
                // Delete bookmark
                await supabase.from('bookmarks').delete().eq('id', id).eq('user_id', user.id)
            }

            setBookmarks(prev => prev.filter(b => !selectedBookmarks.includes(b.id)))
            setSelectedBookmarks([])

            // Trigger tag refresh to remove orphaned tags
            window.dispatchEvent(new CustomEvent('refreshTags'))
        } catch (error) {
            console.error('Bulk delete error:', error)
            alert('Failed to delete some bookmarks')
        }
    }

    const toggleBookmarkSelection = (id) => {
        setSelectedBookmarks(prev =>
            prev.includes(id) ? prev.filter(bid => bid !== id) : [...prev, id]
        )
    }

    const selectAll = () => {
        setSelectedBookmarks(filteredBookmarks.map(b => b.id))
    }

    const selectByTag = () => {
        if (!selectedTag) return
        const taggedBookmarks = filteredBookmarks.filter(b => b.tags?.includes(selectedTag))
        setSelectedBookmarks(taggedBookmarks.map(b => b.id))
    }

    const deselectAll = () => {
        setSelectedBookmarks([])
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
        // Filter by selected tag first
        if (selectedTag && !bookmark.tags?.includes(selectedTag)) {
            return false
        }

        // Then filter by search query
        if (!searchQuery) return true

        const query = searchQuery.toLowerCase()
        return (
            bookmark.title?.toLowerCase().includes(query) ||
            bookmark.url?.toLowerCase().includes(query) ||
            bookmark.description?.toLowerCase().includes(query) ||
            bookmark.tags?.some(tag => tag.toLowerCase().includes(query))
        )
    })

    // Remove duplicates by URL (keep most recent)
    const uniqueBookmarks = filteredBookmarks.reduce((acc, current) => {
        const existing = acc.find(b => b.url === current.url)
        if (!existing) {
            return [...acc, current]
        } else {
            // Keep the one with more recent created_at
            if (new Date(current.created_at) > new Date(existing.created_at)) {
                return acc.map(b => b.url === current.url ? current : b)
            }
            return acc
        }
    }, [])

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
                            <h1 className="text-3xl font-bold text-primaryText">
                                {selectedTag ? `Bookmarks tagged with "${selectedTag}"` : 'All Bookmarks'}
                            </h1>
                            <p className="text-secondaryText mt-1">
                                {uniqueBookmarks.length} bookmark{uniqueBookmarks.length !== 1 ? 's' : ''}
                                {(searchQuery || selectedTag) && ` (filtered from ${bookmarks.length})`}
                                {selectedBookmarks.length > 0 && ` • ${selectedBookmarks.length} selected`}
                            </p>
                        </div>
                        {filteredBookmarks.length > 0 && (
                            <div className="flex gap-2">
                                {selectedBookmarks.length > 0 ? (
                                    <>
                                        <button
                                            onClick={deselectAll}
                                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition text-sm"
                                        >
                                            Deselect All
                                        </button>
                                        <button
                                            onClick={handleBulkDelete}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Delete ({selectedBookmarks.length})
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={selectAll}
                                            className="px-4 py-2 bg-surface border border-gray-700 hover:border-accent text-primaryText rounded-lg transition text-sm"
                                        >
                                            Select All
                                        </button>
                                        {selectedTag && (
                                            <button
                                                onClick={selectByTag}
                                                className="px-4 py-2 bg-surface border border-gray-700 hover:border-accent text-primaryText rounded-lg transition text-sm"
                                            >
                                                Select Tagged
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {uniqueBookmarks.length === 0 ? (
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
                            {uniqueBookmarks.map(bookmark => (
                                <div
                                    key={bookmark.id}
                                    onClick={() => toggleBookmarkSelection(bookmark.id)}
                                    className={`bg-surface rounded-lg overflow-hidden border transition group relative cursor-pointer ${selectedBookmarks.includes(bookmark.id)
                                        ? 'border-accent ring-2 ring-accent/50 bg-accent/5'
                                        : selectedTag && bookmark.tags?.includes(selectedTag)
                                            ? 'border-accent ring-2 ring-accent/20'
                                            : 'border-gray-800 hover:border-accent'
                                        }`}
                                >
                                    {/* Selection Checkbox */}
                                    <div className="absolute top-3 left-3 z-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedBookmarks.includes(bookmark.id)}
                                            onChange={(e) => e.stopPropagation()}
                                            className="w-5 h-5 rounded border-gray-600 bg-surface text-accent focus:ring-accent focus:ring-offset-0 cursor-pointer pointer-events-none"
                                        />
                                    </div>
                                    {/* Favorite Heart Icon */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            toggleFavorite(bookmark.id)
                                        }}
                                        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-surface/80 hover:bg-surface transition-all"
                                        title={favorites.includes(bookmark.id) ? 'Remove from favorites' : 'Add to favorites'}
                                    >
                                        {favorites.includes(bookmark.id) ? (
                                            <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 24 24">
                                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5 text-gray-400 hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                        )}
                                    </button>
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
                                                <a
                                                    href={bookmark.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:underline"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {highlightText(bookmark.title || bookmark.url, searchQuery)}
                                                </a>
                                            </h3>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        openEditModal(bookmark)
                                                    }}
                                                    className="text-secondaryText hover:text-primaryText"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        deleteBookmark(bookmark.id)
                                                    }}
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
                                                        className={`px-2 py-1 text-xs rounded-full cursor-pointer transition ${selectedTag === tag
                                                            ? 'bg-accent text-white font-semibold ring-2 ring-accent/50'
                                                            : searchQuery.toLowerCase() === tag.toLowerCase()
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
